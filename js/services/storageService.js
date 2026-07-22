/**
 * Storage Service - Camada Unificada de Dados (Realtime Database + LocalStorage Fallback)
 * Sincroniza dados com o Firebase Realtime Database e mantém réplica local offline.
 */

import { getRealtimeDB, checkIsFirebaseActive } from '../firebaseClient.js';
import { UNIDADES_SEED, PUBLICOS_SEED, PERFIS_SEED, MODULOS_SEED, DEFAULT_ADMIN_PASSWORD } from '../config.js';

const STORAGE_KEYS = {
  UNIDADES: 'abib_gestao_unidades',
  PUBLICOS: 'abib_gestao_publicos',
  PERFIS: 'abib_gestao_perfis',
  MODULOS: 'abib_gestao_modulos',
  COMENSAIS: 'abib_gestao_comensais',
  CONFIG: 'abib_gestao_config'
};

// Inicialização de sementes (seeds) caso LocalStorage esteja vazio
export function seedInitialData() {
  if (!localStorage.getItem(STORAGE_KEYS.UNIDADES)) {
    localStorage.setItem(STORAGE_KEYS.UNIDADES, JSON.stringify(UNIDADES_SEED));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PUBLICOS)) {
    localStorage.setItem(STORAGE_KEYS.PUBLICOS, JSON.stringify(PUBLICOS_SEED));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERFIS)) {
    localStorage.setItem(STORAGE_KEYS.PERFIS, JSON.stringify(PERFIS_SEED));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MODULOS)) {
    localStorage.setItem(STORAGE_KEYS.MODULOS, JSON.stringify(MODULOS_SEED));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({
      adminPassword: DEFAULT_ADMIN_PASSWORD,
      divisaoPorRefeicao: false,
      sensibilidadeAlertaPct: 30,
      firebaseConfig: null
    }));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMENSAIS)) {
    localStorage.setItem(STORAGE_KEYS.COMENSAIS, JSON.stringify([]));
  }
}

// Leitura genérica de coleção
export async function getCollection(key) {
  seedInitialData();

  // Tentativa no Realtime Database se ativo
  if (checkIsFirebaseActive()) {
    try {
      const db = getRealtimeDB();
      const snapshot = await db.ref(key).once('value');
      const val = snapshot.val();
      if (val) {
        const docs = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
        // Atualiza réplica local
        localStorage.setItem(key, JSON.stringify(docs));
        return docs;
      }
    } catch (e) {
      console.warn(`[StorageService] Falha na leitura do Realtime DB (${key}). Usando cache local.`, e);
    }
  }

  // Fallback LocalStorage
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Escrita genérica em coleção
export async function saveCollection(key, items) {
  // Salva no LocalStorage imediatamente
  localStorage.setItem(key, JSON.stringify(items));

  // Salva no Realtime DB se ativo
  if (checkIsFirebaseActive()) {
    try {
      const db = getRealtimeDB();
      await db.ref(key).set(items);
      console.log(`[StorageService] Coleção ${key} sincronizada com Realtime Database.`);
    } catch (e) {
      console.error(`[StorageService] Erro ao sincronizar ${key} com Realtime DB:`, e);
    }
  }
}

// Salvar/Atualizar item único em coleção
export async function saveDoc(key, item) {
  const items = await getCollection(key);
  const index = items.findIndex(i => i.id === item.id || (i.data && i.data === item.data && i.unidadeId === item.unidadeId));

  if (index >= 0) {
    items[index] = { ...items[index], ...item, atualizadoEm: new Date().toISOString() };
  } else {
    if (!item.id) item.id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    item.criadoEm = new Date().toISOString();
    items.push(item);
  }

  await saveCollection(key, items);
  return item;
}

// Obter configurações globais
export async function getConfig() {
  seedInitialData();
  const config = localStorage.getItem(STORAGE_KEYS.CONFIG);
  return config ? JSON.parse(config) : {};
}

// Salvar configurações globais
export async function saveConfig(newConfig) {
  const current = await getConfig();
  const updated = { ...current, ...newConfig };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));

  if (checkIsFirebaseActive()) {
    try {
      const db = getRealtimeDB();
      await db.ref('configuracoes').set(updated);
    } catch (e) {
      console.warn("Erro ao salvar config no Realtime DB:", e);
    }
  }
  return updated;
}
