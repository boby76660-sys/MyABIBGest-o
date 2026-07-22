/**
 * Admin Service - Gerenciamento Administrativo
 * Unidades, Públicos, Perfis, Permissões de Campos por Perfil, Firebase Config e Backup
 */

import { getCollection, saveCollection, saveDoc, getConfig, saveConfig } from './storageService.js';
import { UNIDADES_SEED, PUBLICOS_SEED, PERFIS_SEED } from '../config.js';

// --- UNIDADES ---
export async function getUnidades() {
  const unidades = await getCollection('abib_gestao_unidades');
  return unidades.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export async function saveUnidade(unidadeData) {
  const unidades = await getUnidades();
  if (!unidadeData.id) {
    unidadeData.id = 'u_' + Date.now();
    unidadeData.ordem = unidades.length + 1;
    unidadeData.ativo = true;
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

// --- CONFIGURAÇÕES DO PAINEL ADMIN & FIREBASE ---
export async function getAdminConfig() {
  return await getConfig();
}

export async function updateAdminConfig(newSettings) {
  return await saveConfig(newSettings);
}

// --- BACKUP E RESTAURAÇÃO COMPLETA DE DADOS ---
export async function exportFullBackup() {
  const config = await getConfig();
  const unidades = await getCollection('abib_gestao_unidades');
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

export async function importFullBackup(backupObject) {
  if (!backupObject || !backupObject.unidades || !backupObject.comensais) {
    throw new Error("Arquivo de backup inválido.");
  }
  if (backupObject.config) await saveConfig(backupObject.config);
  if (backupObject.unidades) await saveCollection('abib_gestao_unidades', backupObject.unidades);
  if (backupObject.publicos) await saveCollection('abib_gestao_publicos', backupObject.publicos);
  if (backupObject.perfis) await saveCollection('abib_gestao_perfis', backupObject.perfis);
  if (backupObject.modulos) await saveCollection('abib_gestao_modulos', backupObject.modulos);
  if (backupObject.comensais) await saveCollection('abib_gestao_comensais', backupObject.comensais);
  return true;
}
