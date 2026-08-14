/**
 * Admin Service - Gerenciamento Administrativo
 * Unidades, Públicos, Perfis, Permissões de Campos por Perfil, Tokens e Firebase Config
 */

import { getCollection, saveCollection, saveDoc, getConfig, saveConfig } from './storageService.js';
import { DEFAULT_ADMIN_PASSWORD } from '../config.js';

// Gerador de Token Aleatório Fixo para Unidades (100% Imprevisível)
export function generateUnitToken(lojaName) {
  const cleanName = (lojaName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
  const randHash = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
  return `abib_${cleanName}_${randHash}`;
}

// --- UNIDADES ---
export async function getUnidades() {
  let unidades = await getCollection('abib_gestao_unidades');
  let hasMissingToken = false;

  unidades = unidades.map(u => {
    if (!u.tokenAcesso) {
      u.tokenAcesso = generateUnitToken(u.loja, u.codigo);
      hasMissingToken = true;
    }
    return u;
  });

  if (hasMissingToken) {
    await saveCollection('abib_gestao_unidades', unidades);
  }

  return unidades.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export async function getUnidadeByToken(token) {
  if (!token) return null;
  const unidades = await getUnidades();
  const tokenClean = token.trim().toLowerCase();

  // Buscar por tokenAcesso exato
  let found = unidades.find(u => u.ativo !== false && u.tokenAcesso && u.tokenAcesso.toLowerCase() === tokenClean);

  // Fallback seguro: se corresponder exatamente a um token gerado por código
  if (!found) {
    found = unidades.find(u => u.ativo !== false && (`abib_${u.id}`.toLowerCase() === tokenClean || `token_${u.codigo}`.toLowerCase() === tokenClean));
  }

  return found || null;
}

export async function regenerateUnitToken(unidadeId) {
  const unidades = await getUnidades();
  const target = unidades.find(u => u.id === unidadeId);
  if (target) {
    target.tokenAcesso = generateUnitToken(target.loja, Date.now().toString(36));
    await saveDoc('abib_gestao_unidades', target);
    return target;
  }
  return null;
}

export async function saveUnidade(unidadeData) {
  const unidades = await getUnidades();
  if (!unidadeData.id) {
    unidadeData.id = 'u_' + Date.now();
    unidadeData.ordem = unidades.length + 1;
    unidadeData.ativo = true;
    unidadeData.tokenAcesso = generateUnitToken(unidadeData.loja, unidadeData.codigo);
  }
  return await saveDoc('abib_gestao_unidades', unidadeData);
}

export async function reorderUnidades(newOrderedIds) {
  const unidades = await getUnidades();
  const updated = unidades.map(u => {
    const newIdx = newOrderedIds.indexOf(u.id);
    return newIdx >= 0 ? { ...u, ordem: newIdx + 1 } : u;
  });
  await saveCollection('abib_gestao_unidades', updated);
  return updated;
}

// --- PÚBLICOS / CATEGORIAS DE COMENSAIS ---
export async function getPublicos() {
  const publicos = await getCollection('abib_gestao_publicos');
  return publicos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export async function savePublico(publicoData) {
  const publicos = await getPublicos();
  if (!publicoData.id) {
    publicoData.id = 'pub_' + Date.now();
    publicoData.ordem = publicos.length + 1;
    publicoData.ativo = true;
  }
  return await saveDoc('abib_gestao_publicos', publicoData);
}

// --- PERFIS DE ACESSO & PERMISSÕES DE CAMPOS ---
export async function getPerfis() {
  return await getCollection('abib_gestao_perfis');
}

export async function savePerfil(perfilData) {
  if (!perfilData.id) {
    perfilData.id = 'p_' + Date.now();
  }
  if (!perfilData.permissoesCamposUnidade) {
    perfilData.permissoesCamposUnidade = ['loja'];
  }
  return await saveDoc('abib_gestao_perfis', perfilData);
}

export async function deletePerfil(perfilId) {
  const perfis = await getPerfis();
  const filtered = perfis.filter(p => p.id !== perfilId);
  await saveCollection('abib_gestao_perfis', filtered);
  return filtered;
}

// --- CONFIGURAÇÕES DO PAINEL ADMIN & VALIDAÇÃO DE SENHAS ---
export async function getAdminConfig() {
  return await getConfig();
}

export async function updateAdminConfig(newSettings) {
  return await saveConfig(newSettings);
}

export async function validateMasterPIN(inputPassword) {
  const config = await getConfig();
  const masterPass = config.adminPassword || DEFAULT_ADMIN_PASSWORD;
  return inputPassword && inputPassword.trim() === masterPass.trim();
}

export async function validateModulePIN(inputPassword, targetModule = null) {
  if (!inputPassword) return { valid: false, isMaster: false };
  const cleanPass = inputPassword.trim();
  const config = await getConfig();
  const masterPass = (config.adminPassword || DEFAULT_ADMIN_PASSWORD).trim();

  // A Senha Máster de Gerente sempre libera TUDO
  if (cleanPass === masterPass) {
    return { valid: true, isMaster: true };
  }

  // Validação por módulo específico
  if (targetModule === 'comensais') {
    const passCom = (config.passwordComensais || DEFAULT_COMENSAIS_PASSWORD).trim();
    if (cleanPass === passCom) return { valid: true, isMaster: false };
  } else if (targetModule === 'hortifruti') {
    const passHorti = (config.passwordHortifruti || DEFAULT_HORTIFRUTI_PASSWORD).trim();
    if (cleanPass === passHorti) return { valid: true, isMaster: false };
  }

  return { valid: false, isMaster: false };
}

// --- BACKUP E RESTAURAÇÃO COMPLETA DE DADOS ---
export async function exportFullBackup() {
  const config = await getConfig();
  const unidades = await getUnidades();
  const publicos = await getCollection('abib_gestao_publicos');
  const perfis = await getCollection('abib_gestao_perfis');
  const modulos = await getCollection('abib_gestao_modulos');
  const comensais = await getCollection('abib_gestao_comensais');

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    config,
    unidades,
    publicos,
    perfis,
    modulos,
    comensais
  };
}
