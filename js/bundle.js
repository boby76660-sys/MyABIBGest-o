/**
 * ABIB Gestão - JavaScript Bundle Unificado (Filtragem de Registros Zerados em Relatórios)
 */

(function () {
  'use strict';

  // --- MEMORY CACHE PARA RESPOSTA EM 0ms ---
  const memoryCache = new Map();

  function updateMemoryCache(key, data) {
    memoryCache.set(key, data);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  // --- TRAVA AUTOMÁTICA DE SCROLL DO BODY COM MODAL ABERTO (SEM LOOP RECURSIVO) ---
  function checkScrollLock() {
    const openModals = document.querySelectorAll('.modal:not(.hidden), .profile-modal-overlay:not(.hidden), .admin-auth-overlay:not(.hidden)');
    const shouldLock = openModals.length > 0;
    const isLocked = document.documentElement.classList.contains('modal-open');
    if (shouldLock && !isLocked) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else if (!shouldLock && isLocked) {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
  }

  // Previne rolagem de roda do mouse e touch no fundo escuro da modal
  if (typeof window !== 'undefined') {
    window.addEventListener('wheel', (e) => {
      if (document.documentElement.classList.contains('modal-open')) {
        const modalContent = e.target.closest('.modal-content, .profile-modal-card, .admin-auth-card');
        if (!modalContent) {
          e.preventDefault();
        }
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (document.documentElement.classList.contains('modal-open')) {
        const modalContent = e.target.closest('.modal-content, .profile-modal-card, .admin-auth-card');
        if (!modalContent) {
          e.preventDefault();
        }
      }
    }, { passive: false });
  }

  const modalScrollLockObserver = new MutationObserver(() => {
    modalScrollLockObserver.disconnect();
    checkScrollLock();
    startModalObserver();
  });

  function startModalObserver() {
    if (typeof document !== 'undefined' && document.body) {
      modalScrollLockObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        startModalObserver();
        checkScrollLock();
      });
    } else {
      startModalObserver();
      checkScrollLock();
    }
  }

  function getMemoryCache(key) {
    if (memoryCache.has(key)) {
      return memoryCache.get(key);
    }
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        memoryCache.set(key, parsed);
        return parsed;
      } catch (e) {}
    }
    return null;
  }

  // --- HELPER DE VALOR NUMÉRICO SEGURO (SEMPRE RETORNA STRING NUMÉRICA, '0' SE NULO/VAZIO) ---
  function ensureNumberValue(val) {
    if (val === null || val === undefined || val === '' || isNaN(val)) {
      return '0';
    }
    return String(val);
  }

  // --- HELPER DE CENSURA DE CNPJ ---
  function formatCensoredCNPJ(cnpjStr) {
    if (!cnpjStr) return '**.***.***/****-**';
    const digits = cnpjStr.replace(/\D/g, '');
    if (digits.length === 14) {
      const filial = digits.substring(8, 12);
      return `**.***.***/${filial}-**`;
    }
    return cnpjStr.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})-(\d{2})$/, '**.***.***/$4-**');
  }

  // --- HELPER DE FECHAMENTO COM ANIMAÇÃO REVERSA ---
  function closeModal(modalElement, onComplete) {
    if (!modalElement) {
      if (onComplete) onComplete();
      return;
    }

    modalElement.classList.add('closing');
    setTimeout(() => {
      modalElement.classList.remove('closing');
      if (modalElement.classList.contains('profile-modal-overlay') || (!modalElement.id && modalElement.parentElement === document.body)) {
        if (document.body.contains(modalElement)) {
          document.body.removeChild(modalElement);
        }
      } else {
        modalElement.classList.add('hidden');
      }
      if (onComplete) onComplete();
    }, 170);
  }

  // --- HELPER DE DATAS ---
  function shiftDateISO(dateISO, days) {
    if (!dateISO) dateISO = new Date().toISOString().split('T')[0];
    const d = new Date(dateISO + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // --- COMPONENTES NATIVOS DE INTERFACE CUSTOMIZADA (TOAST, CONFIRM, PROMPT) ---
  function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#2563eb';
    toast.style.cssText = `background: ${bg}; color: #ffffff; padding: 10px 16px; border-radius: 8px; font-size: 0.86rem; font-weight: 600; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2); opacity: 0; transform: translateY(10px); transition: all 0.25s ease; pointer-events: auto;`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  function showConfirm(message, title = "Confirmação de Ação") {
    return new Promise((resolve) => {
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal';
      modalOverlay.innerHTML = `
        <div class="modal-content" style="max-width: 420px;">
          <div class="modal-header">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-title);">${title}</h3>
          </div>
          <div class="modal-body" style="padding: 12px 0 18px 0; color: var(--text-body); font-size: 0.9rem; line-height: 1.4;">
            ${message}
          </div>
          <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary btn-cancel-confirm">Cancelar</button>
            <button class="btn btn-danger btn-ok-confirm">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalOverlay);

      const btnCancel = modalOverlay.querySelector('.btn-cancel-confirm');
      const btnOk = modalOverlay.querySelector('.btn-ok-confirm');

      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal(modalOverlay, () => resolve(false));
        }
      });

      btnCancel.addEventListener('click', () => {
        closeModal(modalOverlay, () => resolve(false));
      });

      btnOk.addEventListener('click', () => {
        closeModal(modalOverlay, () => resolve(true));
      });
    });
  }

  function showPrompt(message, defaultValue = '', title = "Digitação") {
    return new Promise((resolve) => {
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal';
      modalOverlay.innerHTML = `
        <div class="modal-content" style="max-width: 440px;">
          <div class="modal-header">
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-title);">${title}</h3>
          </div>
          <form id="form-custom-prompt">
            <div class="modal-body" style="padding: 12px 0 16px 0;">
              <p style="font-size: 0.88rem; color: var(--text-body); margin-bottom: 8px; font-weight: 500;">${message}</p>
              <input type="text" id="input-custom-prompt" class="input-field" value="${defaultValue}" required style="margin-top: 4px;">
            </div>
            <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary btn-cancel-prompt">Cancelar</button>
              <button type="submit" class="btn btn-primary">Confirmar</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modalOverlay);

      const input = modalOverlay.querySelector('#input-custom-prompt');
      input.focus();
      input.select();

      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal(modalOverlay, () => resolve(null));
        }
      });

      const btnCancel = modalOverlay.querySelector('.btn-cancel-prompt');
      const form = modalOverlay.querySelector('#form-custom-prompt');

      btnCancel.addEventListener('click', () => {
        closeModal(modalOverlay, () => resolve(null));
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        closeModal(modalOverlay, () => resolve(val));
      });
    });
  }

  // --- 1. CONFIGURAÇÃO E DADOS INICIAIS (SEEDS) ---
  const DEFAULT_ADMIN_PASSWORD = "Gestao@5170";

  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCLrj5WzSgu-wGU5bBAMeom-P3vH8hZHHQ",
    databaseURL: "https://myabib-gestao-default-rtdb.firebaseio.com/",
    projectId: "myabib-gestao",
    authDomain: "myabib-gestao.firebaseapp.com",
    storageBucket: "myabib-gestao.appspot.com"
  };

  const PUBLICOS_SEED = [
    { id: "pub_ticket", nome: "Tickets", ordem: 1, ativo: true },
    { id: "pub_garra", nome: "Garra / Estrela D'Alva", ordem: 2, ativo: true },
    { id: "pub_promotores_cartao", nome: "Promotores ou Motoristas - Cartão", ordem: 3, ativo: true },
    { id: "pub_promotores_pix", nome: "Promotores ou Motoristas - Pix", ordem: 4, ativo: true },
    { id: "pub_assinaturas", nome: "Assinaturas", ordem: 5, ativo: true }
  ];

  const UNIDADES_SEED = [
    { id: "u239", codigo: "239", grupo: "AC", loja: "ITABIRA", unidade: "MATRIZ", cnpj: "44.509.964/0001-35", tokenAcesso: "abib_itabira_239", ordem: 1, ativo: true },
    { id: "u220", codigo: "220", grupo: "AC", loja: "UBÁ", unidade: "FILIAL 1", cnpj: "44.509.964/0002-16", tokenAcesso: "abib_uba_220", ordem: 2, ativo: true },
    { id: "u253", codigo: "253", grupo: "AC", loja: "JUIZ DE FORA II", unidade: "FILIAL 2", cnpj: "44.509.964/0003-05", tokenAcesso: "abib_juizdeforaii_253", ordem: 3, ativo: true },
    { id: "u206", codigo: "206", grupo: "AC", loja: "JUIZ DE FORA I", unidade: "FILIAL 3", cnpj: "44.509.964/0004-88", tokenAcesso: "abib_juizdeforai_206", ordem: 4, ativo: true },
    { id: "u230", codigo: "230", grupo: "AC", loja: "BARBACENA", unidade: "FILIAL 4", cnpj: "44.509.964/0005-69", tokenAcesso: "abib_barbacena_230", ordem: 5, ativo: true },
    { id: "u257", codigo: "257", grupo: "AC", loja: "CONGONHAS", unidade: "FILIAL 5", cnpj: "44.509.964/0006-40", tokenAcesso: "abib_congonhas_257", ordem: 6, ativo: true },
    { id: "u234", codigo: "234", grupo: "AC", loja: "CONSELHEIRO LAFAIETE", unidade: "FILIAL 6", cnpj: "44.509.964/0007-20", tokenAcesso: "abib_conselheirolafaiete_234", ordem: 7, ativo: true },
    { id: "u241", codigo: "241", grupo: "AC", loja: "SÃO JOÃO DEL REI", unidade: "FILIAL 7", cnpj: "44.509.964/0008-01", tokenAcesso: "abib_saojoaodelrei_241", ordem: 8, ativo: true },
    { id: "u217", codigo: "217", grupo: "ABIB", loja: "SANTANA DO PARAÍSO", unidade: "MATRIZ", cnpj: "25.191.364/0001-27", tokenAcesso: "abib_santanadoparaiso_217", ordem: 9, ativo: true },
    { id: "u244", codigo: "244", grupo: "ABIB", loja: "JOÃO MONLEVADE", unidade: "FILIAL 1", cnpj: "25.191.364/0002-08", tokenAcesso: "abib_joaomonlevade_244", ordem: 10, ativo: true },
    { id: "u255", codigo: "255", grupo: "ABIB", loja: "LEOPOLDINA", unidade: "FILIAL 2", cnpj: "25.191.364/0003-99", tokenAcesso: "abib_leopoldina_255", ordem: 11, ativo: true },
    { id: "u256", codigo: "256", grupo: "ABIB", loja: "CARATINGA", unidade: "FILIAL 3", cnpj: "25.191.364/0004-70", tokenAcesso: "abib_caratinga_256", ordem: 12, ativo: true },
    { id: "u224", codigo: "224", grupo: "ABIB", loja: "PARACATU", unidade: "FILIAL 4", cnpj: "25.191.364/0005-50", tokenAcesso: "abib_paracatu_224", ordem: 13, ativo: true },
    { id: "u240", codigo: "240", grupo: "ABIB", loja: "UNAÍ", unidade: "FILIAL 5", cnpj: "25.191.364/0006-31", tokenAcesso: "abib_unai_240", ordem: 14, ativo: true },
    { id: "u219", codigo: "219", grupo: "MOC", loja: "MONTES CLAROS I", unidade: "MATRIZ", cnpj: "50.940.370/0001-87", tokenAcesso: "abib_montesclarosi_219", ordem: 15, ativo: true },
    { id: "u259", codigo: "259", grupo: "MOC", loja: "MONTES CLAROS II", unidade: "FILIAL 1", cnpj: "50.940.370/0002-68", tokenAcesso: "abib_montesclarosii_259", ordem: 16, ativo: true },
    { id: "u260", codigo: "260", grupo: "MOC", loja: "MONTES CLAROS III", unidade: "FILIAL 2", cnpj: "50.940.370/0003-49", tokenAcesso: "abib_montesclarosiii_260", ordem: 17, ativo: true },
    { id: "u250", codigo: "250", grupo: "MOC", loja: "JANAÚBA", unidade: "FILIAL 3", cnpj: "50.940.370/0004-20", tokenAcesso: "abib_janauba_250", ordem: 18, ativo: true },
    { id: "u267", codigo: "267", grupo: "MOC", loja: "CURVELO", unidade: "FILIAL 4", cnpj: "50.940.370/0005-00", tokenAcesso: "abib_curvelo_267", ordem: 19, ativo: true },
    { id: "u272", codigo: "272", grupo: "MOC", loja: "PIRAPORA", unidade: "FILIAL 5", cnpj: "50.940.370/0006-91", tokenAcesso: "abib_pirapora_272", ordem: 20, ativo: true },
    { id: "u274", codigo: "274", grupo: "MOC", loja: "JANUÁRIA", unidade: "FILIAL 6", cnpj: "50.940.370/0007-72", tokenAcesso: "abib_januaria_274", ordem: 21, ativo: true }
  ];

  const PERFIS_SEED = [
    {
      id: "p_padrao",
      nome: "Perfil Padrão",
      descricao: "Acesso completo a todas as funções e módulos do sistema.",
      icone: "",
      modulos: ["comensais", "hortifruti"],
      permissoesCamposUnidade: ["codigo", "grupo", "loja", "unidade", "cnpj"]
    },
    {
      id: "p_nutri_geral",
      nome: "Nutricionista Geral",
      descricao: "Responsável pelo lançamento diário de comensais, cotação de hortifrúti e acompanhamento geral das 21 unidades.",
      icone: "",
      modulos: ["comensais", "hortifruti"],
      permissoesCamposUnidade: ["loja"]
    },
    {
      id: "p_nutri_gestora",
      nome: "Nutricionista Gestora",
      descricao: "Acompanhamento regional das unidades sob sua gestão (compras, cotações e suporte).",
      icone: "",
      modulos: ["comensais", "hortifruti"],
      permissoesCamposUnidade: ["loja", "grupo", "unidade"]
    },
    {
      id: "p_diretoria",
      nome: "Gestão & Diretoria",
      descricao: "Acesso a relatórios consolidados, auditoria de NFs, cotações de hortifrúti e detalhamento de unidades.",
      icone: "",
      modulos: ["comensais", "hortifruti"],
      permissoesCamposUnidade: ["codigo", "grupo", "loja", "unidade", "cnpj"]
    }
  ];

  const MODULOS_SEED = [
    {
      id: "comensais",
      chave: "comensais",
      nome: "Comensais Diários",
      descricao: "Registro diário de refeições vendidas por unidade e público.",
      icone: "",
      ativo: true,
      ordem: 1
    },
    {
      id: "hortifruti",
      chave: "hortifruti",
      nome: "Hortifrúti Semanal",
      descricao: "Cotação Sacolão x Mart Minas, apoio a pedidos e auditoria mensal de NFs.",
      icone: "",
      ativo: true,
      ordem: 2
    }
  ];

  const PRODUTOS_HORTIFRUTI_SEED = [
    { id: "hprod_abacaxi", nome: "Abacaxi", unidadeMedida: "un", categoria: "Frutas", ordem: 1, ativo: true },
    { id: "hprod_abobrinha", nome: "Abobrinha", unidadeMedida: "kg", categoria: "Legumes", ordem: 2, ativo: true },
    { id: "hprod_batata_doce", nome: "Batata Doce", unidadeMedida: "kg", categoria: "Legumes", ordem: 3, ativo: true },
    { id: "hprod_batata_inglesa", nome: "Batata Inglesa", unidadeMedida: "kg", categoria: "Legumes", ordem: 4, ativo: true },
    { id: "hprod_beterraba", nome: "Beterraba", unidadeMedida: "kg", categoria: "Legumes", ordem: 5, ativo: true },
    { id: "hprod_brocolis", nome: "Brócolis", unidadeMedida: "un", categoria: "Verduras", ordem: 6, ativo: true },
    { id: "hprod_cebola", nome: "Cebola", unidadeMedida: "kg", categoria: "Legumes", ordem: 7, ativo: true },
    { id: "hprod_cenoura", nome: "Cenoura", unidadeMedida: "kg", categoria: "Legumes", ordem: 8, ativo: true },
    { id: "hprod_chuchu", nome: "Chuchu", unidadeMedida: "kg", categoria: "Legumes", ordem: 9, ativo: true },
    { id: "hprod_inhame", nome: "Inhame", unidadeMedida: "kg", categoria: "Legumes", ordem: 10, ativo: true },
    { id: "hprod_laranja", nome: "Laranja", unidadeMedida: "kg", categoria: "Frutas", ordem: 11, ativo: true },
    { id: "hprod_mamao_formoso", nome: "Mamão Formoso", unidadeMedida: "kg", categoria: "Frutas", ordem: 12, ativo: true },
    { id: "hprod_mandioca", nome: "Mandioca", unidadeMedida: "kg", categoria: "Legumes", ordem: 13, ativo: true },
    { id: "hprod_melao", nome: "Melão", unidadeMedida: "kg", categoria: "Frutas", ordem: 14, ativo: true },
    { id: "hprod_moranga", nome: "Moranga / Abóbora", unidadeMedida: "kg", categoria: "Legumes", ordem: 15, ativo: true },
    { id: "hprod_ovo", nome: "Ovo", unidadeMedida: "pente", categoria: "Ovos", ordem: 16, ativo: true },
    { id: "hprod_pepino", nome: "Pepino", unidadeMedida: "kg", categoria: "Legumes", ordem: 17, ativo: true },
    { id: "hprod_pimentao_verde", nome: "Pimentão Verde", unidadeMedida: "kg", categoria: "Legumes", ordem: 18, ativo: true },
    { id: "hprod_quiabo", nome: "Quiabo", unidadeMedida: "kg", categoria: "Legumes", ordem: 19, ativo: true },
    { id: "hprod_repolho", nome: "Repolho", unidadeMedida: "kg", categoria: "Verduras", ordem: 20, ativo: true },
    { id: "hprod_tomate", nome: "Tomate", unidadeMedida: "kg", categoria: "Legumes", ordem: 21, ativo: true }
  ];

  // --- 2. FIREBASE CLIENT E LISTENER TEMPO REAL ---
  let rtdb = null;
  let isFirebaseActive = false;
  const collectionListeners = new Set();

  function subscribeRealtimeSync() {
    if (!checkIsFirebaseActive()) return;

    Object.values(STORAGE_KEYS).forEach(key => {
      if (collectionListeners.has(key)) return;
      collectionListeners.add(key);

      try {
        getRealtimeDB().ref(key).on('value', snapshot => {
          const val = snapshot.val();
          if (val !== null && val !== undefined) {
            const docs = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
            updateMemoryCache(key, docs);
            window.dispatchEvent(new CustomEvent('abib_realtime_update', { detail: { key, docs } }));
          }
        });
      } catch (e) {
        console.warn("Erro ao registrar listener Firebase:", key, e);
      }
    });
  }

  // Sincronia entre abas locais via evento Storage
  window.addEventListener('storage', (e) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      try {
        const docs = JSON.parse(e.newValue || '[]');
        updateMemoryCache(e.key, docs);
        window.dispatchEvent(new CustomEvent('abib_realtime_update', { detail: { key: e.key, docs } }));
      } catch (err) {}
    }
  });

  function initFirebase(config) {
    if (!config || !config.apiKey || (!config.databaseURL && !config.projectId)) {
      isFirebaseActive = false;
      rtdb = null;
      return false;
    }

    try {
      if (window.firebase && window.firebase.apps) {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(config);
        }
        rtdb = window.firebase.database();
        isFirebaseActive = true;
        subscribeRealtimeSync();
        return true;
      }
    } catch (err) {
      isFirebaseActive = false;
      return false;
    }
  }

  function getRealtimeDB() { return rtdb; }
  function checkIsFirebaseActive() { return isFirebaseActive; }

  // --- 3. STORAGE SERVICE INSTANTÂNEO EM MEMÓRIA (0ms DE LATÊNCIA) ---
  const STORAGE_KEYS = {
    UNIDADES: 'abib_gestao_unidades',
    PUBLICOS: 'abib_gestao_publicos',
    PERFIS: 'abib_gestao_perfis',
    MODULOS: 'abib_gestao_modulos',
    COMENSAIS: 'abib_gestao_comensais',
    CONFIG: 'abib_gestao_config',
    HORTIFRUTI_PRODUTOS: 'abib_gestao_hortifruti_produtos',
    HORTIFRUTI_PEDIDOS: 'abib_gestao_hortifruti_pedidos'
  };

  function seedInitialData() {
    if (!localStorage.getItem(STORAGE_KEYS.UNIDADES)) {
      updateMemoryCache(STORAGE_KEYS.UNIDADES, UNIDADES_SEED);
    }
    const storedPublicos = localStorage.getItem(STORAGE_KEYS.PUBLICOS);
    if (!storedPublicos) {
      updateMemoryCache(STORAGE_KEYS.PUBLICOS, PUBLICOS_SEED);
    } else {
      try {
        const parsed = JSON.parse(storedPublicos);
        const hasNewPublicos = parsed.some(p => p.id === 'pub_promotores_cartao' || p.id === 'pub_promotores_pix' || p.id === 'pub_assinaturas');
        if (!hasNewPublicos) {
          updateMemoryCache(STORAGE_KEYS.PUBLICOS, PUBLICOS_SEED);
        }
      } catch (e) {
        updateMemoryCache(STORAGE_KEYS.PUBLICOS, PUBLICOS_SEED);
      }
    }
    const storedPerfis = localStorage.getItem(STORAGE_KEYS.PERFIS);
    if (!storedPerfis) {
      updateMemoryCache(STORAGE_KEYS.PERFIS, PERFIS_SEED);
    } else {
      try {
        const parsed = JSON.parse(storedPerfis);
        const hasHorti = parsed.some(p => p.modulos && p.modulos.includes('hortifruti'));
        if (!hasHorti) {
          const updatedPerfis = parsed.map(p => ({
            ...p,
            modulos: p.modulos ? Array.from(new Set([...p.modulos, 'hortifruti'])) : ['comensais', 'hortifruti']
          }));
          updateMemoryCache(STORAGE_KEYS.PERFIS, updatedPerfis);
        }
      } catch (e) {
        updateMemoryCache(STORAGE_KEYS.PERFIS, PERFIS_SEED);
      }
    }

    const storedModulos = localStorage.getItem(STORAGE_KEYS.MODULOS);
    if (!storedModulos) {
      updateMemoryCache(STORAGE_KEYS.MODULOS, MODULOS_SEED);
    } else {
      try {
        const parsed = JSON.parse(storedModulos);
        const hasHortiMod = parsed.some(m => m.id === 'hortifruti');
        if (!hasHortiMod) {
          updateMemoryCache(STORAGE_KEYS.MODULOS, MODULOS_SEED);
        }
      } catch (e) {
        updateMemoryCache(STORAGE_KEYS.MODULOS, MODULOS_SEED);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      updateMemoryCache(STORAGE_KEYS.CONFIG, {
        adminPassword: DEFAULT_ADMIN_PASSWORD,
        passwordComensais: DEFAULT_COMENSAIS_PASSWORD,
        passwordHortifruti: DEFAULT_HORTIFRUTI_PASSWORD,
        openRouterApiKey: '',
        openRouterModel: 'google/gemini-2.5-flash',
        divisaoPorRefeicao: false,
        sensibilidadeAlertaPct: 30,
        permitirTrocaPerfil: false,
        firebaseConfig: DEFAULT_FIREBASE_CONFIG
      });
    } else {
      try {
        const cfg = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG));
        let changed = false;
        if (!cfg.adminPassword || cfg.adminPassword === 'admin123') {
          cfg.adminPassword = DEFAULT_ADMIN_PASSWORD;
          changed = true;
        }
        if (!cfg.passwordComensais || cfg.passwordComensais === 'comensais123') {
          cfg.passwordComensais = DEFAULT_COMENSAIS_PASSWORD;
          changed = true;
        }
        if (!cfg.passwordHortifruti || cfg.passwordHortifruti === 'hortifruti123') {
          cfg.passwordHortifruti = DEFAULT_HORTIFRUTI_PASSWORD;
          changed = true;
        }
        if (!cfg.openRouterModel) {
          cfg.openRouterModel = 'google/gemini-2.5-flash';
          changed = true;
        }
        if (changed) {
          updateMemoryCache(STORAGE_KEYS.CONFIG, cfg);
        }
      } catch (e) {}
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMENSAIS)) {
      updateMemoryCache(STORAGE_KEYS.COMENSAIS, []);
    }
    const storedHorti = localStorage.getItem(STORAGE_KEYS.HORTIFRUTI_PRODUTOS);
    if (!storedHorti || storedHorti === 'undefined' || storedHorti === 'null' || (storedHorti && JSON.parse(storedHorti).length !== PRODUTOS_HORTIFRUTI_SEED.length)) {
      updateMemoryCache(STORAGE_KEYS.HORTIFRUTI_PRODUTOS, PRODUTOS_HORTIFRUTI_SEED);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HORTIFRUTI_PEDIDOS)) {
      updateMemoryCache(STORAGE_KEYS.HORTIFRUTI_PEDIDOS, []);
    }
  }

  async function getCollection(key) {
    seedInitialData();

    // 1. Retorno síncrono e ultra-rápido (0ms) do Memory Cache / LocalStorage
    const cached = getMemoryCache(key);
    if (cached) {
      // 2. Se Firebase estiver ativo, garante que o listener esteja escutando
      if (checkIsFirebaseActive()) {
        subscribeRealtimeSync();
      }
      return cached;
    }

    return [];
  }

  async function saveCollection(key, items) {
    updateMemoryCache(key, items);
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {}

    if (checkIsFirebaseActive()) {
      try {
        getRealtimeDB().ref(key).set(items).catch(() => {});
      } catch (e) {}
    }
    window.dispatchEvent(new CustomEvent('abib_realtime_update', { detail: { key, docs: items } }));
  }

  async function saveDoc(key, item) {
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

  async function getConfig() {
    seedInitialData();
    const config = getMemoryCache(STORAGE_KEYS.CONFIG);
    return config || {};
  }

  async function saveConfig(newConfig) {
    const current = await getConfig();
    const updated = { ...current, ...newConfig };
    updateMemoryCache(STORAGE_KEYS.CONFIG, updated);

    if (checkIsFirebaseActive()) {
      try {
        getRealtimeDB().ref('configuracoes').set(updated);
      } catch (e) {}
    }
    return updated;
  }

  // --- 4. ALGORITMO DE BUSCA INTELIGENTE CALIBRADO ---
  function normalizeText(text) {
    if (!text) return '';
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  function fuzzyMatchUnidade(unidade, query) {
    if (!query) return true;

    const qClean = normalizeText(query);
    if (!qClean) return true;

    const loja = normalizeText(unidade.loja);
    const grupo = normalizeText(unidade.grupo);
    const codigo = normalizeText(unidade.codigo);
    const tipoUnidade = normalizeText(unidade.unidade);

    const fullText = `${loja} ${grupo} ${codigo} ${tipoUnidade}`;

    if (fullText.includes(qClean)) return true;

    const ALIASES = {
      'moc': ['montes claros', 'moc'],
      'jf': ['juiz de fora', 'jf'],
      'sjd': ['sao joao del rei', 'sjd'],
      'lafaiete': ['conselheiro lafaiete'],
      'monlevade': ['joao monlevade'],
      'paraiso': ['santana do paraiso']
    };

    const queryWords = qClean.split(/\s+/).filter(Boolean);

    for (const qWord of queryWords) {
      if (ALIASES[qWord]) {
        const targets = ALIASES[qWord];
        if (targets.some(t => fullText.includes(t))) {
          const otherWords = queryWords.filter(w => w !== qWord);
          if (otherWords.length === 0) return true;
          if (otherWords.every(w => fullText.includes(w))) return true;
        }
      }
    }

    const textWords = fullText.split(/\s+/).filter(Boolean);

    return queryWords.every(qWord => {
      return textWords.some(tWord => {
        if (tWord.startsWith(qWord)) return true;
        if (qWord === tWord) return true;
        return false;
      });
    });
  }

  // --- 5. ADMIN SERVICE & TOKENS DE UNIDADE (100% IMPREVISÍVEL) ---
  function generateUnitToken(lojaName) {
    const cleanName = (lojaName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
    const randHash = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
    return `abib_${cleanName}_${randHash}`;
  }

  async function getUnidades() {
    let unidades = await getCollection(STORAGE_KEYS.UNIDADES);
    let hasMissingToken = false;

    unidades = unidades.map(u => {
      if (!u.tokenAcesso) {
        u.tokenAcesso = generateUnitToken(u.loja, u.codigo);
        hasMissingToken = true;
      }
      return u;
    });

    if (hasMissingToken) {
      await saveCollection(STORAGE_KEYS.UNIDADES, unidades);
    }

    return unidades.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  async function getUnidadeByToken(token) {
    if (!token) return null;
    const unidades = await getUnidades();
    const tokenClean = token.trim().toLowerCase();

    let found = unidades.find(u => u.ativo !== false && u.tokenAcesso && u.tokenAcesso.toLowerCase() === tokenClean);
    if (!found) {
      found = unidades.find(u => u.ativo !== false && (`abib_${u.id}`.toLowerCase() === tokenClean || `token_${u.codigo}`.toLowerCase() === tokenClean));
    }
    return found || null;
  }

  async function regenerateUnitToken(unidadeId) {
    const unidades = await getUnidades();
    const target = unidades.find(u => u.id === unidadeId);
    if (target) {
      target.tokenAcesso = generateUnitToken(target.loja, Date.now().toString(36));
      await saveDoc(STORAGE_KEYS.UNIDADES, target);
      return target;
    }
    return null;
  }

  async function validateMasterPIN(inputPassword) {
    const config = await getConfig();
    const masterPass = config.adminPassword || 'Gestao@5170';
    return inputPassword && inputPassword.trim() === masterPass.trim();
  }

  async function validateModulePIN(inputPassword, targetModule = null) {
    if (!inputPassword) return { valid: false, isMaster: false };
    const cleanPass = inputPassword.trim();
    const config = await getConfig();
    const masterPass = (config.adminPassword || 'Gestao@5170').trim();

    if (cleanPass === masterPass) {
      return { valid: true, isMaster: true };
    }

    if (targetModule === 'comensais') {
      const passCom = (config.passwordComensais || 'Comensais@3928').trim();
      if (cleanPass === passCom) return { valid: true, isMaster: false };
    } else if (targetModule === 'hortifruti') {
      const passHorti = (config.passwordHortifruti || 'Hortifruti@6481').trim();
      if (cleanPass === passHorti) return { valid: true, isMaster: false };
    }

    return { valid: false, isMaster: false };
  }

  async function saveUnidade(unidadeData) {
    const unidades = await getUnidades();
    if (!unidadeData.id) {
      unidadeData.id = 'u_' + Date.now();
      unidadeData.ordem = unidades.length + 1;
      unidadeData.ativo = true;
      unidadeData.tokenAcesso = generateUnitToken(unidadeData.loja, unidadeData.codigo);
    }
    return await saveDoc(STORAGE_KEYS.UNIDADES, unidadeData);
  }

  async function getPublicos() {
    const publicos = await getCollection(STORAGE_KEYS.PUBLICOS);
    return publicos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  async function savePublico(publicoData) {
    const publicos = await getPublicos();
    if (!publicoData.id) {
      publicoData.id = 'pub_' + Date.now();
      publicoData.ordem = publicos.length + 1;
      publicoData.ativo = true;
    }
    return await saveDoc(STORAGE_KEYS.PUBLICOS, publicoData);
  }

  async function getPerfis() {
    const perfis = await getCollection(STORAGE_KEYS.PERFIS);
    const hasPadrao = perfis.some(p => p.id === 'p_padrao' || p.nome === 'Perfil Padrão');
    if (!hasPadrao) {
      const padrao = {
        id: "p_padrao",
        nome: "Perfil Padrão",
        descricao: "Acesso completo a todas as funções e módulos do sistema.",
        icone: "",
        modulos: ["comensais"],
        permissoesCamposUnidade: ["codigo", "grupo", "loja", "unidade", "cnpj"]
      };
      perfis.unshift(padrao);
      await saveCollection(STORAGE_KEYS.PERFIS, perfis);
    }
    return perfis;
  }

  async function savePerfil(perfilData) {
    if (!perfilData.id) perfilData.id = 'p_' + Date.now();
    if (!perfilData.permissoesCamposUnidade) perfilData.permissoesCamposUnidade = ['loja'];
    if (!perfilData.modulos) perfilData.modulos = ['comensais'];
    return await saveDoc(STORAGE_KEYS.PERFIS, perfilData);
  }

  async function deletePerfil(perfilId) {
    const perfis = await getPerfis();
    const filtered = perfis.filter(p => p.id !== perfilId);
    await saveCollection(STORAGE_KEYS.PERFIS, filtered);
    return filtered;
  }

  async function exportFullBackup() {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      config: await getConfig(),
      unidades: await getCollection(STORAGE_KEYS.UNIDADES),
      publicos: await getCollection(STORAGE_KEYS.PUBLICOS),
      perfis: await getCollection(STORAGE_KEYS.PERFIS),
      modulos: await getCollection(STORAGE_KEYS.MODULOS),
      comensais: await getCollection(STORAGE_KEYS.COMENSAIS)
    };
  }

  async function importFullBackup(backupObject) {
    if (!backupObject || !backupObject.unidades || !backupObject.comensais) {
      throw new Error("Arquivo de backup inválido.");
    }
    if (backupObject.config) await saveConfig(backupObject.config);
    if (backupObject.unidades) await saveCollection(STORAGE_KEYS.UNIDADES, backupObject.unidades);
    if (backupObject.publicos) await saveCollection(STORAGE_KEYS.PUBLICOS, backupObject.publicos);
    if (backupObject.perfis) await saveCollection(STORAGE_KEYS.PERFIS, backupObject.perfis);
    if (backupObject.modulos) await saveCollection(STORAGE_KEYS.MODULOS, backupObject.modulos);
    if (backupObject.comensais) await saveCollection(STORAGE_KEYS.COMENSAIS, backupObject.comensais);
    return true;
  }

  // --- 6. COMENSAIS SERVICE & IA VISION (OPENROUTER) ---
  async function saveComensaisRegistro(registroData) {
    const id = `reg_${registroData.data}_${registroData.unidadeId}`;
    return await saveDoc(STORAGE_KEYS.COMENSAIS, {
      id,
      ...registroData,
      atualizadoEm: new Date().toISOString()
    });
  }

  async function saveComensaisLote(unidadeId, registrosArray) {
    const todos = await getCollection(STORAGE_KEYS.COMENSAIS);
    const nowISO = new Date().toISOString();

    registrosArray.forEach(reg => {
      const dataISO = reg.data || reg.dataISO;
      if (!dataISO) return;

      const id = `reg_${dataISO}_${unidadeId}`;
      const idx = todos.findIndex(r => r.id === id || (r.data === dataISO && r.unidadeId === unidadeId));
      
      const docData = {
        id,
        unidadeId,
        data: dataISO,
        publicos: reg.publicos || {},
        observacao: reg.observacao || '',
        atualizadoEm: nowISO
      };

      if (idx >= 0) {
        todos[idx] = { ...todos[idx], ...docData };
      } else {
        docData.criadoEm = nowISO;
        todos.push(docData);
      }
    });

    await saveCollection(STORAGE_KEYS.COMENSAIS, todos);
    return todos;
  }

  // Obter configurações da IA
  async function getAiConfig() {
    const config = await getConfig();
    return {
      apiKey: config.openRouterApiKey || '',
      model: config.openRouterModel || 'google/gemini-2.5-flash'
    };
  }

  // Salvar configurações da IA
  async function saveAiConfig({ apiKey, model }) {
    const current = await getConfig();
    const updated = {
      ...current,
      openRouterApiKey: (apiKey || '').trim(),
      openRouterModel: (model || '').trim() || 'google/gemini-2.5-flash'
    };
    return await saveConfig(updated);
  }

  // Comprimir imagem para base64 JPEG via Canvas
  function compressImageFile(file, maxDimension = 1800, quality = 0.85) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('Arquivo não é uma imagem válida.'));
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Falha ao carregar a imagem na memória.'));
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // Testar conexão com o OpenRouter
  async function testOpenRouterConnection(apiKey, modelName) {
    if (!apiKey) throw new Error('Chave API não informada.');
    const model = modelName || 'google/gemini-2.5-flash';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://gestao-abib.local',
        'X-Title': 'Gestao ABIB'
      },
      body: JSON.stringify({
        model: model.trim(),
        messages: [{ role: "user", content: "Responda apenas 'OK'." }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Erro de autenticação (Status ${response.status})`);
    }
    return true;
  }

  // Extrair comensais de imagens via OpenRouter
  async function extractComensaisFromImages(imageFiles, options = {}) {
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('Nenhuma imagem foi selecionada para processamento.');
    }

    const aiConfig = await getAiConfig();
    if (!aiConfig.apiKey) {
      throw new Error('A Chave API do OpenRouter não foi informada. Por favor, configure sua chave API nas configurações da IA.');
    }

    const base64Images = await Promise.all(
      imageFiles.map(file => compressImageFile(file, 1800, 0.85))
    );

    const systemInstruction = `Você é um especialista em OCR e extração estruturada de dados de folhas de contagem de refeições da empresa ABIB Refeições Coletivas.
Analise a(s) imagem(ns) com extrema atenção aos números manuscritos.

ESTRUTURA DAS FOLHAS DA ABIB:
A folha é dividida em blocos/células diárias organizadas em colunas e linhas:
- DIA: [data manuscrita no formato DD/MM, ex: 05/08, 06/08, 10/08, 15/08]
- TICKET: [número manuscrito ou traço -]
- GARRA/DALVA: [número manuscrito ou traço -]
- CARTÃO R$ 19,50: [número manuscrito ou traço -]
- PIX R$ 19,50: [número manuscrito ou traço -]
- ASSINATURAS: [número manuscrito ou traço -]
- TOTAL GERAL: [número total manuscrito na folha]

REGRAS CRÍTICAS DE EXTRAÇÃO:
1. Extraia TODOS os blocos de dias visíveis na imagem. Uma foto pode ter 1 único dia ou vários dias (5, 8, 10 ou mais dias).
2. Traços ('-', '—') ou campos em branco significam 0 (zero).
3. Para cada dia identificado, extraia exatamente o número escrito em cada linha.
4. Extraia também o número escrito no campo "TOTAL GERAL" exatamente como a nutricionista escreveu (para conferência posterior).
5. Se houver rasuras ou números corrigidos, considere o valor final corrigido.
6. Retorne EXCLUSIVAMENTE um objeto JSON no seguinte formato:

{
  "dias": [
    {
      "dia": "05/08",
      "ticket": 50,
      "garra": 0,
      "cartao": 1,
      "pix": 2,
      "assinaturas": 15,
      "totalEscritoFolha": 68,
      "observacao": ""
    }
  ]
}`;

    const contentArray = [
      {
        type: "text",
        text: "Extraia todos os dias e contagens de refeições presentes nestas fotos das folhas de comensais, seguindo rigorosamente a estrutura JSON especificada."
      }
    ];

    base64Images.forEach((dataUrl) => {
      contentArray.push({
        type: "image_url",
        image_url: { url: dataUrl }
      });
    });

    const modelName = aiConfig.model || 'google/gemini-2.5-flash';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin || 'https://gestao-abib.local',
        'X-Title': 'Gestao ABIB - OCR Comensais'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: contentArray }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      let errMsg = `Erro na API OpenRouter (Status ${response.status})`;
      try {
        const errData = await response.json();
        if (errData && errData.error && errData.error.message) {
          errMsg = `Erro OpenRouter: ${errData.error.message}`;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }

    const resultData = await response.json();
    const rawText = resultData.choices?.[0]?.message?.content || '';

    if (!rawText) {
      throw new Error('A IA não retornou nenhum dado legível para as imagens enviadas.');
    }

    let parsedJson = null;
    try {
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedJson = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Falha ao parsear resposta da IA:", rawText);
      throw new Error("Não foi possível interpretar a resposta estruturada da IA. Tente novamente.");
    }

    const rawDias = parsedJson.dias || (Array.isArray(parsedJson) ? parsedJson : []);
    if (rawDias.length === 0) {
      throw new Error('Nenhum dia ou tabela de contagem foi identificada com nitidez nas imagens enviadas.');
    }

    const currentYear = options.referenciaAno || new Date().getFullYear();
    const processedDias = [];

    rawDias.forEach((item, index) => {
      const diaRaw = (item.dia || '').trim();
      if (!diaRaw) return;

      let day = 1;
      let month = 1;
      let year = currentYear;

      const parts = diaRaw.split(/[\/\-\.]/);
      if (parts.length >= 2) {
        day = parseInt(parts[0], 10) || 1;
        month = parseInt(parts[1], 10) || 1;
        if (parts[2]) {
          const yr = parseInt(parts[2], 10);
          if (yr > 2000) year = yr;
          else if (yr < 100) year = 2000 + yr;
        }
      }

      const dayPad = String(day).padStart(2, '0');
      const monthPad = String(month).padStart(2, '0');
      const dataISO = `${year}-${monthPad}-${dayPad}`;
      const dataDisplay = `${dayPad}/${monthPad}/${year}`;

      const ticket = parseInt(item.ticket || 0, 10) || 0;
      const garra = parseInt(item.garra || 0, 10) || 0;
      const cartao = parseInt(item.cartao || 0, 10) || 0;
      const pix = parseInt(item.pix || 0, 10) || 0;
      const assinaturas = parseInt(item.assinaturas || 0, 10) || 0;

      // SOMA REAL OBRIGATÓRIA (Soma aritmética real dos itens)
      const somaReal = ticket + garra + cartao + pix + assinaturas;

      const totalEscrito = (item.totalEscritoFolha !== undefined && item.totalEscritoFolha !== null && item.totalEscritoFolha !== '')
        ? parseInt(item.totalEscritoFolha, 10)
        : null;

      const temDivergencia = totalEscrito !== null && !isNaN(totalEscrito) && totalEscrito !== somaReal;

      processedDias.push({
        idTemp: `temp_${Date.now()}_${index}`,
        diaTexto: diaRaw,
        dataISO,
        dataDisplay,
        publicos: {
          pub_ticket: ticket,
          pub_garra: garra,
          pub_promotores_cartao: cartao,
          pub_promotores_pix: pix,
          pub_assinaturas: assinaturas
        },
        somaReal,
        totalComensais: somaReal,
        totalEscritoFolha: totalEscrito,
        temDivergencia,
        observacao: item.observacao || ''
      });
    });

    processedDias.sort((a, b) => a.dataISO.localeCompare(b.dataISO));

    return {
      success: true,
      totalDias: processedDias.length,
      dias: processedDias
    };
  }

  async function getRegistrosPorData(dataISO) {
    const todos = await getCollection(STORAGE_KEYS.COMENSAIS);
    return todos.filter(r => r.data === dataISO);
  }

  async function getStatusUnidadesNoDia(dataISO) {
    const unidades = await getUnidades();
    const registros = await getRegistrosPorData(dataISO);
    const registrosMap = new Map();
    registros.forEach(r => registrosMap.set(r.unidadeId, r));

    return unidades.filter(u => u.ativo !== false).map(u => {
      const reg = registrosMap.get(u.id);
      const hasData = reg && reg.publicos && Object.values(reg.publicos).some(val => val !== null && val !== undefined && val !== '' && val !== 0);
      
      let totalComensais = 0;
      if (hasData) {
        Object.values(reg.publicos).forEach(v => totalComensais += parseInt(v || 0, 10));
      }

      return {
        unidade: u,
        registro: reg || null,
        status: hasData && totalComensais > 0 ? 'concluido' : 'pendente',
        totalComensais,
        observacao: reg ? reg.observacao : ''
      };
    });
  }

  async function generateWhatsAppSummary(dataISO) {
    const statusLista = await getStatusUnidadesNoDia(dataISO);
    const publicos = await getPublicos();
    const publicosAtivos = publicos.filter(p => p.ativo !== false);
    const dataFormatada = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
    
    let totalGeralEmpresa = 0;
    let concluidasCount = 0;

    let texto = `RESUMO DE COMENSAIS - ${dataFormatada}\nABIB Refeições Coletivas\n\n`;

    const concluidas = statusLista.filter(item => item.status === 'concluido');
    const pendentes = statusLista.filter(item => item.status !== 'concluido');

    concluidas.forEach(item => {
      concluidasCount++;
      totalGeralEmpresa += item.totalComensais;
      texto += `*[CONCLUÍDO] ${item.unidade.loja}:* ${item.totalComensais} Comensais\n`;
      
      const pMap = (item.registro && item.registro.publicos) ? item.registro.publicos : {};
      const partes = [];
      let handledPromotores = false;

      publicosAtivos.forEach(p => {
        if (p.id === 'pub_promotores_cartao' || p.id === 'pub_promotores_pix') {
          if (!handledPromotores) {
            handledPromotores = true;
            const cVal = parseInt(pMap['pub_promotores_cartao'] || 0, 10);
            const pxVal = parseInt(pMap['pub_promotores_pix'] || 0, 10);
            if (cVal > 0 && pxVal > 0) {
              partes.push(`Promotores ou Motoristas - Cartão: _${cVal}_ | Pix: _${pxVal}_`);
            } else if (cVal > 0) {
              partes.push(`Promotores ou Motoristas - Cartão: _${cVal}_`);
            } else if (pxVal > 0) {
              partes.push(`Promotores ou Motoristas - Pix: _${pxVal}_`);
            }
          }
        } else if (p.id === 'pub_promotores') {
          const val = parseInt(pMap[p.id] || 0, 10);
          if (val > 0) partes.push(`Promotores ou Motoristas: _${val}_`);
        } else {
          const val = parseInt(pMap[p.id] || 0, 10);
          if (val > 0) partes.push(`${p.nome}: _${val}_`);
        }
      });

      if (partes.length > 0) {
        partes.forEach((parte, idx) => {
          if (idx === 0) {
            texto += `   └ ${parte}\n`;
          } else {
            texto += `       ${parte}\n`;
          }
        });
      }

      if (item.observacao) {
        texto += `       Obs: _${item.observacao}_\n`;
      }
      texto += `\n`;
    });

    pendentes.forEach(item => {
      texto += `*[PENDENTE] ${item.unidade.loja}*\n`;
    });

    texto += `\nTOTAL DA EMPRESA: ${totalGeralEmpresa} refeições\nStatus: ${concluidasCount}/${statusLista.length} unidades preenchidas.`;
    return texto;
  }

  async function checkDiscrepanciaAlert(unidadeId, totalDia, sensibilidadePct = 30) {
    const todos = await getCollection(STORAGE_KEYS.COMENSAIS);
    const historicoUnidade = todos.filter(r => r.unidadeId === unidadeId && r.publicos);

    if (historicoUnidade.length < 3) return null;

    let soma = 0;
    historicoUnidade.forEach(r => {
      let t = 0;
      Object.values(r.publicos).forEach(v => t += parseInt(v || 0, 10));
      soma += t;
    });

    const media = soma / historicoUnidade.length;
    const difPct = ((totalDia - media) / media) * 100;

    if (Math.abs(difPct) >= sensibilidadePct) {
      return { media: Math.round(media), difPct: Math.round(difPct), tipo: difPct > 0 ? 'alta' : 'baixa' };
    }
    return null;
  }

  async function exportComensaisCSV(inicioISO, fimISO) {
    const todos = await getCollection(STORAGE_KEYS.COMENSAIS);
    const unidades = await getUnidades();
    const publicos = await getPublicos();
    const unidadesMap = new Map(unidades.map(u => [u.id, u]));

    const filtrados = todos.filter(r => {
      const inDateRange = r.data >= inicioISO && r.data <= fimISO;
      let total = 0;
      if (r.publicos) Object.values(r.publicos).forEach(v => total += parseInt(v || 0, 10));
      const hasObs = r.observacao && r.observacao.trim() !== '';
      return inDateRange && (total > 0 || hasObs);
    });

    let csv = 'Data;Grupo;Codigo;Loja;Unidade;CNPJ;Total Comensais;';
    publicos.forEach(p => csv += `${p.nome};`);
    csv += 'Observações\n';

    filtrados.forEach(r => {
      const u = unidadesMap.get(r.unidadeId) || {};
      let total = 0;
      if (r.publicos) Object.values(r.publicos).forEach(v => total += parseInt(v || 0, 10));
      csv += `${r.data};"${u.grupo || ''}";"${u.codigo || ''}";"${u.loja || ''}";"${u.unidade || ''}";"${u.cnpj || ''}";${total};`;
      publicos.forEach(p => csv += `${(r.publicos && r.publicos[p.id]) || 0};`);
      csv += `"${(r.observacao || '').replace(/"/g, '""')}"\n`;
    });

    return csv;
  }

  // --- 7. PERFIL MANAGER ---
  const ACTIVE_PROFILE_KEY = 'abib_gestao_active_profile_id';

  async function getActiveProfile() {
    const perfis = await getPerfis();
    const config = await getConfig();
    if (config.permitirTrocaPerfil) {
      const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (savedId) {
        const found = perfis.find(p => p.id === savedId);
        if (found) return found;
      }
    }
    return perfis.find(p => p.id === 'p_padrao') || perfis[0];
  }

  function setActiveProfileId(profileId) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  async function renderProfileSelectorModal(onProfileSelectedCallback) {
    const perfis = await getPerfis();
    const currentActive = await getActiveProfile();
    const isAlreadyDefined = !!currentActive;

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'profile-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="profile-modal-card">
        <div class="profile-modal-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-title);">Acesso ao Sistema de Gestão ABIB</h2>
            <p class="subtitle" style="margin-top: 2px;">Selecione seu Perfil de Acesso para continuar:</p>
          </div>
          ${isAlreadyDefined ? '<button class="btn-close-modal-profile"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>' : ''}
        </div>
        <div class="profiles-selection-grid">
          ${perfis.map(p => `
            <button class="btn-profile-card btn btn-secondary btn-block" style="text-align: left; padding: 14px; margin-bottom: 8px;" data-profile-id="${p.id}">
              <div>
                <strong>${p.nome}</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal; margin-top: 2px;">${p.descricao || ''}</p>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    if (isAlreadyDefined) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal(modalOverlay);
        }
      });

      const btnClose = modalOverlay.querySelector('.btn-close-modal-profile');
      if (btnClose) {
        btnClose.addEventListener('click', () => {
          closeModal(modalOverlay);
        });
      }
    }

    modalOverlay.querySelectorAll('.btn-profile-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-profile-id');
        setActiveProfileId(id);
        closeModal(modalOverlay, () => {
          if (onProfileSelectedCallback) {
            const selected = perfis.find(p => p.id === id);
            onProfileSelectedCallback(selected);
          }
        });
      });
    });
  }

  // --- GERENCIADOR DE FILA E LOTES EM SEGUNDO PLANO (IA OCR) ---
  const AI_QUEUE_STORAGE_KEY = 'abib_ai_job_queue';
  let memoryAiJobs = [];

  function loadJobsFromStorage() {
    try {
      const raw = localStorage.getItem(AI_QUEUE_STORAGE_KEY);
      if (raw) {
        memoryAiJobs = JSON.parse(raw);
        memoryAiJobs.forEach(job => {
          if (job.status === 'processing') {
            job.status = 'error';
            job.erro = 'Processamento interrompido ao fechar/recarregar a página.';
          }
        });
      } else {
        memoryAiJobs = [];
      }
    } catch (e) {
      memoryAiJobs = [];
    }
    return memoryAiJobs;
  }

  function saveJobsToStorage() {
    try {
      const serializable = memoryAiJobs.map(j => ({
        id: j.id,
        unidadeId: j.unidadeId,
        unidadeNome: j.unidadeNome,
        grupo: j.grupo,
        anoRef: j.anoRef,
        totalFotos: j.totalFotos,
        status: j.status,
        progressoTexto: j.progressoTexto,
        criadoEm: j.criadoEm,
        finalizadoEm: j.finalizadoEm,
        resultadoDias: j.resultadoDias || [],
        erro: j.erro || null
      }));
      localStorage.setItem(AI_QUEUE_STORAGE_KEY, JSON.stringify(serializable));
    } catch (e) {
      console.error("Erro ao salvar fila de jobs no storage:", e);
    }
  }

  function emitQueueChangeEvent() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('abib_ai_queue_change', {
        detail: { jobs: [...memoryAiJobs] }
      }));
    }
  }

  loadJobsFromStorage();

  function getAiJobs() {
    return [...memoryAiJobs];
  }

  function removeAiJob(jobId) {
    memoryAiJobs = memoryAiJobs.filter(j => j.id !== jobId);
    saveJobsToStorage();
    emitQueueChangeEvent();
    return memoryAiJobs;
  }

  function clearCompletedAiJobs() {
    memoryAiJobs = memoryAiJobs.filter(j => j.status === 'processing');
    saveJobsToStorage();
    emitQueueChangeEvent();
    return memoryAiJobs;
  }

  async function enqueueAiJob({ unidadeId, unidadeNome, grupo, anoRef, files }) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const novoJob = {
      id: jobId,
      unidadeId,
      unidadeNome: unidadeNome || 'Unidade',
      grupo: grupo || '-',
      anoRef: anoRef || new Date().getFullYear(),
      totalFotos: files ? files.length : 0,
      status: 'processing',
      progressoTexto: 'Preparando e comprimindo fotos...',
      criadoEm: new Date().toISOString(),
      finalizadoEm: null,
      resultadoDias: [],
      erro: null
    };

    memoryAiJobs.unshift(novoJob);
    saveJobsToStorage();
    emitQueueChangeEvent();

    executeJobInBackground(novoJob, files).catch(err => {
      console.error(`Erro inesperado no job ${jobId}:`, err);
    });

    return novoJob;
  }

  async function executeJobInBackground(job, files) {
    try {
      job.progressoTexto = `Comprimindo ${files.length} foto(s)...`;
      saveJobsToStorage();
      emitQueueChangeEvent();

      job.progressoTexto = `Analisando ${files.length} foto(s) com IA (OpenRouter)...`;
      saveJobsToStorage();
      emitQueueChangeEvent();

      const resultado = await extractComensaisFromImages(files, { referenciaAno: job.anoRef });

      if (!resultado || !resultado.dias || resultado.dias.length === 0) {
        throw new Error("Nenhum dia ou tabela de contagem foi identificada nas fotos.");
      }

      job.status = 'ready';
      job.progressoTexto = `Pronto! ${resultado.dias.length} dia(s) identificado(s).`;
      job.resultadoDias = resultado.dias;
      job.finalizadoEm = new Date().toISOString();
      job.erro = null;

      saveJobsToStorage();
      emitQueueChangeEvent();
    } catch (err) {
      console.error(`Falha no processamento do lote ${job.unidadeNome}:`, err);
      job.status = 'error';
      job.erro = err.message || 'Erro ao comunicar com a IA do OpenRouter.';
      job.progressoTexto = 'Falha na leitura.';
      job.finalizadoEm = new Date().toISOString();

      saveJobsToStorage();
      emitQueueChangeEvent();
    }
  }

   // --- 8. COMENSAIS VIEW (COM OCR DE FOTOS VIA OPENROUTER) ---
  class ComensaisModuleView {
    constructor() {
      this.id = 'comensais';
      this.name = 'Comensais Diários';
      this.currentDate = new Date().toISOString().split('T')[0];
      this.filterStatus = 'todos';
      this.searchQuery = '';
      this.realtimeHandler = null;

      // Estados do OCR e Fila
      this.ocrSelectedFiles = [];
      this.ocrSelectedUnitId = '';
      this.ocrExtractedDays = [];
      this.activeJobId = null;
      this.openedFromCentralLotes = false;
    }

    async render(container, currentProfile, lockedUnit = null) {
      this.currentProfile = currentProfile;
      this.lockedUnit = lockedUnit || (window.app && window.app.lockedUnit);
      this.container = container;

      const isLocked = !!this.lockedUnit;

      container.innerHTML = `
        ${isLocked ? `
          <div class="unit-lock-banner">
            <span><strong>Mart Minas - ${this.lockedUnit.loja}</strong></span>
            <small style="margin-left: auto;">Grupo ${this.lockedUnit.grupo || '-'}</small>
          </div>
        ` : ''}

        <div class="module-header">
          <div class="header-titles">
            <h2>Registro de Comensais Diários</h2>
            <p class="subtitle">${isLocked ? `Unidade ${this.lockedUnit.loja} • Lançamento rápido no celular` : 'Gestão consolidada das 21 unidades, leitura por foto e relatórios'}</p>
          </div>
          <div class="header-actions">
            ${!isLocked ? `
              <button id="btn-ocr-comensais" class="btn btn-primary btn-ocr-action" title="Ler fotos de folhas físicas com IA">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <span>Leitura por Foto</span>
              </button>
              <button id="btn-central-lotes-ia" class="btn btn-secondary btn-central-lotes" title="Central de Lotes da IA (Processamentos em Segundo Plano)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <span>Central de Lotes</span>
                <span id="queue-header-badge" class="queue-badge-count hidden">0</span>
              </button>
              <button id="btn-whatsapp" class="btn btn-whatsapp" title="Copiar resumo diário para o WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>Resumo Diário</span>
              </button>
              <button id="btn-relatorios" class="btn btn-secondary" title="Histórico e Relatórios">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                <span>Relatórios</span>
              </button>
              <div class="dropdown-container">
                <button type="button" id="btn-dropdown-mais-acoes" class="btn btn-secondary" title="Mais Opções">
                  <span>Mais</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div id="dropdown-menu-comensais" class="dropdown-menu hidden">
                  <button type="button" id="btn-links-whatsapp-unidades" class="dropdown-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>Links WhatsApp das Lojas</span>
                  </button>
                  <button type="button" id="btn-config-ia-shortcut" class="dropdown-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span>Configurações da IA (API)</span>
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="date-and-filter-bar">
          <div class="date-picker-group">
            <label for="input-data-comensais">Data:</label>
            <div style="display: flex; align-items: center; gap: 4px;">
              <button type="button" id="btn-date-prev" class="btn btn-secondary" title="Dia anterior" style="padding: 6px 12px; font-weight: 800; font-size: 0.85rem;">◀</button>
              <input type="date" id="input-data-comensais" class="input-date" value="${this.currentDate}" style="text-align: center;">
              <button type="button" id="btn-date-next" class="btn btn-secondary" title="Próximo dia" style="padding: 6px 12px; font-weight: 800; font-size: 0.85rem;">▶</button>
            </div>
          </div>
          ${!isLocked ? `
            <div class="search-group">
              <input type="text" id="input-search-unidades" class="input-search" placeholder="Buscar unidade ou loja...">
            </div>
            <div class="filter-pills">
              <button class="pill ${this.filterStatus === 'todos' ? 'active' : ''}" data-filter="todos">Todas (<span id="count-todos">0</span>)</button>
              <button class="pill pill-pending ${this.filterStatus === 'pendente' ? 'active' : ''}" data-filter="pendente"><span class="status-dot dot-pending"></span> Pendentes (<span id="count-pendentes">0</span>)</button>
              <button class="pill pill-success ${this.filterStatus === 'concluido' ? 'active' : ''}" data-filter="concluido"><span class="status-dot dot-success"></span> Concluídas (<span id="count-concluidos">0</span>)</button>
            </div>
          ` : ''}
        </div>

        <div id="unidades-cards-container" class="cards-grid-vertical"></div>

        <!-- ========================================================= -->
        <!-- MODAL 1: UPLOAD DE FOTOS DAS FOLHAS (OCR IA) -->
        <!-- ========================================================= -->
        <div id="modal-ocr-comensais" class="modal hidden">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
                <h3>Leitura Automática de Folhas com IA (OCR)</h3>
              </div>
              <button class="btn-close-modal-ocr"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body">
              <p class="help-text">
                Anexe uma ou mais fotos das folhas físicas manuscritas. A IA fará a leitura de todos os dias contidos nas imagens e calculará a soma real das refeições.
              </p>

              <div class="ocr-config-box">
                <div class="form-row-grid">
                  <div class="form-group" style="flex: 2;">
                    <label for="ocr-select-unidade" style="font-weight: 700;">Unidade / Loja (Obrigatório):</label>
                    <select id="ocr-select-unidade" class="select-field">
                      <option value="">Selecione a Loja correspondente a estas fotos...</option>
                    </select>
                  </div>
                  <div class="form-group" style="flex: 1;">
                    <label for="ocr-ano-referencia" style="font-weight: 700;">Ano de Referência:</label>
                    <input type="number" id="ocr-ano-referencia" class="input-field" value="${new Date().getFullYear()}" min="2020" max="2030">
                  </div>
                </div>
              </div>

              <!-- Área de Drop e Seleção de Fotos -->
              <div class="ocr-dropzone" id="ocr-dropzone-area">
                <input type="file" id="ocr-file-input" multiple accept="image/*" style="display: none;">
                <div class="dropzone-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div class="dropzone-text">
                  <strong>Clique para selecionar fotos</strong> ou arraste as imagens aqui
                </div>
                <small style="color: var(--text-muted);">Suporta JPG, PNG, WEBP (fotos tiradas pelo celular ou galeria)</small>
              </div>

              <!-- Galeria de Miniaturas das Fotos Anexadas -->
              <div id="ocr-thumbnails-wrapper" class="ocr-thumbnails-wrapper hidden">
                <div class="thumbnails-header">
                  <span id="ocr-files-count-badge" style="font-weight: 700; color: var(--text-title);">0 foto(s) selecionada(s)</span>
                  <button type="button" id="btn-ocr-clear-all" class="btn btn-sm btn-link" style="color: var(--danger, #dc2626); text-decoration: none;">Remover Todas</button>
                </div>
                <div id="ocr-thumbnails-grid" class="ocr-thumbnails-grid"></div>
              </div>

              <!-- Status e Barra de Carregamento -->
              <div id="ocr-loading-area" class="ocr-loading-container hidden">
                <div class="spinner-dot-flow"></div>
                <p id="ocr-loading-msg" style="font-weight: 700; color: var(--primary); margin-top: 10px;">Lendo e interpretando folhas com IA... Aguarde alguns instantes.</p>
                <small style="color: var(--text-muted);">Comprimindo imagens e analisando números manuscritos com o modelo configurado.</small>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" id="btn-ocr-open-settings" class="btn btn-secondary btn-sm">
                Configurar API / Modelo
              </button>
              <div style="display: flex; gap: 8px;">
                <button type="button" class="btn btn-secondary btn-cancelar-ocr">Cancelar</button>
                <button type="button" id="btn-ocr-processar" class="btn btn-primary" style="font-weight: 700;">
                  Processar em Segundo Plano
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- MODAL 2: CONFIGURAÇÕES DA IA (OPENROUTER) -->
        <!-- ========================================================= -->
        <div id="modal-config-ia" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Configurações da IA (OpenRouter)</h3>
              <button class="btn-close-modal-config-ia"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body">
              <p class="help-text">
                Insira sua Chave API do OpenRouter e o modelo de visão desejado. A chave é armazenada de forma segura nas configurações locais do sistema.
              </p>
              <form id="form-config-ia-modal">
                <div class="form-group">
                  <label for="input-openrouter-key" style="font-weight: 700;">Chave API do OpenRouter (API Key):</label>
                  <input type="password" id="input-openrouter-key" class="input-field" placeholder="sk-or-v1-..." required>
                  <small style="color: var(--text-muted); display: block; margin-top: 4px;">Obtenha sua chave em: openrouter.ai/keys</small>
                </div>

                <div class="form-group">
                  <label for="input-openrouter-model" style="font-weight: 700;">Modelo de IA (Model ID):</label>
                  <input type="text" id="input-openrouter-model" class="input-field" value="google/gemini-2.5-flash" placeholder="google/gemini-2.5-flash" required>
                  <small style="color: var(--text-muted); display: block; margin-top: 4px;">Exemplos recomendados: google/gemini-2.5-flash, google/gemini-2.0-flash-001, openai/gpt-4o-mini</small>
                </div>

                <div id="ia-test-result-box" style="margin-top: 8px; font-size: 0.85rem;"></div>

                <div style="display: flex; gap: 8px; margin-top: 16px;">
                  <button type="button" id="btn-testar-conexao-ia" class="btn btn-secondary" style="flex: 1;">
                    Testar Conexão
                  </button>
                  <button type="submit" class="btn btn-primary" style="flex: 1;">
                    Salvar Configuração
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- MODAL 3: CONFERÊNCIA E VALIDAÇÃO DOS DIAS EXTRAÍDOS -->
        <!-- ========================================================= -->
        <div id="modal-ocr-revisao" class="modal hidden">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <div>
                <h3>Conferência e Validação dos Lançamentos</h3>
                <p class="subtitle" id="ocr-revisao-subtitle">Unidade: Carregando...</p>
              </div>
              <button class="btn-close-modal-revisao"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body">
              <div class="revisao-alert-info">
                <span>O total de cada dia é calculado pela <strong>soma real dos itens</strong>. Se houver divergência em relação ao total anotado na folha física, um aviso em amarelo será sinalizado na coluna de status.</span>
              </div>

              <div class="table-responsive-card" style="max-height: 420px; overflow-y: auto; overflow-x: hidden;">
                <table class="data-table" id="table-ocr-revisao">
                  <thead>
                    <tr>
                      <th style="width: 32px; text-align: center;" title="Marcar como conferido">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </th>
                      <th style="width: 120px;">Data</th>
                      <th style="width: 50px;">Tickets</th>
                      <th style="width: 50px;">Garra</th>
                      <th style="width: 50px;">Cartão</th>
                      <th style="width: 50px;">Pix</th>
                      <th style="width: 50px;">Assin.</th>
                      <th style="width: 50px; text-align: center;">Soma Real</th>
                      <th style="width: 48px; text-align: center;">Folha</th>
                      <th style="min-width: 140px; text-align: left;">Conferência / Status</th>
                      <th style="width: 32px; text-align: center;"></th>
                    </tr>
                  </thead>
                  <tbody id="tbody-ocr-revisao">
                    <!-- Linhas geradas dinamicamente -->
                  </tbody>
                </table>
              </div>

              <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <button type="button" id="btn-ocr-add-dia-manual" class="btn btn-sm btn-secondary">
                  + Adicionar Outro Dia Manualmente
                </button>
                <div style="font-weight: 800; font-size: 1rem; color: var(--text-title);">
                  Total Geral dos Dias: <span id="ocr-revisao-total-geral" style="color: var(--primary);">0</span> refeições
                </div>
              </div>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-cancelar-revisao">Voltar</button>
              <button type="button" id="btn-ocr-confirmar-salvar" class="btn btn-primary" style="font-weight: 700;">
                Confirmar e Salvar Lançamentos
              </button>
            </div>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- MODAL 4: COMPARATIVO DETALHADO (BANCO VS IA) -->
        <!-- ========================================================= -->
        <div id="modal-ocr-diff" class="modal hidden" style="z-index: 1060;">
          <div class="modal-content" style="max-width: 540px;">
            <div class="modal-header">
              <div>
                <h3 id="ocr-diff-title">Comparativo de Lançamento</h3>
                <p class="subtitle" id="ocr-diff-subtitle">Comparando dados atuais no sistema com a nova extração</p>
              </div>
              <button class="btn-close-modal-diff"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body" id="ocr-diff-body">
              <!-- Tabela comparativa gerada dinamicamente -->
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary btn-close-modal-diff-footer">Fechar Comparativo</button>
            </div>
          </div>
        </div>

        <!-- ========================================================= -->
        <!-- MODAL 5: CENTRAL DE LOTES DA IA (SEGUNDO PLANO) -->
        <!-- ========================================================= -->
        <div id="modal-central-lotes" class="modal hidden" style="z-index: 1050;">
          <div class="modal-content" style="max-width: 680px;">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h3>Central de Lotes da IA</h3>
              </div>
              <button class="btn-close-modal-central-lotes"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 0.84rem; color: var(--text-muted);">Acompanhe o processamento das fotos e confira os lançamentos de cada loja:</span>
                <button type="button" id="btn-clear-completed-jobs" class="btn btn-sm btn-link" style="color: var(--text-muted); text-decoration: none; font-size: 0.76rem;">Limpar Concluídos</button>
              </div>

              <div id="central-lotes-list" class="queue-jobs-container">
                <!-- Lista de jobs gerada dinamicamente -->
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" id="btn-novo-lote-shortcut" class="btn btn-primary btn-sm">
                + Processar Outra Unidade
              </button>
              <button type="button" class="btn btn-secondary btn-close-modal-central-footer">Fechar</button>
            </div>
          </div>
        </div>

        ${!isLocked ? `
          <!-- Modal WhatsApp Links das 21 Lojas -->
          <div id="modal-whatsapp-links-unidades" class="modal hidden">
            <div class="modal-content modal-large">
              <div class="modal-header">
                <h3>Links de Acesso Direto para o WhatsApp (21 Unidades)</h3>
                <button class="btn-close-modal-links"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div class="modal-body">
                <p class="help-text">Cada loja possui um token secreto único. Clique em <strong>"Copiar p/ WhatsApp"</strong> para enviar à RT ou Cozinheira da unidade:</p>
                <div class="table-responsive-card">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Cód</th>
                        <th>Grupo</th>
                        <th>Loja / Unidade</th>
                        <th>Link Direto WhatsApp</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody id="tbody-links-whatsapp-modal">
                      <tr><td colspan="5" class="text-center">Carregando links...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal WhatsApp Resumo Consolidação -->
          <div id="modal-whatsapp" class="modal hidden">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Resumo Formatado para WhatsApp</h3>
                <button class="btn-close-modal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div class="modal-body">
                <textarea id="whatsapp-preview-text" readonly class="whatsapp-textarea"></textarea>
              </div>
              <div class="modal-footer">
                <button id="btn-copiar-whatsapp" class="btn btn-primary btn-block">Copiar Texto para WhatsApp</button>
              </div>
            </div>
          </div>
        ` : ''}
      `;

      this.bindEvents();
      this.updateCentralLotesHeaderBadge();

      if (!this.queueListenerAttached) {
        this.queueListenerAttached = true;
        window.addEventListener('abib_ai_queue_change', () => {
          this.updateCentralLotesHeaderBadge();
          this.renderCentralLotesList();
        });
      }

      await this.loadData();
    }

    bindEvents() {
      const inputData = this.container.querySelector('#input-data-comensais');
      const btnPrev = this.container.querySelector('#btn-date-prev');
      const btnNext = this.container.querySelector('#btn-date-next');

      if (inputData) {
        inputData.addEventListener('change', async (e) => {
          this.currentDate = e.target.value;
          await this.loadData();
        });
      }

      if (btnPrev && inputData) {
        btnPrev.addEventListener('click', async () => {
          this.currentDate = shiftDateISO(this.currentDate, -1);
          inputData.value = this.currentDate;
          await this.loadData();
        });
      }

      if (btnNext && inputData) {
        btnNext.addEventListener('click', async () => {
          this.currentDate = shiftDateISO(this.currentDate, 1);
          inputData.value = this.currentDate;
          await this.loadData();
        });
      }

      const inputSearch = this.container.querySelector('#input-search-unidades');
      if (inputSearch) {
        inputSearch.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.renderCards();
        });
      }

      const pills = this.container.querySelectorAll('.pill');
      pills.forEach(p => {
        p.addEventListener('click', () => {
          pills.forEach(x => x.classList.remove('active'));
          p.classList.add('active');
          this.filterStatus = p.getAttribute('data-filter');
          this.renderCards();
        });
      });

      // --- EVENTOS DO OCR / IA E CENTRAL DE LOTES ---
      const btnDropdown = this.container.querySelector('#btn-dropdown-mais-acoes');
      const dropdownMenu = this.container.querySelector('#dropdown-menu-comensais');
      if (btnDropdown && dropdownMenu) {
        btnDropdown.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
          if (!btnDropdown.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add('hidden');
          }
        });
      }

      const btnCentralLotes = this.container.querySelector('#btn-central-lotes-ia');
      if (btnCentralLotes) {
        btnCentralLotes.addEventListener('click', () => {
          this.openCentralLotesModal();
        });
      }

      const btnOcr = this.container.querySelector('#btn-ocr-comensais');
      if (btnOcr) {
        btnOcr.addEventListener('click', async () => {
          await this.openOcrModal();
        });
      }

      const btnConfigIaShortcut = this.container.querySelector('#btn-config-ia-shortcut');
      if (btnConfigIaShortcut) {
        btnConfigIaShortcut.addEventListener('click', async () => {
          if (dropdownMenu) dropdownMenu.classList.add('hidden');
          await this.openConfigIaModal();
        });
      }

      const btnOcrOpenSettings = this.container.querySelector('#btn-ocr-open-settings');
      if (btnOcrOpenSettings) {
        btnOcrOpenSettings.addEventListener('click', async () => {
          await this.openConfigIaModal();
        });
      }

      this.bindOcrDropzoneEvents();
      this.bindConfigIaEvents();
      this.bindOcrRevisaoEvents();
      this.bindCentralLotesEvents();

      const btnLinksWhatsapp = this.container.querySelector('#btn-links-whatsapp-unidades');
      if (btnLinksWhatsapp) {
        btnLinksWhatsapp.addEventListener('click', async () => {
          if (dropdownMenu) dropdownMenu.classList.add('hidden');
          await this.renderModalLinksWhatsapp();
        });
      }

      const btnCloseLinks = this.container.querySelector('.btn-close-modal-links');
      if (btnCloseLinks) {
        btnCloseLinks.addEventListener('click', () => {
          const modalLinks = this.container.querySelector('#modal-whatsapp-links-unidades');
          if (modalLinks) modalLinks.classList.add('hidden');
        });
      }

      const modalWs = this.container.querySelector('#modal-whatsapp');
      if (modalWs) {
        modalWs.addEventListener('click', (e) => {
          if (e.target === modalWs) closeModal(modalWs);
        });
      }

      const btnWhatsapp = this.container.querySelector('#btn-whatsapp');
      if (btnWhatsapp) {
        btnWhatsapp.addEventListener('click', async () => {
          const texto = await generateWhatsAppSummary(this.currentDate);
          const textarea = this.container.querySelector('#whatsapp-preview-text');
          textarea.value = texto;
          modalWs.classList.remove('hidden');
        });
      }

      const btnCloseModal = this.container.querySelector('.btn-close-modal');
      if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
          closeModal(modalWs);
        });
      }

      const btnCopiar = this.container.querySelector('#btn-copiar-whatsapp');
      if (btnCopiar) {
        btnCopiar.addEventListener('click', () => {
          const textarea = this.container.querySelector('#whatsapp-preview-text');
          textarea.select();
          document.execCommand('copy');
          showToast("Resumo copiado para a área de transferência!", "success");
          closeModal(modalWs);
        });
      }

      const btnRelatorios = this.container.querySelector('#btn-relatorios');
      if (btnRelatorios) {
        btnRelatorios.addEventListener('click', () => {
          window.app.switchView('comensais-relatorios');
        });
      }

      // Listener de Atualização em Tempo Real (Realtime Multidispositivo)
      if (this.realtimeHandler) {
        window.removeEventListener('abib_realtime_update', this.realtimeHandler);
      }
      this.realtimeHandler = async (e) => {
        if (e.detail && e.detail.key === STORAGE_KEYS.COMENSAIS) {
          const activeEl = document.activeElement;
          if (activeEl && this.container.contains(activeEl) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
            return;
          }
          await this.handleRealtimeUpdate();
        }
      };
      window.addEventListener('abib_realtime_update', this.realtimeHandler);

      // Sincroniza ao alternar/voltar para esta aba
      if (this.comensaisVisibilityHandler) {
        document.removeEventListener('visibilitychange', this.comensaisVisibilityHandler);
        window.removeEventListener('focus', this.comensaisVisibilityHandler);
      }
      this.comensaisVisibilityHandler = async () => {
        if (document.visibilityState === 'visible') {
          const activeEl = document.activeElement;
          if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
            activeEl.blur();
          }
          const raw = localStorage.getItem(STORAGE_KEYS.COMENSAIS);
          if (raw) {
            try { updateMemoryCache(STORAGE_KEYS.COMENSAIS, JSON.parse(raw)); } catch (err) {}
          }
          await this.handleRealtimeUpdate();
        }
      };
      document.addEventListener('visibilitychange', this.comensaisVisibilityHandler);
      window.addEventListener('focus', this.comensaisVisibilityHandler);
    }

    // --- LÓGICA DO MODAL DE UPLOAD OCR ---
    async openOcrModal() {
      const modal = this.container.querySelector('#modal-ocr-comensais');
      const selectUnidade = this.container.querySelector('#ocr-select-unidade');
      const unidades = await getUnidades();
      const ativas = unidades.filter(u => u.ativo !== false);

      selectUnidade.innerHTML = '<option value="">Selecione a Loja correspondente a estas fotos...</option>';
      ativas.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.loja} ${u.grupo ? `(Grupo ${u.grupo})` : ''}`;
        if (this.lockedUnit && this.lockedUnit.id === u.id) {
          opt.selected = true;
        }
        selectUnidade.appendChild(opt);
      });

      if (this.lockedUnit) {
        selectUnidade.value = this.lockedUnit.id;
        selectUnidade.disabled = true;
      }

      this.ocrSelectedFiles = [];
      this.renderOcrThumbnails();
      modal.classList.remove('hidden');
    }

    bindOcrDropzoneEvents() {
      const modal = this.container.querySelector('#modal-ocr-comensais');
      const dropzone = this.container.querySelector('#ocr-dropzone-area');
      const fileInput = this.container.querySelector('#ocr-file-input');
      const btnProcessar = this.container.querySelector('#btn-ocr-processar');
      const btnClearAll = this.container.querySelector('#btn-ocr-clear-all');

      const btnClose = this.container.querySelector('.btn-close-modal-ocr');
      const btnCloseFooter = this.container.querySelector('.btn-cancelar-ocr');

      const closeModalFunc = () => {
        modal.classList.add('hidden');
        this.ocrSelectedFiles = [];
        this.renderOcrThumbnails();
      };

      if (btnClose) btnClose.addEventListener('click', closeModalFunc);
      if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModalFunc);

      dropzone.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          Array.from(e.target.files).forEach(file => {
            if (file.type.startsWith('image/')) {
              this.ocrSelectedFiles.push(file);
            }
          });
          this.renderOcrThumbnails();
          fileInput.value = '';
        }
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          Array.from(e.dataTransfer.files).forEach(file => {
            if (file.type.startsWith('image/')) {
              this.ocrSelectedFiles.push(file);
            }
          });
          this.renderOcrThumbnails();
        }
      });

      btnClearAll.addEventListener('click', () => {
        this.ocrSelectedFiles = [];
        this.renderOcrThumbnails();
      });

      // Disparar Processamento em Segundo Plano
      btnProcessar.addEventListener('click', async () => {
        const selectUnidade = this.container.querySelector('#ocr-select-unidade');
        const unidadeId = selectUnidade.value;
        const anoRef = parseInt(this.container.querySelector('#ocr-ano-referencia').value || new Date().getFullYear(), 10);

        if (!unidadeId) {
          alert("Por favor, selecione de qual Unidade / Loja são as fotos antes de processar.");
          selectUnidade.focus();
          return;
        }

        if (this.ocrSelectedFiles.length === 0) {
          alert("Por favor, selecione ao menos uma foto das folhas para leitura.");
          return;
        }

        const aiConfig = await getAiConfig();
        if (!aiConfig.apiKey) {
          alert("A Chave API do OpenRouter não está configurada. Por favor, insira sua chave API para continuar.");
          await this.openConfigIaModal();
          return;
        }

        const unidades = await getUnidades();
        const targetUnit = unidades.find(u => u.id === unidadeId) || { loja: 'Loja' };
        const filesToProcess = [...this.ocrSelectedFiles];

        // Disparar job na fila em segundo plano
        await enqueueAiJob({
          unidadeId,
          unidadeNome: targetUnit.loja,
          grupo: targetUnit.grupo,
          anoRef,
          files: filesToProcess
        });

        // Fechar modal imediatamente e liberar a interface
        modal.classList.add('hidden');
        this.ocrSelectedFiles = [];
        this.renderOcrThumbnails();

        this.updateCentralLotesHeaderBadge();
        showToast(`Lote da unidade ${targetUnit.loja} (${filesToProcess.length} foto(s)) enviado para processamento em segundo plano!`, "success");
      });
    }

    renderOcrThumbnails() {
      const wrapper = this.container.querySelector('#ocr-thumbnails-wrapper');
      const grid = this.container.querySelector('#ocr-thumbnails-grid');
      const countBadge = this.container.querySelector('#ocr-files-count-badge');

      if (this.ocrSelectedFiles.length === 0) {
        wrapper.classList.add('hidden');
        grid.innerHTML = '';
        return;
      }

      wrapper.classList.remove('hidden');
      countBadge.textContent = `${this.ocrSelectedFiles.length} foto(s) anexada(s)`;
      grid.innerHTML = '';

      this.ocrSelectedFiles.forEach((file, index) => {
        const card = document.createElement('div');
        card.className = 'ocr-thumbnail-card';

        const imgPreview = document.createElement('img');
        imgPreview.alt = file.name;
        const objectUrl = URL.createObjectURL(file);
        imgPreview.src = objectUrl;

        const infoBox = document.createElement('div');
        infoBox.className = 'thumbnail-info';
        infoBox.innerHTML = `
          <span class="thumb-name" title="${file.name}">${file.name}</span>
          <span class="thumb-size">${(file.size / 1024).toFixed(0)} KB</span>
        `;

        const btnRemove = document.createElement('button');
        btnRemove.type = 'button';
        btnRemove.className = 'btn-thumb-remove';
        btnRemove.title = 'Remover foto';
        btnRemove.innerHTML = '&times;';
        btnRemove.addEventListener('click', (e) => {
          e.stopPropagation();
          URL.revokeObjectURL(objectUrl);
          this.ocrSelectedFiles.splice(index, 1);
          this.renderOcrThumbnails();
        });

        card.appendChild(imgPreview);
        card.appendChild(infoBox);
        card.appendChild(btnRemove);
        grid.appendChild(card);
      });
    }

    // --- LÓGICA DO MODAL DE CONFIGURAÇÃO DA IA ---
    async openConfigIaModal() {
      const modal = this.container.querySelector('#modal-config-ia');
      const aiConfig = await getAiConfig();

      this.container.querySelector('#input-openrouter-key').value = aiConfig.apiKey || '';
      this.container.querySelector('#input-openrouter-model').value = aiConfig.model || 'google/gemini-2.5-flash';
      this.container.querySelector('#ia-test-result-box').innerHTML = '';

      modal.classList.remove('hidden');
    }

    bindConfigIaEvents() {
      const modal = this.container.querySelector('#modal-config-ia');
      const btnClose = this.container.querySelector('.btn-close-modal-config-ia');
      const form = this.container.querySelector('#form-config-ia-modal');
      const btnTest = this.container.querySelector('#btn-testar-conexao-ia');
      const resultBox = this.container.querySelector('#ia-test-result-box');

      if (btnClose) {
        btnClose.addEventListener('click', () => {
          modal.classList.add('hidden');
        });
      }

      btnTest.addEventListener('click', async () => {
        const apiKey = this.container.querySelector('#input-openrouter-key').value.trim();
        const model = this.container.querySelector('#input-openrouter-model').value.trim();

        if (!apiKey) {
          resultBox.innerHTML = '<span style="color: var(--danger, #dc2626); font-weight: 700;">Por favor, digite a Chave API primeiro.</span>';
          return;
        }

        btnTest.disabled = true;
        btnTest.textContent = 'Testando...';
        resultBox.innerHTML = '<span style="color: var(--text-muted);">Verificando conexão com o OpenRouter...</span>';

        try {
          await testOpenRouterConnection(apiKey, model);
          resultBox.innerHTML = '<span style="color: var(--primary); font-weight: 700;">Conexão com a API do OpenRouter estabelecida com sucesso!</span>';
        } catch (err) {
          resultBox.innerHTML = `<span style="color: var(--danger, #dc2626); font-weight: 700;">Falha: ${err.message}</span>`;
        } finally {
          btnTest.disabled = false;
          btnTest.textContent = 'Testar Conexão';
        }
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const apiKey = this.container.querySelector('#input-openrouter-key').value.trim();
        const model = this.container.querySelector('#input-openrouter-model').value.trim();

        await saveAiConfig({ apiKey, model });
        showToast("Configurações do OpenRouter salvas com sucesso!", "success");
        modal.classList.remove('hidden');
      });
    }

    // --- LÓGICA DO MODAL DE CONFERÊNCIA E EDIÇÃO (REVISÃO) ---
    async openOcrRevisaoModal() {
      const modal = this.container.querySelector('#modal-ocr-revisao');
      const subtitle = this.container.querySelector('#ocr-revisao-subtitle');
      const unidades = await getUnidades();
      const targetUnit = unidades.find(u => u.id === this.ocrSelectedUnitId) || { loja: 'Loja Não Identificada' };

      // Mapear lançamentos já existentes nesta unidade no banco
      const todosComensais = await getCollection(STORAGE_KEYS.COMENSAIS);
      this.ocrExistingMap = new Map();
      todosComensais
        .filter(r => r.unidadeId === this.ocrSelectedUnitId)
        .forEach(r => this.ocrExistingMap.set(r.data, r));

      subtitle.innerHTML = `Unidade: <strong>${targetUnit.loja}</strong> ${targetUnit.grupo ? `(Grupo ${targetUnit.grupo})` : ''} • <strong>${this.ocrExtractedDays.length} dia(s)</strong> extraído(s)`;

      this.renderOcrRevisaoTable();
      modal.classList.remove('hidden');
    }

    buildOcrStatusHtml(diaItem, somaReal) {
      const temDivergencia = diaItem.totalEscritoFolha !== null && diaItem.totalEscritoFolha !== undefined && parseInt(diaItem.totalEscritoFolha, 10) !== somaReal;
      
      const badgeStatus = temDivergencia
        ? `<span class="badge badge-warning" title="O valor total escrito na folha (${diaItem.totalEscritoFolha}) difere da soma real dos itens (${somaReal})">Divergência: Folha ${diaItem.totalEscritoFolha} vs Real ${somaReal}</span>`
        : `<span class="badge badge-success">Soma correta (${somaReal})</span>`;

      const regExistente = this.ocrExistingMap ? this.ocrExistingMap.get(diaItem.dataISO) : null;
      let overwriteHtml = '';
      if (regExistente && regExistente.publicos) {
        const pAnt = regExistente.publicos;
        let totalAnterior = 0;
        Object.values(pAnt).forEach(v => totalAnterior += parseInt(v || 0, 10));

        if (totalAnterior > 0 || Object.keys(pAnt).length > 0) {
          overwriteHtml = `
            <div style="display: flex; align-items: center; gap: 4px; margin-top: 3px; flex-wrap: wrap;">
              <span class="badge badge-overwrite">Substituição</span>
              <button type="button" class="btn-ver-diff" title="Clique para ver os valores atuais vs novos">Ver dados salvos</button>
            </div>
          `;
        }
      }

      return `
        <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-start;">
          ${badgeStatus}
          ${overwriteHtml}
        </div>
      `;
    }

    openOcrDiffModal(diaItem) {
      const modalDiff = this.container.querySelector('#modal-ocr-diff');
      const titleEl = this.container.querySelector('#ocr-diff-title');
      const subtitleEl = this.container.querySelector('#ocr-diff-subtitle');
      const bodyEl = this.container.querySelector('#ocr-diff-body');

      const regExistente = this.ocrExistingMap ? this.ocrExistingMap.get(diaItem.dataISO) : null;
      const pAnt = (regExistente && regExistente.publicos) ? regExistente.publicos : {};
      const pNovo = diaItem.publicos || {};

      const dataFormatada = diaItem.dataISO.split('-').reverse().join('/');
      titleEl.textContent = `Comparativo do Dia ${dataFormatada}`;
      subtitleEl.textContent = `Comparando dados atuais no sistema com a nova extração das fotos`;

      const labels = [
        { id: 'pub_ticket', label: 'Tickets' },
        { id: 'pub_garra', label: "Garra / Estrela D'Alva" },
        { id: 'pub_promotores_cartao', label: 'Cartão R$ 19,50' },
        { id: 'pub_promotores_pix', label: 'Pix R$ 19,50' },
        { id: 'pub_assinaturas', label: 'Assinaturas' }
      ];

      let totalAnt = 0;
      let totalNovo = 0;

      let rowsHtml = '';
      labels.forEach(item => {
        const vAnt = parseInt(pAnt[item.id] || 0, 10);
        const vNovo = parseInt(pNovo[item.id] || 0, 10);
        totalAnt += vAnt;
        totalNovo += vNovo;

        const dif = vNovo - vAnt;
        let difBadge = '<span style="color: var(--text-muted); font-weight: 600;">= 0</span>';
        if (dif > 0) {
          difBadge = `<span style="color: #16a34a; font-weight: 700;">+${dif}</span>`;
        } else if (dif < 0) {
          difBadge = `<span style="color: #dc2626; font-weight: 700;">${dif}</span>`;
        }

        rowsHtml += `
          <tr>
            <td><strong>${item.label}</strong></td>
            <td style="text-align: center; font-weight: 600;">${vAnt}</td>
            <td style="text-align: center; font-weight: 700; color: var(--primary);">${vNovo}</td>
            <td style="text-align: center;">${difBadge}</td>
          </tr>
        `;
      });

      const difTotal = totalNovo - totalAnt;
      let difTotalBadge = '<span style="color: var(--text-muted); font-weight: 700;">= 0</span>';
      if (difTotal > 0) {
        difTotalBadge = `<span style="color: #16a34a; font-weight: 800;">+${difTotal}</span>`;
      } else if (difTotal < 0) {
        difTotalBadge = `<span style="color: #dc2626; font-weight: 800;">${difTotal}</span>`;
      }

      bodyEl.innerHTML = `
        <div style="margin-bottom: 12px; font-size: 0.84rem; color: var(--text-body); background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          Se você confirmar e salvar, os valores <strong>Salvo no Banco</strong> serão atualizados pelos valores <strong>Novo da IA</strong>.
        </div>
        <div class="table-responsive-card">
          <table class="diff-modal-table">
            <thead>
              <tr>
                <th>Público / Refeição</th>
                <th style="text-align: center;">Salvo no Banco</th>
                <th style="text-align: center; color: var(--primary);">Novo da IA</th>
                <th style="text-align: center;">Variação</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background: #f1f5f9; font-weight: 800; border-top: 2px solid var(--border-color);">
                <td>TOTAL GERAL</td>
                <td style="text-align: center; font-size: 0.95rem;">${totalAnt}</td>
                <td style="text-align: center; color: var(--primary); font-size: 1.05rem;">${totalNovo}</td>
                <td style="text-align: center;">${difTotalBadge}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      modalDiff.classList.remove('hidden');
    }

    renderOcrRevisaoTable() {
      const tbody = this.container.querySelector('#tbody-ocr-revisao');
      const totalGeralSpan = this.container.querySelector('#ocr-revisao-total-geral');
      tbody.innerHTML = '';

      if (this.ocrExtractedDays.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 24px; color: var(--text-muted);">Nenhum dia na lista de conferência.</td></tr>`;
        totalGeralSpan.textContent = '0';
        return;
      }

      let somaTodosOsDias = 0;

      this.ocrExtractedDays.forEach((diaItem, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;

        const p = diaItem.publicos || {};
        const ticketVal = parseInt(p.pub_ticket || 0, 10);
        const garraVal = parseInt(p.pub_garra || 0, 10);
        const cartaoVal = parseInt(p.pub_promotores_cartao || 0, 10);
        const pixVal = parseInt(p.pub_promotores_pix || 0, 10);
        const assinatVal = parseInt(p.pub_assinaturas || 0, 10);

        // Soma real estrita dos campos
        const somaReal = ticketVal + garraVal + cartaoVal + pixVal + assinatVal;
        diaItem.somaReal = somaReal;
        diaItem.totalComensais = somaReal;
        somaTodosOsDias += somaReal;

        const totalEscrito = diaItem.totalEscritoFolha !== null && diaItem.totalEscritoFolha !== undefined ? diaItem.totalEscritoFolha : '-';
        const statusHtml = this.buildOcrStatusHtml(diaItem, somaReal);

        if (diaItem.conferido) {
          tr.classList.add('row-conferido');
        }

        tr.innerHTML = `
          <td style="text-align: center;">
            <input type="checkbox" class="ocr-row-check" ${diaItem.conferido ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #16a34a;" title="Marcar como conferido">
          </td>
          <td style="text-align: center;">
            <input type="date" class="input-field input-sm ocr-rev-date" value="${diaItem.dataISO}">
          </td>
          <td style="text-align: center;">
            <input type="number" min="0" class="input-field input-sm ocr-rev-num" data-field="pub_ticket" value="${ticketVal}">
          </td>
          <td style="text-align: center;">
            <input type="number" min="0" class="input-field input-sm ocr-rev-num" data-field="pub_garra" value="${garraVal}">
          </td>
          <td style="text-align: center;">
            <input type="number" min="0" class="input-field input-sm ocr-rev-num" data-field="pub_promotores_cartao" value="${cartaoVal}">
          </td>
          <td style="text-align: center;">
            <input type="number" min="0" class="input-field input-sm ocr-rev-num" data-field="pub_promotores_pix" value="${pixVal}">
          </td>
          <td style="text-align: center;">
            <input type="number" min="0" class="input-field input-sm ocr-rev-num" data-field="pub_assinaturas" value="${assinatVal}">
          </td>
          <td style="text-align: center;">
            <strong class="ocr-rev-soma-real" style="color: var(--primary); font-size: 0.95rem;">${somaReal}</strong>
          </td>
          <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            ${totalEscrito}
          </td>
          <td class="ocr-rev-status-cell">
            ${statusHtml}
          </td>
          <td style="text-align: center;">
            <button type="button" class="btn btn-sm btn-link btn-remove-rev-day" style="color: var(--danger, #dc2626); text-decoration: none; font-size: 1.1rem; padding: 0 4px;" title="Excluir este dia">&times;</button>
          </td>
        `;

        // Evento de marcação de conferência
        const chkConferido = tr.querySelector('.ocr-row-check');
        if (chkConferido) {
          chkConferido.addEventListener('change', (e) => {
            diaItem.conferido = e.target.checked;
            tr.classList.toggle('row-conferido', e.target.checked);
          });
        }

        // Eventos de alteração dos inputs de valores
        const dateInp = tr.querySelector('.ocr-rev-date');
        dateInp.addEventListener('change', (e) => {
          diaItem.dataISO = e.target.value;
          const currentSoma = diaItem.somaReal || 0;
          tr.querySelector('.ocr-rev-status-cell').innerHTML = this.buildOcrStatusHtml(diaItem, currentSoma);
          this.bindRowDiffEvents(tr, diaItem);
        });

        const numInputs = tr.querySelectorAll('.ocr-rev-num');
        numInputs.forEach(inp => {
          inp.addEventListener('input', () => {
            const field = inp.dataset.field;
            const val = parseInt(inp.value || '0', 10);
            diaItem.publicos[field] = val;

            // Recalcular soma real e atualizar status instantaneamente
            const nTicket = parseInt(diaItem.publicos.pub_ticket || 0, 10);
            const nGarra = parseInt(diaItem.publicos.pub_garra || 0, 10);
            const nCartao = parseInt(diaItem.publicos.pub_promotores_cartao || 0, 10);
            const nPix = parseInt(diaItem.publicos.pub_promotores_pix || 0, 10);
            const nAssinat = parseInt(diaItem.publicos.pub_assinaturas || 0, 10);

            const nSomaReal = nTicket + nGarra + nCartao + nPix + nAssinat;
            diaItem.somaReal = nSomaReal;
            diaItem.totalComensais = nSomaReal;

            tr.querySelector('.ocr-rev-soma-real').textContent = nSomaReal;
            tr.querySelector('.ocr-rev-status-cell').innerHTML = this.buildOcrStatusHtml(diaItem, nSomaReal);
            this.bindRowDiffEvents(tr, diaItem);

            // Atualizar somatório geral de todos os dias
            let totalGeralAcc = 0;
            this.ocrExtractedDays.forEach(d => totalGeralAcc += (d.somaReal || 0));
            totalGeralSpan.textContent = totalGeralAcc.toLocaleString('pt-BR');
          });
        });

        this.bindRowDiffEvents(tr, diaItem);

        const btnRemoveDay = tr.querySelector('.btn-remove-rev-day');
        btnRemoveDay.addEventListener('click', () => {
          this.ocrExtractedDays.splice(index, 1);
          this.renderOcrRevisaoTable();
        });

        tbody.appendChild(tr);
      });

      totalGeralSpan.textContent = somaTodosOsDias.toLocaleString('pt-BR');
    }

    bindRowDiffEvents(tr, diaItem) {
      const btnDiff = tr.querySelector('.btn-ver-diff');
      if (btnDiff) {
        btnDiff.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openOcrDiffModal(diaItem);
        });
      }
    }

    bindOcrRevisaoEvents() {
      const modal = this.container.querySelector('#modal-ocr-revisao');
      const modalDiff = this.container.querySelector('#modal-ocr-diff');
      const btnClose = this.container.querySelector('.btn-close-modal-revisao');
      const btnCloseFooter = this.container.querySelector('.btn-cancelar-revisao');
      const btnAddManual = this.container.querySelector('#btn-ocr-add-dia-manual');
      const btnConfirmarSalvar = this.container.querySelector('#btn-ocr-confirmar-salvar');

      const btnCloseDiff = this.container.querySelector('.btn-close-modal-diff');
      const btnCloseDiffFooter = this.container.querySelector('.btn-close-modal-diff-footer');

      const closeModal = () => {
        modal.classList.add('hidden');
        if (this.openedFromCentralLotes) {
          this.openedFromCentralLotes = false;
          this.openCentralLotesModal();
        }
      };

      if (btnClose) btnClose.addEventListener('click', closeModal);
      if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);

      if (btnCloseDiff) {
        btnCloseDiff.addEventListener('click', () => {
          modalDiff.classList.add('hidden');
        });
      }
      if (btnCloseDiffFooter) {
        btnCloseDiffFooter.addEventListener('click', () => {
          modalDiff.classList.add('hidden');
        });
      }

      btnAddManual.addEventListener('click', () => {
        const todayISO = new Date().toISOString().split('T')[0];
        this.ocrExtractedDays.push({
          idTemp: `temp_${Date.now()}`,
          diaTexto: 'Manual',
          dataISO: todayISO,
          dataDisplay: todayISO.split('-').reverse().join('/'),
          publicos: {
            pub_ticket: 0,
            pub_garra: 0,
            pub_promotores_cartao: 0,
            pub_promotores_pix: 0,
            pub_assinaturas: 0
          },
          somaReal: 0,
          totalComensais: 0,
          totalEscritoFolha: null,
          temDivergencia: false,
          observacao: ''
        });
        this.renderOcrRevisaoTable();
      });

      btnConfirmarSalvar.addEventListener('click', async () => {
        if (this.ocrExtractedDays.length === 0) {
          alert("Não há dias para salvar.");
          return;
        }

        btnConfirmarSalvar.disabled = true;
        btnConfirmarSalvar.textContent = 'Salvando no banco...';

        try {
          const registrosParaSalvar = this.ocrExtractedDays.map(d => ({
            dataISO: d.dataISO,
            publicos: d.publicos,
            observacao: d.temDivergencia ? `Leitura IA: soma real (${d.somaReal}) divergiu do total anotado na folha (${d.totalEscritoFolha})` : (d.observacao || '')
          }));

          await saveComensaisLote(this.ocrSelectedUnitId, registrosParaSalvar);

          const wasFromCentral = this.openedFromCentralLotes;

          if (this.activeJobId) {
            removeAiJob(this.activeJobId);
            this.activeJobId = null;
            this.updateCentralLotesHeaderBadge();
          }

          this.openedFromCentralLotes = false;

          showToast(`${this.ocrExtractedDays.length} lançamento(s) foram salvos com sucesso na unidade!`, "success");
          modal.classList.add('hidden');
          await this.loadData();

          if (wasFromCentral) {
            this.openCentralLotesModal();
          }
        } catch (err) {
          console.error("Erro ao salvar lançamentos em lote:", err);
          alert(`Erro ao salvar lançamentos: ${err.message}`);
        } finally {
          btnConfirmarSalvar.disabled = false;
          btnConfirmarSalvar.textContent = 'Confirmar e Salvar Lançamentos';
        }
      });
    }

    // --- LÓGICA DA CENTRAL DE LOTES (BACKGROUND QUEUE) ---
    openCentralLotesModal() {
      const modal = this.container.querySelector('#modal-central-lotes');
      if (!modal) return;
      this.renderCentralLotesList();
      modal.classList.remove('hidden');
    }

    updateCentralLotesHeaderBadge() {
      const badge = this.container.querySelector('#queue-header-badge');
      if (!badge) return;
      const jobs = getAiJobs();
      const readyCount = jobs.filter(j => j.status === 'ready').length;
      const procCount = jobs.filter(j => j.status === 'processing').length;
      const totalActive = readyCount + procCount;

      if (totalActive === 0) {
        badge.classList.add('hidden');
        badge.classList.remove('queue-badge-ready');
        badge.textContent = '0';
      } else {
        badge.classList.remove('hidden');
        badge.textContent = `${totalActive}`;
        if (readyCount > 0) {
          badge.classList.add('queue-badge-ready');
          badge.title = `${readyCount} lote(s) pronto(s) para conferência!`;
        } else {
          badge.classList.remove('queue-badge-ready');
          badge.title = `${procCount} lote(s) sendo processado(s) em segundo plano...`;
        }
      }
    }

    renderCentralLotesList() {
      const listEl = this.container.querySelector('#central-lotes-list');
      if (!listEl) return;
      const jobs = getAiJobs();
      listEl.innerHTML = '';

      if (jobs.length === 0) {
        listEl.innerHTML = `
          <div style="padding: 32px 16px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
            <div style="font-weight: 700; color: var(--text-title); margin-bottom: 4px;">Nenhum lote na fila</div>
            <div style="font-size: 0.82rem;">Envie fotos de uma ou mais lojas para que a IA processe em segundo plano.</div>
          </div>
        `;
        return;
      }

      jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = `queue-job-card status-${job.status}`;

        let statusBadge = '';
        let actionsHtml = '';

        if (job.status === 'processing') {
          statusBadge = `<span class="badge badge-info"><span class="spinner-dot-flow" style="width: 10px; height: 10px; border-width: 2px; display: inline-block; vertical-align: middle; margin-right: 4px;"></span> Processando com IA...</span>`;
          actionsHtml = `
            <button type="button" class="btn btn-sm btn-secondary btn-cancel-job" data-job-id="${job.id}">Cancelar</button>
          `;
        } else if (job.status === 'ready') {
          statusBadge = `<span class="badge badge-success">Pronto (${job.resultadoDias.length} dias lidos)</span>`;
          actionsHtml = `
            <button type="button" class="btn btn-sm btn-primary btn-review-job" data-job-id="${job.id}" style="font-weight: 700;">Conferir e Salvar</button>
            <button type="button" class="btn btn-sm btn-secondary btn-discard-job" data-job-id="${job.id}">Descartar</button>
          `;
        } else if (job.status === 'error') {
          statusBadge = `<span class="badge" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;">Erro no processamento</span>`;
          actionsHtml = `
            <button type="button" class="btn btn-sm btn-secondary btn-discard-job" data-job-id="${job.id}">Remover</button>
          `;
        }

        const horaFormatada = new Date(job.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
          <div class="queue-job-header">
            <div class="queue-job-title">
              <h4>${job.unidadeNome}</h4>
              <span class="group-badge-tag">${job.grupo || '-'}</span>
              <small style="color: var(--text-muted);">${job.totalFotos} foto(s) • ${horaFormatada}</small>
            </div>
            <div>${statusBadge}</div>
          </div>
          <div class="queue-job-body">
            <div style="color: var(--text-muted); font-size: 0.78rem;">
              ${job.erro ? `<span style="color: #dc2626; font-weight: 600;">${job.erro}</span>` : job.progressoTexto}
            </div>
            <div class="queue-job-actions">
              ${actionsHtml}
            </div>
          </div>
        `;

        // Eventos dos botões do card
        const btnReview = card.querySelector('.btn-review-job');
        if (btnReview) {
          btnReview.addEventListener('click', async () => {
            this.ocrSelectedUnitId = job.unidadeId;
            this.ocrExtractedDays = job.resultadoDias;
            this.activeJobId = job.id;
            this.openedFromCentralLotes = true;

            this.container.querySelector('#modal-central-lotes').classList.add('hidden');
            await this.openOcrRevisaoModal();
          });
        }

        const btnDiscard = card.querySelector('.btn-discard-job, .btn-cancel-job');
        if (btnDiscard) {
          btnDiscard.addEventListener('click', () => {
            removeAiJob(job.id);
            this.renderCentralLotesList();
            this.updateCentralLotesHeaderBadge();
          });
        }

        listEl.appendChild(card);
      });
    }

    bindCentralLotesEvents() {
      const modal = this.container.querySelector('#modal-central-lotes');
      if (!modal) return;

      const btnClose = this.container.querySelector('.btn-close-modal-central-lotes');
      const btnCloseFooter = this.container.querySelector('.btn-close-modal-central-footer');
      const btnNovoLote = this.container.querySelector('#btn-novo-lote-shortcut');
      const btnClearCompleted = this.container.querySelector('#btn-clear-completed-jobs');

      const closeModal = () => {
        modal.classList.add('hidden');
      };

      if (btnClose) btnClose.addEventListener('click', closeModal);
      if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);

      if (btnNovoLote) {
        btnNovoLote.addEventListener('click', async () => {
          closeModal();
          await this.openOcrModal();
        });
      }

      if (btnClearCompleted) {
        btnClearCompleted.addEventListener('click', () => {
          clearCompletedAiJobs();
          this.renderCentralLotesList();
          this.updateCentralLotesHeaderBadge();
        });
      }
    }

    async handleRealtimeUpdate() {
      this.statusLista = await getStatusUnidadesNoDia(this.currentDate);
      await this.updateHeaderPillCounts();

      const grid = this.container.querySelector('#unidades-cards-container');
      if (!grid) return;

      const activeEl = document.activeElement;

      this.statusLista.forEach(item => {
        const u = item.unidade;
        const reg = item.registro || { publicos: {}, observacao: '' };
        const form = grid.querySelector(`.form-comensais-unidade[data-unidade-id="${u.id}"]`);
        if (!form) return;

        const card = form.closest('.unidade-card');
        const statusArea = card ? card.querySelector('.card-status-area') : null;

        if (statusArea) {
          if (item.status === 'concluido') {
            statusArea.innerHTML = `<span class="badge badge-success"><span class="status-dot dot-success"></span> CONCLUÍDO (${item.totalComensais})</span>`;
            if (card) card.className = 'unidade-card card-done';
          } else {
            statusArea.innerHTML = `<span class="badge badge-pending"><span class="status-dot dot-pending"></span> PENDENTE</span>`;
            if (card) card.className = 'unidade-card card-pending';
          }
        }

        this.publicosAtivos.forEach(p => {
          const input = form.querySelector(`input[name="${p.id}"]`);
          if (input && input !== activeEl) {
            const val = reg && reg.publicos ? reg.publicos[p.id] : 0;
            const displayVal = ensureNumberValue(val);
            if (input.value !== displayVal) {
              input.value = displayVal;
            }
          }
        });

        const inputObs = form.querySelector('input[name="observacao"]');
        if (inputObs && inputObs !== activeEl) {
          const obsVal = reg.observacao || '';
          if (inputObs.value !== obsVal) {
            inputObs.value = obsVal;
          }
        }
      });
    }

    async updateHeaderPillCounts() {
      this.statusLista = await getStatusUnidadesNoDia(this.currentDate);
      const pendentesCount = this.statusLista.filter(x => x.status === 'pendente').length;
      const concluidosCount = this.statusLista.filter(x => x.status === 'concluido').length;

      const cTodos = this.container.querySelector('#count-todos');
      const cPend = this.container.querySelector('#count-pendentes');
      const cConc = this.container.querySelector('#count-concluidos');

      if (cTodos) cTodos.textContent = this.statusLista.length;
      if (cPend) cPend.textContent = pendentesCount;
      if (cConc) cConc.textContent = concluidosCount;
    }

    async renderModalLinksWhatsapp() {
      const unidades = await getUnidades();
      const modal = this.container.querySelector('#modal-whatsapp-links-unidades');
      const tbody = this.container.querySelector('#tbody-links-whatsapp-modal');
      const baseUrl = `${window.location.origin}${window.location.pathname}`;

      if (!modal || !tbody) return;
      tbody.innerHTML = '';

      unidades.forEach(u => {
        const fullLink = `${baseUrl}?token=${u.tokenAcesso}`;
        const grpClass = u.grupo ? `group-badge-${u.grupo.toLowerCase()}` : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.codigo || '-'}</td>
          <td><span class="group-badge-tag ${grpClass}">${u.grupo || '-'}</span></td>
          <td><strong>${u.loja}</strong></td>
          <td><input type="text" readonly value="${fullLink}" class="input-field input-sm input-link-readonly" style="font-size: 0.75rem;"></td>
          <td>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn btn-sm btn-primary btn-copy-whatsapp-link" data-loja="${u.loja}" data-link="${fullLink}">
                Copiar Link
              </button>
              <button class="btn btn-sm btn-secondary btn-regerar-token" data-id="${u.id}" data-loja="${u.loja}">
                Regerar Token
              </button>
              <a href="${fullLink}" target="_blank" class="btn btn-sm btn-secondary" title="Abrir link em nova aba" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </td>
        `;

        tr.querySelector('.btn-copy-whatsapp-link').addEventListener('click', () => {
          const temp = document.createElement('textarea');
          temp.value = fullLink;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
          showToast(`Link da unidade ${u.loja} copiado!`, "success");
        });

        tr.querySelector('.btn-regerar-token').addEventListener('click', async () => {
          if (confirm(`Atenção: Deseja revogar o link antigo e gerar um NOVO token seguro para a unidade ${u.loja}?`)) {
            await regenerateUnitToken(u.id);
            showToast(`Novo token gerado para ${u.loja}!`, "success");
            await this.renderModalLinksWhatsapp();
          }
        });

        tbody.appendChild(tr);
      });

      modal.classList.remove('hidden');
    }

    async loadData() {
      this.publicos = await getPublicos();
      this.publicosAtivos = this.publicos.filter(p => p.ativo !== false);
      this.statusLista = await getStatusUnidadesNoDia(this.currentDate);

      if (this.lockedUnit) {
        this.statusLista = this.statusLista.filter(x => x.unidade && (
          x.unidade.id === this.lockedUnit.id || 
          x.unidade.loja.toLowerCase() === this.lockedUnit.loja.toLowerCase() ||
          x.unidade.codigo === this.lockedUnit.codigo
        ));
      }

      await this.updateHeaderPillCounts();
      this.renderCards();
    }

    renderCards() {
      const grid = this.container.querySelector('#unidades-cards-container');
      if (!grid) return;
      grid.innerHTML = '';

      const filtrados = this.statusLista.filter(item => {
        const u = item.unidade;
        const matchSearch = fuzzyMatchUnidade(u, this.searchQuery);
        const matchStatus = this.filterStatus === 'todos' || item.status === this.filterStatus;
        return matchSearch && matchStatus;
      });

      if (filtrados.length === 0) {
        grid.innerHTML = `<div class="empty-state" style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhuma unidade encontrada.</div>`;
        return;
      }

      filtrados.forEach(item => {
        const u = item.unidade;
        const reg = item.registro || { publicos: {}, observacao: '' };
        const statusBadge = item.status === 'concluido' 
          ? `<span class="badge badge-success"><span class="status-dot dot-success"></span> CONCLUÍDO (${item.totalComensais})</span>` 
          : `<span class="badge badge-pending"><span class="status-dot dot-pending"></span> PENDENTE</span>`;

        const card = document.createElement('div');
        card.className = `unidade-card ${item.status === 'concluido' ? 'card-done' : 'card-pending'}`;
        
        card.innerHTML = `
          <div class="card-header-compact">
            <div class="card-unit-title"><h3>${u.loja}</h3></div>
            <div class="card-status-area">${statusBadge}</div>
          </div>
          <div class="card-inputs-area">
            <form class="form-comensais-unidade" data-unidade-id="${u.id}">
              <div class="publicos-grid">
                ${this.publicosAtivos.map(p => {
                  const val = reg && reg.publicos ? reg.publicos[p.id] : 0;
                  const displayVal = ensureNumberValue(val);
                  return `
                    <div class="input-publico-item">
                      <label>${p.nome}</label>
                      <input type="text" inputmode="numeric" pattern="[0-9]*" class="input-comensal-num" name="${p.id}" value="${displayVal}" placeholder="0">
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="obs-container">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label style="font-size: 0.74rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; margin-left: 2px;">OBSERVAÇÃO</label>
                  <div class="auto-save-indicator" style="font-size: 0.74rem; font-weight: 700; text-align: right; white-space: nowrap;"></div>
                </div>
                <input type="text" class="input-obs" name="observacao" value="${reg.observacao || ''}" placeholder="Digite observações da unidade (opcional)...">
              </div>
              <div class="alert-discrepancia-container" style="margin-top: 6px;"></div>
            </form>
          </div>
        `;

        const form = card.querySelector('.form-comensais-unidade');
        let autoSaveTimer = null;

        const performAutoSave = async () => {
          const formData = new FormData(form);
          const publicosValues = {};
          let totalVal = 0;
          let hasAnyEntry = false;

          this.publicosAtivos.forEach(p => {
            const rawVal = formData.get(p.id);
            if (rawVal !== '' && rawVal !== null) {
              const num = parseInt(rawVal, 10);
              if (!isNaN(num)) {
                publicosValues[p.id] = num;
                totalVal += num;
                hasAnyEntry = true;
              } else {
                publicosValues[p.id] = 0;
              }
            } else {
              publicosValues[p.id] = 0;
            }
          });

          const observacao = formData.get('observacao') || '';

          await saveComensaisRegistro({
            data: this.currentDate,
            unidadeId: u.id,
            publicos: publicosValues,
            observacao
          });

          const indicator = card.querySelector('.auto-save-indicator');
          if (indicator) {
            indicator.textContent = 'Salvo ';
            indicator.style.color = '#16a34a';
            setTimeout(() => {
              if (indicator.textContent === 'Salvo ') indicator.textContent = '';
            }, 2500);
          }

          const statusArea = card.querySelector('.card-status-area');
          if (statusArea) {
            if (hasAnyEntry && totalVal > 0) {
              statusArea.innerHTML = `<span class="badge badge-success"><span class="status-dot dot-success"></span> CONCLUÍDO (${totalVal})</span>`;
              card.className = 'unidade-card card-done';
            } else {
              statusArea.innerHTML = `<span class="badge badge-pending"><span class="status-dot dot-pending"></span> PENDENTE</span>`;
              card.className = 'unidade-card card-pending';
            }
          }

          this.updateHeaderPillCounts();

          const alerta = await checkDiscrepanciaAlert(u.id, totalVal);
          const alertaBox = card.querySelector('.alert-discrepancia-container');
          if (alerta && totalVal > 0) {
            alertaBox.innerHTML = `
              <div style="padding: 6px 10px; background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 0.76rem; border-radius: 4px;">
                Atenção: O total (${totalVal}) está ${alerta.difPct > 0 ? '+' : ''}${alerta.difPct}% em relação à média habitual (${alerta.media}) desta unidade.
              </div>
            `;
          } else {
            alertaBox.innerHTML = '';
          }
        };

        const numInputs = form.querySelectorAll('.input-comensal-num');
        numInputs.forEach(input => {
          if (input.value.trim() === '') {
            input.value = '0';
          }

          input.addEventListener('focus', () => {
            try {
              input.select();
            } catch (e) {}
          });

          input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
              input.value = '0';
            }
            performAutoSave();
          });

          input.addEventListener('input', () => {
            const clean = input.value.replace(/\D/g, '');
            if (clean !== input.value) {
              input.value = clean;
            }

            const indicator = card.querySelector('.auto-save-indicator');
            if (indicator) {
              indicator.textContent = 'Salvando...';
              indicator.style.color = 'var(--primary)';
            }
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(performAutoSave, 400);
          });

          input.addEventListener('change', performAutoSave);
        });

        const obsInput = form.querySelector('.input-obs');
        if (obsInput) {
          obsInput.addEventListener('input', () => {
            const indicator = card.querySelector('.auto-save-indicator');
            if (indicator) {
              indicator.textContent = 'Salvando...';
              indicator.style.color = 'var(--primary)';
            }
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(performAutoSave, 400);
          });
          obsInput.addEventListener('change', performAutoSave);
        }

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          performAutoSave();
        });

        grid.appendChild(card);
      });
    }
  }

  // Helper para abreviar nomes de cidades longas mantendo visual limpo
  function formatLojaDisplayName(lojaName) {
    if (!lojaName) return '';
    let name = lojaName;
    name = name.replace(/CONSELHEIRO LAFAIETE/gi, 'C. LAFAIETE');
    name = name.replace(/SANTANA DO PARAÍSO/gi, 'SANTANA');
    name = name.replace(/SÃO JOÃO DEL REI/gi, 'SJDR');
    name = name.replace(/MONTES CLAROS I\b/gi, 'MOC I');
    name = name.replace(/MONTES CLAROS II\b/gi, 'MOC II');
    name = name.replace(/MONTES CLAROS III\b/gi, 'MOC III');
    name = name.replace(/MONTES CLAROS/gi, 'MOC');
    name = name.replace(/JUIZ DE FORA I\b/gi, 'JF I');
    name = name.replace(/JUIZ DE FORA II\b/gi, 'JF II');
    name = name.replace(/JOÃO MONLEVADE/gi, 'J. MONLEVADE');
    return name;
  }

  // --- 9. COMENSAIS REPORT VIEW (PAINEL 100% GRÁFICO SVG & EXPORTAÇÃO PDF) ---
  class ComensaisReportView {
    constructor(appController) {
      this.appController = appController;
      this.periodo = 'este_mes';
      this.dataInicio = '';
      this.dataFim = '';
      this.activeTab = 'visual'; // 'visual', 'tabela' ou 'matriz'
      this.matrixAno = new Date().getFullYear();
      this.matrixMes = new Date().getMonth();
      this.matrixFilter = 'todas';
    }

    async render(container, currentProfile) {
      this.currentProfile = currentProfile;
      this.container = container;
      this.setPeriodDates('este_mes');

      container.innerHTML = `
        <!-- Cabeçalho Oculto para Impressão PDF -->
        <div class="pdf-print-header">
          <h1> ABIB REFEIÇÕES COLETIVAS</h1>
          <p>Relatório de Gestão e Consolidado Visual de Comensais</p>
        </div>

        <div class="module-header">
          <div class="header-titles">
            <h2>Relatório e Painel Gráfico de Comensais</h2>
            <p class="subtitle">Análise por gráficos SVG, evolução em onda, distribuição e exportação em PDF</p>
          </div>
          <div class="header-actions">
            <button id="btn-voltar-comensais" class="btn btn-secondary"><span>⬅</span> Voltar</button>
            <button id="btn-exportar-csv" class="btn btn-secondary"> Exportar CSV</button>
            <button id="btn-exportar-pdf" class="btn btn-success"> Exportar PDF</button>
            <button id="btn-ver-detalhes-unidades" class="btn btn-primary"> Unidades</button>
          </div>
        </div>

        <div class="report-filters-card">
          <div class="filter-row">
            <div class="filter-group">
              <label>Período:</label>
              <select id="select-periodo" class="select-field">
                <option value="hoje">Hoje</option>
                <option value="ontem">Ontem</option>
                <option value="esta_semana">Esta Semana</option>
                <option value="este_mes" selected>Este Mês</option>
                <option value="mes_passado">Mês Passado</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            <div class="filter-group custom-date-group hidden">
              <label>De:</label>
              <input type="date" id="report-date-start" class="input-date">
              <label>Até:</label>
              <input type="date" id="report-date-end" class="input-date">
            </div>

            <div class="filter-group">
              <label>Filtrar Loja:</label>
              <select id="select-filtro-loja" class="select-field">
                <option value="todas">Todas as Unidades</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Caixa de Informações de Filtro Ativo (Exibida no PDF) -->
        <div id="pdf-filter-info-box" class="pdf-filter-info">
          Período: <span id="pdf-text-periodo">--</span> | Unidade: <span id="pdf-text-unidade">Todas as Unidades</span>
        </div>

        <!-- Abas de Alternância de Visualização -->
        <div class="report-view-tabs">
          <button id="tab-visual-view" class="report-tab-btn active">
            Painel Gráfico (Donut & Curvas SVG)
          </button>
          <button id="tab-table-view" class="report-tab-btn">
            Tabela Detalhada de Registros
          </button>
          <button id="tab-matriz-view" class="report-tab-btn">
            Matriz de Preenchimento Mensal
          </button>
        </div>

        <!-- KPIs Consolidados Visuais -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-title">Total de Refeições</span>
            <span class="kpi-value" id="kpi-total-refeicoes">0</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Média Diária</span>
            <span class="kpi-value" id="kpi-media-diaria">0</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Pico / Maior Dia</span>
            <span class="kpi-value" id="kpi-pico-dia">0</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-title">Unidades Ativas</span>
            <span class="kpi-value" id="kpi-unidades-ativas">0</span>
          </div>
        </div>

        <!-- PAINEL GRÁFICO SVG -->
        <div id="container-visual-dashboard" class="visual-dashboard-container">
          <!-- 1. Gráfico de Evolução em Onda / Área SVG -->
          <div class="chart-card chart-card-full">
            <div class="chart-card-header">
              <h3>Curva de Evolução Diária <span class="chart-badge" id="badge-total-dias">0 dias</span></h3>
              <small style="color: var(--text-muted);">Volume acumulado por data no período</small>
            </div>
            <div class="svg-wave-container" id="chart-daily-wave">
              <!-- Gráfico de Área SVG gerado via JS -->
            </div>
          </div>

          <div class="dashboard-charts-grid">
            <!-- 2. Gráfico de Donut SVG por Público -->
            <div class="chart-card">
              <div class="chart-card-header">
                <h3>Distribuição por Público (Donut Chart)</h3>
              </div>
              <div class="donut-chart-flex" id="chart-public-donut">
                <!-- Donut SVG e legendas pílula gerados via JS -->
              </div>
            </div>

            <!-- 3. Comparativo por Grupo Regional (AC, ABIB, MOC) -->
            <div class="chart-card">
              <div class="chart-card-header">
                <h3>Refeições por Grupo Regional</h3>
              </div>
              <div class="groups-comparison-list" id="chart-group-comparison">
                <!-- Barras de grupos geradas via JS -->
              </div>
            </div>

            <!-- 4. Ranking de Lojas -->
            <div class="chart-card">
              <div class="chart-card-header">
                <h3>Top Lojas / Unidades</h3>
              </div>
              <div class="ranking-units-list" id="chart-ranking-unidades">
                <!-- Lista de ranking gerada via JS -->
              </div>
            </div>
          </div>

          <!-- 5. Gráfico de Barras de TODAS as 21 Unidades + Resumo Por Grupo e Total Geral -->
          <div class="chart-card chart-card-full">
            <div class="chart-card-header">
              <h3>Refeições Vendidas por Unidade (Todas as 21 Lojas)</h3>
              <small style="color: var(--text-muted);">Total de comensais por unidade no período selecionado</small>
            </div>
            <div class="all-units-chart-container" id="chart-all-units-bars">
              <!-- Barras comparativas de todas as 21 lojas geradas via JS -->
            </div>
          </div>
        </div>

        <!-- TABELA DETALHADA DE REGISTROS -->
        <div id="container-table-view" class="table-responsive-card hidden">
          <table class="data-table" id="table-relatorio-comensais">
            <thead>
              <tr>
                <th>Data</th>
                <th>Loja / Unidade</th>
                <th>Públicos Detalhados</th>
                <th>Total Comensais</th>
                <th>Observação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="6" class="text-center">Carregando dados...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- MATRIZ DE PREENCHIMENTO MENSAL -->
        <div id="container-matriz-view" class="matriz-dashboard-container hidden">
          <div class="matrix-control-bar">
            <div class="matrix-month-nav">
              <button type="button" id="btn-matrix-prev-month" class="btn btn-secondary btn-sm" title="Mês anterior">◀ Mês Anterior</button>
              <div class="matrix-month-picker-wrapper">
                <select id="select-matrix-mes" class="select-field" style="width: auto; font-weight: 700;">
                  <option value="0">Janeiro</option>
                  <option value="1">Fevereiro</option>
                  <option value="2">Março</option>
                  <option value="3">Abril</option>
                  <option value="4">Maio</option>
                  <option value="5">Junho</option>
                  <option value="6">Julho</option>
                  <option value="7">Agosto</option>
                  <option value="8">Setembro</option>
                  <option value="9">Outubro</option>
                  <option value="10">Novembro</option>
                  <option value="11">Dezembro</option>
                </select>
                <select id="select-matrix-ano" class="select-field" style="width: auto; font-weight: 700;">
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>
              <button type="button" id="btn-matrix-next-month" class="btn btn-secondary btn-sm" title="Próximo mês">Próximo Mês ▶</button>
            </div>

            <!-- Controle de Data Limite com Atalhos -->
            <div class="matrix-cutoff-control">
              <span class="matrix-cutoff-label">Conferir até:</span>
              <select id="select-matrix-dia-limite" class="select-field" style="width: auto; font-weight: 700; padding: 2px 6px; font-size: 0.76rem;">
                <!-- Gerado dinamicamente via JS -->
              </select>
              <div class="matrix-cutoff-shortcuts">
                <button type="button" class="btn-shortcut" data-cutoff="last-week" title="Última semana (até o último sábado)">Última Semana</button>
                <button type="button" class="btn-shortcut" data-cutoff="yesterday" title="Dia de ontem">Ontem</button>
                <button type="button" class="btn-shortcut" data-cutoff="today" title="Dia de hoje">Hoje</button>
                <button type="button" class="btn-shortcut" data-cutoff="full-month" title="Mês completo">Mês Completo</button>
              </div>
            </div>

            <div class="matrix-pills">
              <button type="button" class="pill active" data-matrix-filter="todas">Todas as 21 Lojas</button>
              <button type="button" class="pill pill-pending" data-matrix-filter="pendentes">Apenas com Pendências (<span id="matrix-count-pendentes">0</span>)</button>
              <button type="button" class="pill pill-success" data-matrix-filter="completas">100% em Dia (<span id="matrix-count-completas">0</span>)</button>
            </div>
          </div>

          <div class="matrix-kpi-grid">
            <div class="matrix-kpi-card">
              <span class="matrix-kpi-label">Taxa Geral de Preenchimento</span>
              <span class="matrix-kpi-val" id="matrix-kpi-taxa">0%</span>
              <small id="matrix-kpi-taxa-sub" style="color: var(--text-muted);">0 de 0 envios esperados</small>
            </div>
            <div class="matrix-kpi-card">
              <span class="matrix-kpi-label">Lojas 100% em Dia</span>
              <span class="matrix-kpi-val" id="matrix-kpi-lojas-completas" style="color: #16a34a;">0 / 21</span>
              <small style="color: var(--text-muted);">Sem pendências até a data</small>
            </div>
            <div class="matrix-kpi-card">
              <span class="matrix-kpi-label">Lojas com Pendências</span>
              <span class="matrix-kpi-val" id="matrix-kpi-lojas-pendentes" style="color: #dc2626;">0</span>
              <small style="color: var(--text-muted);">Necessitam envio de fotos</small>
            </div>
            <div class="matrix-kpi-card">
              <span class="matrix-kpi-label">Total de Refeições no Mês</span>
              <span class="matrix-kpi-val" id="matrix-kpi-total-refeicoes" style="color: var(--primary);">0</span>
              <small style="color: var(--text-muted);">Soma de todos os dias registrados</small>
            </div>
          </div>

          <div class="matrix-legend">
            <div class="matrix-legend-item"><span class="matrix-legend-box cell-filled"></span> Preenchido (Dados Salvos)</div>
            <div class="matrix-legend-item"><span class="matrix-legend-box cell-missing"></span> Pendente (Não Enviado)</div>
            <div class="matrix-legend-item"><span class="matrix-legend-box cell-future"></span> Dia Futuro</div>
            <div class="matrix-legend-item"><span class="matrix-legend-box cell-weekend-header"></span> Fim de Semana (Sáb/Dom)</div>
          </div>

          <div class="matrix-table-card">
            <div class="matrix-table-wrapper" id="matrix-table-wrapper">
              <!-- Tabela Heatmap gerada via JS -->
            </div>
          </div>

          <!-- Tooltip Flutuante no Cursor -->
          <div id="matrix-floating-tooltip" class="matrix-floating-tooltip hidden"></div>
        </div>

        <!-- Modal de Detalhes das Unidades -->
        <div id="modal-detalhes-unidades" class="modal hidden">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h3>Cadastro e Detalhamento Geral das Unidades</h3>
              <button class="btn-close-modal-unidades"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body">
              <p class="help-text">Exibição dos dados permitidos para o perfil ativo (<strong>${currentProfile ? currentProfile.nome : 'Padrão'}</strong>):</p>
              <div class="table-responsive-card">
                <table class="data-table" id="table-detalhes-unidades-modal">
                  <thead>
                    <tr id="header-detalhes-unidades"></tr>
                  </thead>
                  <tbody id="body-detalhes-unidades"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;

      this.bindEvents();
      await this.populateLojaFilter();
      await this.loadReportData();
    }

    setPeriodDates(type) {
      const today = new Date();
      this.periodo = type;

      if (type === 'hoje') {
        const iso = today.toISOString().split('T')[0];
        this.dataInicio = iso;
        this.dataFim = iso;
      } else if (type === 'ontem') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const iso = yesterday.toISOString().split('T')[0];
        this.dataInicio = iso;
        this.dataFim = iso;
      } else if (type === 'esta_semana') {
        const first = today.getDate() - today.getDay();
        const firstDay = new Date(today.setDate(first));
        this.dataInicio = firstDay.toISOString().split('T')[0];
        this.dataFim = new Date().toISOString().split('T')[0];
      } else if (type === 'este_mes') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        this.dataInicio = firstDay.toISOString().split('T')[0];
        this.dataFim = new Date().toISOString().split('T')[0];
      } else if (type === 'mes_passado') {
        const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
        this.dataInicio = firstDay.toISOString().split('T')[0];
        this.dataFim = lastDay.toISOString().split('T')[0];
      }
    }

    bindEvents() {
      const btnVoltar = this.container.querySelector('#btn-voltar-comensais');
      btnVoltar.addEventListener('click', () => {
        window.app.switchView('comensais');
      });

      // Alternância de Abas
      const tabVisual = this.container.querySelector('#tab-relatorio-visual') || this.container.querySelector('#tab-visual-view');
      const tabTable = this.container.querySelector('#tab-relatorio-tabela') || this.container.querySelector('#tab-table-view');
      const tabMatriz = this.container.querySelector('#tab-relatorio-matriz') || this.container.querySelector('#tab-matriz-view');
      const visualBox = this.container.querySelector('#container-visual-view') || this.container.querySelector('#container-visual-dashboard');
      const tableBox = this.container.querySelector('#container-table-view');
      const matrizBox = this.container.querySelector('#container-matriz-view');
      const filtersCard = this.container.querySelector('#container-relatorio-filtros') || this.container.querySelector('.report-filters-card');
      const kpiGrid = this.container.querySelector('#container-relatorio-kpis') || this.container.querySelector('.kpi-grid');

      if (tabVisual) {
        tabVisual.addEventListener('click', () => {
          tabVisual.classList.add('active');
          if (tabTable) tabTable.classList.remove('active');
          if (tabMatriz) tabMatriz.classList.remove('active');
          if (filtersCard) filtersCard.classList.remove('hidden');
          if (kpiGrid) kpiGrid.classList.remove('hidden');
          if (visualBox) visualBox.classList.remove('hidden');
          if (tableBox) tableBox.classList.add('hidden');
          if (matrizBox) matrizBox.classList.add('hidden');
          this.activeTab = 'visual';
        });
      }

      if (tabTable) {
        tabTable.addEventListener('click', () => {
          tabTable.classList.add('active');
          if (tabVisual) tabVisual.classList.remove('active');
          if (tabMatriz) tabMatriz.classList.remove('active');
          if (filtersCard) filtersCard.classList.remove('hidden');
          if (kpiGrid) kpiGrid.classList.remove('hidden');
          if (tableBox) tableBox.classList.remove('hidden');
          if (visualBox) visualBox.classList.add('hidden');
          if (matrizBox) matrizBox.classList.add('hidden');
          this.activeTab = 'tabela';
        });
      }

      if (tabMatriz) {
        tabMatriz.addEventListener('click', async () => {
          tabMatriz.classList.add('active');
          if (tabVisual) tabVisual.classList.remove('active');
          if (tabTable) tabTable.classList.remove('active');
          if (filtersCard) filtersCard.classList.add('hidden');
          if (kpiGrid) kpiGrid.classList.add('hidden');
          if (matrizBox) matrizBox.classList.remove('hidden');
          if (visualBox) visualBox.classList.add('hidden');
          if (tableBox) tableBox.classList.add('hidden');
          this.activeTab = 'matriz';
          await this.renderMatrizView();
        });
      }

      // Controles da Matriz de Preenchimento Mensal
      const btnMatrixPrev = this.container.querySelector('#btn-matrix-prev-month');
      const btnMatrixNext = this.container.querySelector('#btn-matrix-next-month');
      const selectMatrixMes = this.container.querySelector('#select-matrix-mes');
      const selectMatrixAno = this.container.querySelector('#select-matrix-ano');

      if (btnMatrixPrev) {
        btnMatrixPrev.addEventListener('click', async () => {
          this.matrixDiaLimite = null;
          if (this.matrixMes === 0) {
            this.matrixMes = 11;
            this.matrixAno--;
          } else {
            this.matrixMes--;
          }
          await this.renderMatrizView();
        });
      }

      if (btnMatrixNext) {
        btnMatrixNext.addEventListener('click', async () => {
          this.matrixDiaLimite = null;
          if (this.matrixMes === 11) {
            this.matrixMes = 0;
            this.matrixAno++;
          } else {
            this.matrixMes++;
          }
          await this.renderMatrizView();
        });
      }

      if (selectMatrixMes) {
        selectMatrixMes.addEventListener('change', async (e) => {
          this.matrixDiaLimite = null;
          this.matrixMes = parseInt(e.target.value, 10);
          await this.renderMatrizView();
        });
      }

      if (selectMatrixAno) {
        selectMatrixAno.addEventListener('change', async (e) => {
          this.matrixDiaLimite = null;
          this.matrixAno = parseInt(e.target.value, 10);
          await this.renderMatrizView();
        });
      }

      const selectDiaLimite = this.container.querySelector('#select-matrix-dia-limite');
      if (selectDiaLimite) {
        selectDiaLimite.addEventListener('change', async (e) => {
          this.matrixDiaLimite = parseInt(e.target.value, 10);
          await this.renderMatrizView();
        });
      }

      const cutoffShortcuts = this.container.querySelectorAll('.matrix-cutoff-shortcuts .btn-shortcut');
      cutoffShortcuts.forEach(btn => {
        btn.addEventListener('click', async () => {
          const type = btn.dataset.cutoff;
          const daysInMonth = new Date(this.matrixAno, this.matrixMes + 1, 0).getDate();
          const today = new Date();
          const isCurrentMonth = (today.getFullYear() === this.matrixAno && today.getMonth() === this.matrixMes);

          if (type === 'full-month') {
            this.matrixDiaLimite = daysInMonth;
          } else if (type === 'today') {
            this.matrixDiaLimite = isCurrentMonth ? today.getDate() : daysInMonth;
          } else if (type === 'yesterday') {
            this.matrixDiaLimite = isCurrentMonth ? Math.max(1, today.getDate() - 1) : daysInMonth;
          } else if (type === 'last-week') {
            if (isCurrentMonth) {
              const dow = today.getDay(); // 0 Dom, 1 Seg, ..., 6 Sab
              const diffToSaturday = (dow === 6) ? 7 : (dow + 1);
              const satDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToSaturday);
              if (satDate.getMonth() === this.matrixMes && satDate.getFullYear() === this.matrixAno) {
                this.matrixDiaLimite = satDate.getDate();
              } else {
                this.matrixDiaLimite = 1;
              }
            } else {
              this.matrixDiaLimite = daysInMonth;
            }
          }
          await this.renderMatrizView();
        });
      });

      const matrixPills = this.container.querySelectorAll('.matrix-pills .pill');
      matrixPills.forEach(pill => {
        pill.addEventListener('click', async () => {
          matrixPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.matrixFilter = pill.dataset.matrixFilter;
          await this.renderMatrizView();
        });
      });

    const selectPeriodo = this.container.querySelector('#select-periodo');
    const customGroup = this.container.querySelector('.custom-date-group');
    const selectFiltroLoja = this.container.querySelector('#select-filtro-loja');
    const dateStart = this.container.querySelector('#report-date-start');
    const dateEnd = this.container.querySelector('#report-date-end');

    // Filtro Automático ao alterar seletor de período
    selectPeriodo.addEventListener('change', async (e) => {
      const val = e.target.value;
      if (val === 'personalizado') {
        customGroup.classList.remove('hidden');
      } else {
        customGroup.classList.add('hidden');
        this.setPeriodDates(val);
        await this.loadReportData();
      }
    });

    // Filtro Automático ao alterar a loja selecionada
    if (selectFiltroLoja) {
      selectFiltroLoja.addEventListener('change', async () => {
        await this.loadReportData();
      });
    }

    // Filtro Automático ao alterar as datas personalizadas
    if (dateStart) {
      dateStart.addEventListener('change', async () => {
        this.dataInicio = dateStart.value;
        await this.loadReportData();
      });
    }

    if (dateEnd) {
      dateEnd.addEventListener('change', async () => {
        this.dataFim = dateEnd.value;
        await this.loadReportData();
      });
    }

      // Exportar CSV
      const btnExportCSV = this.container.querySelector('#btn-exportar-csv');
      btnExportCSV.addEventListener('click', async () => {
        const csvContent = await exportComensaisCSV(this.dataInicio, this.dataFim);
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `comensais_${this.dataInicio}_ate_${this.dataFim}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });

      // Exportar PDF
      const btnExportPDF = this.container.querySelector('#btn-exportar-pdf');
      btnExportPDF.addEventListener('click', () => {
        visualBox.classList.remove('hidden');
        tableBox.classList.remove('hidden');

        setTimeout(() => {
          window.print();
          if (this.activeTab === 'visual') {
            tableBox.classList.add('hidden');
          } else {
            visualBox.classList.add('hidden');
          }
        }, 200);
      });

      // Modal de Detalhes
      const btnVerDetalhes = this.container.querySelector('#btn-ver-detalhes-unidades');
      btnVerDetalhes.addEventListener('click', async () => {
        await this.renderModalDetalhesUnidades();
      });

      const btnCloseDetalhes = this.container.querySelector('.btn-close-modal-unidades');
      if (btnCloseDetalhes) {
        btnCloseDetalhes.addEventListener('click', () => {
          this.container.querySelector('#modal-detalhes-unidades').classList.add('hidden');
        });
      }
    }

    async populateLojaFilter() {
      const unidades = await getUnidades();
      const select = this.container.querySelector('#select-filtro-loja');
      select.innerHTML = '<option value="todas">Todas as Unidades</option>';
      unidades.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = formatLojaDisplayName(u.loja);
        select.appendChild(opt);
      });
    }

    async loadReportData() {
      const todos = await getCollection(STORAGE_KEYS.COMENSAIS);
      const unidades = await getUnidades();
      const publicos = await getPublicos();
      const unidadesMap = new Map(unidades.map(u => [u.id, u]));

      const lojaSelect = this.container.querySelector('#select-filtro-loja');
      const lojaFiltro = lojaSelect.value;
      const nomeLojaFiltro = lojaSelect.options[lojaSelect.selectedIndex]?.text || 'Todas as Unidades';

      // Texto do filtro para o PDF
      const dtInicioFmt = this.dataInicio ? new Date(this.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '';
      const dtFimFmt = this.dataFim ? new Date(this.dataFim + 'T00:00:00').toLocaleDateString('pt-BR') : '';
      this.container.querySelector('#pdf-text-periodo').textContent = `${dtInicioFmt} a ${dtFimFmt}`;
      this.container.querySelector('#pdf-text-unidade').textContent = nomeLojaFiltro;

      const filtrados = todos.filter(r => {
        const dateMatch = r.data >= this.dataInicio && r.data <= this.dataFim;
        const lojaMatch = lojaFiltro === 'todas' || r.unidadeId === lojaFiltro;
        return dateMatch && lojaMatch;
      }).sort((a, b) => a.data.localeCompare(b.data));

      let totalRefeicoes = 0;
      const dailyMap = new Map();
      const publicosMap = new Map();
      const unidadesTotalMap = new Map();
      const gruposTotalMap = new Map([['AC', 0], ['ABIB', 0], ['MOC', 0]]);

      publicos.forEach(p => publicosMap.set(p.id, 0));

      filtrados.forEach(r => {
        let docTotal = 0;
        if (r.publicos) {
          Object.entries(r.publicos).forEach(([pId, v]) => {
            const num = parseInt(v || 0, 10);
            docTotal += num;
            if (publicosMap.has(pId)) {
              publicosMap.set(pId, publicosMap.get(pId) + num);
            }
          });
        }
        totalRefeicoes += docTotal;

        const currDaily = dailyMap.get(r.data) || 0;
        dailyMap.set(r.data, currDaily + docTotal);

        const currUnit = unidadesTotalMap.get(r.unidadeId) || 0;
        unidadesTotalMap.set(r.unidadeId, currUnit + docTotal);

        const uObj = unidadesMap.get(r.unidadeId);
        if (uObj && uObj.grupo) {
          const grpKey = uObj.grupo.toUpperCase();
          if (gruposTotalMap.has(grpKey)) {
            gruposTotalMap.set(grpKey, gruposTotalMap.get(grpKey) + docTotal);
          }
        }
      });

      const numDias = dailyMap.size || 1;
      const mediaDiaria = Math.round(totalRefeicoes / numDias);

      let picoDia = 0;
      dailyMap.forEach(v => {
        if (v > picoDia) picoDia = v;
      });

      this.container.querySelector('#kpi-total-refeicoes').textContent = totalRefeicoes.toLocaleString('pt-BR');
      this.container.querySelector('#kpi-media-diaria').textContent = mediaDiaria.toLocaleString('pt-BR');
      this.container.querySelector('#kpi-pico-dia').textContent = picoDia.toLocaleString('pt-BR');
      this.container.querySelector('#kpi-unidades-ativas').textContent = unidades.filter(u => u.ativo !== false).length;
      this.container.querySelector('#badge-total-dias').textContent = `${dailyMap.size} dias analisados`;

      // 1. RENDERIZAR GRÁFICO DE ONDA / ÁREA SVG
      this.renderSVGWaveChart(dailyMap);

      // 2. RENDERIZAR DONUT SVG POR PÚBLICO
      this.renderSVGDonutChart(publicosMap, publicos, totalRefeicoes);

      // 3. RENDERIZAR GRÁFICO DE GRUPOS (AC, ABIB, MOC)
      this.renderGroupComparisonChart(gruposTotalMap, totalRefeicoes);

      // 4. RENDERIZAR RANKING DE UNIDADES
      this.renderUnitRanking(unidadesTotalMap, unidadesMap);

      // 5. RENDERIZAR GRÁFICO DE BARRAS DE TODAS AS 21 UNIDADES + RESUMO NO RODAPÉ
      this.renderAllUnitsBarChart(unidadesTotalMap, unidades, gruposTotalMap, totalRefeicoes);

      // 6. RENDERIZAR TABELA DETALHADA
      this.renderTableData(filtrados, unidadesMap, publicos);
    }

    renderSVGWaveChart(dailyMap) {
      const container = this.container.querySelector('#chart-daily-wave');
      container.innerHTML = '';

      if (dailyMap.size === 0) {
        container.innerHTML = `<p style="width: 100%; text-align: center; color: var(--text-muted); padding: 40px;">Sem lançamentos no período selecionado.</p>`;
        return;
      }

      const entries = Array.from(dailyMap.entries());
      const svgWidth = 800;
      const svgHeight = 220;
      const paddingX = 45;
      const paddingY = 45;

      let maxVal = 0;
      entries.forEach(([_, val]) => {
        if (val > maxVal) maxVal = val;
      });
      if (maxVal === 0) maxVal = 1;

      const usableWidth = svgWidth - (paddingX * 2);
      const usableHeight = svgHeight - (paddingY * 2);
      const stepX = entries.length > 1 ? usableWidth / (entries.length - 1) : 0;

      const points = entries.map(([dataISO, total], i) => {
        const x = entries.length === 1 ? svgWidth / 2 : paddingX + (i * stepX);
        const y = (svgHeight - paddingY) - ((total / maxVal) * usableHeight);
        const dataFmt = dataISO.split('-').slice(1).reverse().join('/');
        return { x, y, total, dataFmt };
      });

      let dLine = `M ${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cx1 = prev.x + (curr.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (curr.x - prev.x) / 2;
        const cy2 = curr.y;
        dLine += ` C ${cx1},${cy1} ${cx2},${cy2} ${curr.x},${curr.y}`;
      }

      const dArea = `${dLine} L ${points[points.length - 1].x},${svgHeight - paddingY + 10} L ${points[0].x},${svgHeight - paddingY + 10} Z`;

      let svgHTML = `
        <svg class="svg-wave-chart" viewBox="0 0 ${svgWidth} ${svgHeight}">
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <line x1="${paddingX}" y1="${paddingY}" x2="${svgWidth - paddingX}" y2="${paddingY}" stroke="#e2e8f0" stroke-dasharray="4 4" />
          <line x1="${paddingX}" y1="${svgHeight - paddingY}" x2="${svgWidth - paddingX}" y2="${svgHeight - paddingY}" stroke="#cbd5e1" stroke-width="1.5" />

          <path d="${dArea}" fill="url(#waveGradient)" />
          <path d="${dLine}" fill="none" stroke="#10b981" stroke-width="3.5" stroke-linecap="round" />

          ${points.map(pt => `
            <g class="wave-group">
              <circle cx="${pt.x}" cy="${pt.y}" r="5" class="wave-point">
                <title>${pt.dataFmt}: ${pt.total} comensais</title>
              </circle>
              <text x="${pt.x}" y="${pt.y - 12}" class="wave-value-text">${pt.total}</text>
              <text x="${pt.x}" y="${svgHeight - 12}" class="wave-label-text">${pt.dataFmt}</text>
            </g>
          `).join('')}
        </svg>
      `;

      container.innerHTML = svgHTML;
    }

    renderSVGDonutChart(publicosMap, publicos, totalGeral) {
      const container = this.container.querySelector('#chart-public-donut');
      container.innerHTML = '';

      if (totalGeral === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Sem dados para exibir.</p>`;
        return;
      }

      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      const radius = 60;
      const circumference = 2 * Math.PI * radius;
      let accumulatedOffset = 0;

      const segmentsHTML = [];
      const legendHTML = [];

      publicos.forEach((p, idx) => {
        const total = publicosMap.get(p.id) || 0;
        const pct = totalGeral > 0 ? total / totalGeral : 0;
        const strokeDash = pct * circumference;
        const strokeGap = circumference - strokeDash;
        const color = colors[idx % colors.length];

        if (total > 0) {
          segmentsHTML.push(`
            <circle cx="90" cy="90" r="${radius}" class="donut-segment"
              stroke="${color}"
              stroke-dasharray="${strokeDash} ${strokeGap}"
              stroke-dashoffset="-${accumulatedOffset}">
              <title>${p.nome}: ${total} (${(pct * 100).toFixed(1)}%)</title>
            </circle>
          `);
          accumulatedOffset += strokeDash;
        }

        legendHTML.push(`
          <div class="donut-legend-pill">
            <span class="legend-dot" style="background: ${color};"></span>
            <span>${p.nome}:</span>
            <strong style="color: var(--text-title);">${total.toLocaleString('pt-BR')} (${(pct * 100).toFixed(1)}%)</strong>
          </div>
        `);
      });

      container.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <svg class="svg-donut-chart" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="${radius}" fill="none" stroke="#f1f5f9" stroke-width="24" />
            ${segmentsHTML.join('')}
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <span style="font-size: 1.1rem; font-weight: 800; color: var(--text-title); display: block; line-height: 1;">${totalGeral.toLocaleString('pt-BR')}</span>
            <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total</span>
          </div>
        </div>

        <div class="donut-legend-grid">
          ${legendHTML.join('')}
        </div>
      `;
    }

    renderGroupComparisonChart(gruposTotalMap, totalGeral) {
      const container = this.container.querySelector('#chart-group-comparison');
      container.innerHTML = '';

      if (totalGeral === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Sem dados para exibir.</p>`;
        return;
      }

      const groupConfig = [
        { id: 'AC', name: 'Grupo AC (8 Lojas)', badgeClass: 'group-badge-ac', color: '#6366f1' },
        { id: 'ABIB', name: 'Grupo ABIB (6 Lojas)', badgeClass: 'group-badge-abib', color: '#10b981' },
        { id: 'MOC', name: 'Grupo MOC (7 Lojas)', badgeClass: 'group-badge-moc', color: '#8b5cf6' }
      ];

      groupConfig.forEach(grp => {
        const total = gruposTotalMap.get(grp.id) || 0;
        const pct = totalGeral > 0 ? ((total / totalGeral) * 100).toFixed(1) : 0;

        const item = document.createElement('div');
        item.className = 'group-comp-item';
        item.innerHTML = `
          <div class="group-comp-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="group-badge-tag ${grp.badgeClass}">${grp.id}</span>
              <span>${grp.name}</span>
            </div>
            <span class="group-comp-val"><strong>${total.toLocaleString('pt-BR')}</strong> (${pct}%)</span>
          </div>
          <div class="group-track">
            <div class="group-bar-fill" style="width: ${pct}%; background: ${grp.color};"></div>
          </div>
        `;
        container.appendChild(item);
      });
    }

    renderUnitRanking(unidadesTotalMap, unidadesMap) {
      const container = this.container.querySelector('#chart-ranking-unidades');
      container.innerHTML = '';

      const sortedUnits = Array.from(unidadesTotalMap.entries())
        .sort((a, b) => b[1] - a[1]);

      if (sortedUnits.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Sem dados para exibir.</p>`;
        return;
      }

      sortedUnits.slice(0, 6).forEach(([uId, total], index) => {
        const u = unidadesMap.get(uId) || { loja: 'Unidade ' + uId };
        const shortName = formatLojaDisplayName(u.loja);
        const item = document.createElement('div');
        item.className = 'ranking-unit-item';
        item.innerHTML = `
          <div class="ranking-unit-pos">${index + 1}º</div>
          <span class="ranking-unit-name" title="${u.loja}">${shortName}</span>
          <span class="ranking-unit-total">${total.toLocaleString('pt-BR')} comensais</span>
        `;
        container.appendChild(item);
      });
    }

    renderAllUnitsBarChart(unidadesTotalMap, unidades, gruposTotalMap, totalGeral) {
      const container = this.container.querySelector('#chart-all-units-bars');
      container.innerHTML = '';

      const unidadesAtivas = unidades.filter(u => u.ativo !== false);

      let maxVal = 0;
      unidadesAtivas.forEach(u => {
        const tot = unidadesTotalMap.get(u.id) || 0;
        if (tot > maxVal) maxVal = tot;
      });
      if (maxVal === 0) maxVal = 1;

      const rowsHTML = [];

      unidadesAtivas.forEach(u => {
        const total = unidadesTotalMap.get(u.id) || 0;
        const pct = Math.round((total / maxVal) * 100);
        const grpClass = u.grupo ? `group-badge-${u.grupo.toLowerCase()}` : '';
        const shortName = formatLojaDisplayName(u.loja);

        rowsHTML.push(`
          <div class="all-units-bar-row">
            <div class="all-units-bar-label" title="${u.loja}">
              ${u.grupo ? `<span class="group-badge-tag ${grpClass}">${u.grupo}</span>` : ''}
              <span>${shortName}</span>
            </div>
            <div class="all-units-bar-track">
              <div class="all-units-bar-fill" style="width: ${Math.max(pct, 2)}%;"></div>
            </div>
            <div class="all-units-bar-val">${total.toLocaleString('pt-BR')}</div>
          </div>
        `);
      });

      const totalAC = gruposTotalMap ? (gruposTotalMap.get('AC') || 0) : 0;
      const totalABIB = gruposTotalMap ? (gruposTotalMap.get('ABIB') || 0) : 0;
      const totalMOC = gruposTotalMap ? (gruposTotalMap.get('MOC') || 0) : 0;
      const totGeral = totalGeral || (totalAC + totalABIB + totalMOC);

      const pctAC = totGeral > 0 ? ((totalAC / totGeral) * 100).toFixed(1) : '0';
      const pctABIB = totGeral > 0 ? ((totalABIB / totGeral) * 100).toFixed(1) : '0';
      const pctMOC = totGeral > 0 ? ((totalMOC / totGeral) * 100).toFixed(1) : '0';

      container.innerHTML = `
        <div class="all-units-bars-grid">
          ${rowsHTML.join('')}
        </div>

        <div class="all-units-footer-summary">
          <div class="summary-group-chips">
            <div class="summary-group-chip">
              <span class="group-badge-tag group-badge-ac">AC</span>
              <span>Grupo AC: <strong>${totalAC.toLocaleString('pt-BR')}</strong> <small>(${pctAC}%)</small></span>
            </div>
            <div class="summary-group-chip">
              <span class="group-badge-tag group-badge-abib">ABIB</span>
              <span>Grupo ABIB: <strong>${totalABIB.toLocaleString('pt-BR')}</strong> <small>(${pctABIB}%)</small></span>
            </div>
            <div class="summary-group-chip">
              <span class="group-badge-tag group-badge-moc">MOC</span>
              <span>Grupo MOC: <strong>${totalMOC.toLocaleString('pt-BR')}</strong> <small>(${pctMOC}%)</small></span>
            </div>
          </div>

          <div class="summary-total-chip">
            <span>TOTAL GERAL:</span>
            <strong>${totGeral.toLocaleString('pt-BR')} comensais</strong>
          </div>
        </div>
      `;
    }

    renderTableData(filtrados, unidadesMap, publicos) {
      const tbody = this.container.querySelector('#table-relatorio-comensais tbody');
      tbody.innerHTML = '';

      const ordenadosDecrescente = [...filtrados].reverse();

      if (ordenadosDecrescente.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum registro encontrado no período selecionado.</td></tr>`;
        return;
      }

      ordenadosDecrescente.forEach(r => {
        const u = unidadesMap.get(r.unidadeId) || { loja: 'Desconhecida' };
        let totalDoc = 0;
        const partes = [];

        publicos.forEach(p => {
          const val = (r.publicos && r.publicos[p.id]) || 0;
          if (val > 0) {
            totalDoc += parseInt(val, 10);
            partes.push(`<strong>${p.nome}:</strong> ${val}`);
          }
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
          <td><strong>${u.loja}</strong></td>
          <td>${partes.length > 0 ? partes.join(' | ') : '<em>Sem dados</em>'}</td>
          <td><strong class="text-primary">${totalDoc}</strong></td>
          <td>${r.observacao || '-'}</td>
          <td>
            <button class="btn btn-sm btn-secondary btn-editar-reg" data-id="${r.id}">Editar</button>
          </td>
        `;

        tr.querySelector('.btn-editar-reg').addEventListener('click', () => {
          window.app.switchView('comensais');
        });

        tbody.appendChild(tr);
      });
    }

    async renderModalDetalhesUnidades() {
      const unidades = await getUnidades();
      const modal = this.container.querySelector('#modal-detalhes-unidades');
      const theadRow = this.container.querySelector('#header-detalhes-unidades');
      const tbody = this.container.querySelector('#body-detalhes-unidades');

      const permissoes = (this.currentProfile && this.currentProfile.permissoesCamposUnidade) || ["codigo", "grupo", "loja", "unidade", "cnpj"];

      let headerHTML = '';
      if (permissoes.includes('codigo')) headerHTML += '<th>Cód</th>';
      if (permissoes.includes('grupo')) headerHTML += '<th>Grupo</th>';
      if (permissoes.includes('loja')) headerHTML += '<th>Loja / Unidade</th>';
      if (permissoes.includes('unidade')) headerHTML += '<th>Tipo Unidade</th>';
      if (permissoes.includes('cnpj')) headerHTML += '<th>CNPJ</th>';

      theadRow.innerHTML = headerHTML;
      tbody.innerHTML = '';

      unidades.forEach(u => {
        let rowHTML = '<tr>';
        if (permissoes.includes('codigo')) rowHTML += `<td>${u.codigo || '-'}</td>`;
        if (permissoes.includes('grupo')) rowHTML += `<td><span class="badge-tag">${u.grupo || '-'}</span></td>`;
        if (permissoes.includes('loja')) rowHTML += `<td><strong>${u.loja}</strong></td>`;
        if (permissoes.includes('unidade')) rowHTML += `<td>${u.unidade || '-'}</td>`;
        if (permissoes.includes('cnpj')) rowHTML += `<td><code>${u.cnpj || '-'}</code></td>`;
        rowHTML += '</tr>';
        tbody.innerHTML += rowHTML;
      });

      modal.classList.remove('hidden');
    }

    async renderMatrizView() {
      const todos = await getCollection('abib_gestao_comensais');
      const unidades = await getUnidades();

      // Sincronizar seletores de mês e ano
      const selectMes = this.container.querySelector('#select-matrix-mes');
      const selectAno = this.container.querySelector('#select-matrix-ano');
      if (selectMes) selectMes.value = String(this.matrixMes);
      if (selectAno) selectAno.value = String(this.matrixAno);

      const daysInMonth = new Date(this.matrixAno, this.matrixMes + 1, 0).getDate();
      const today = new Date();
      const isCurrentMonth = (today.getFullYear() === this.matrixAno && today.getMonth() === this.matrixMes);
      const isPastMonth = (new Date(this.matrixAno, this.matrixMes + 1, 0) < today && !isCurrentMonth);
      const isFutureMonth = (new Date(this.matrixAno, this.matrixMes, 1) > today);

      // Calcular dia limite padrão se não definido
      if (this.matrixDiaLimite === null || this.matrixDiaLimite === undefined) {
        if (isCurrentMonth) {
          this.matrixDiaLimite = Math.max(1, today.getDate() - 1);
        } else if (isPastMonth) {
          this.matrixDiaLimite = daysInMonth;
        } else {
          this.matrixDiaLimite = 0;
        }
      }

      let maxExpectedDay = Math.min(this.matrixDiaLimite, daysInMonth);

      // Sincronizar seletor de dia limite
      const selectDiaLimite = this.container.querySelector('#select-matrix-dia-limite');
      if (selectDiaLimite) {
        let optionsHtml = '';
        for (let d = 1; d <= daysInMonth; d++) {
          const dStr = String(d).padStart(2, '0');
          const isFull = (d === daysInMonth);
          optionsHtml += `<option value="${d}" ${d === maxExpectedDay ? 'selected' : ''}>Dia ${dStr}${isFull ? ' (Mês Todo)' : ''}</option>`;
        }
        selectDiaLimite.innerHTML = optionsHtml;
      }

      // Atualizar botões de atalho ativos
      const shortcutButtons = this.container.querySelectorAll('.matrix-cutoff-shortcuts .btn-shortcut');
      shortcutButtons.forEach(btn => {
        const type = btn.dataset.cutoff;
        let isBtnActive = false;
        if (type === 'today' && isCurrentMonth && maxExpectedDay === today.getDate()) isBtnActive = true;
        else if (type === 'yesterday' && isCurrentMonth && maxExpectedDay === Math.max(1, today.getDate() - 1)) isBtnActive = true;
        else if (type === 'full-month' && maxExpectedDay === daysInMonth) isBtnActive = true;
        else if (type === 'last-week' && isCurrentMonth) {
          const dow = today.getDay();
          const diffToSaturday = (dow === 6) ? 7 : (dow + 1);
          const satDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToSaturday);
          let targetSat = satDate.getDate();
          if (satDate.getMonth() !== this.matrixMes || satDate.getFullYear() !== this.matrixAno) {
            targetSat = 1;
          }
          if (maxExpectedDay === targetSat) isBtnActive = true;
        }
        if (isBtnActive) btn.classList.add('active');
        else btn.classList.remove('active');
      });

      // Mapa de registros por unidadeId + '_' + dataISO
      const recordMap = new Map();
      todos.forEach(r => {
        if (r.unidadeId && r.data) {
          recordMap.set(`${r.unidadeId}_${r.data}`, r);
        }
      });

      // Ordenar unidades por Grupo e Loja
      const sortedUnits = [...unidades].sort((a, b) => {
        if ((a.grupo || '') !== (b.grupo || '')) {
          return (a.grupo || '').localeCompare(b.grupo || '');
        }
        return (a.loja || '').localeCompare(b.loja || '');
      });

      let totalEsperadoGeral = 0;
      let totalPreenchidoGeral = 0;
      let totalLojas100 = 0;
      let totalLojasPendentes = 0;
      let totalRefeicoesMes = 0;

      const unitStats = sortedUnits.map(u => {
        let preenchidos = 0;
        let somaRefeicoes = 0;
        const diasStatus = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const dayStr = String(day).padStart(2, '0');
          const mesStr = String(this.matrixMes + 1).padStart(2, '0');
          const dateISO = `${this.matrixAno}-${mesStr}-${dayStr}`;
          const dateObj = new Date(this.matrixAno, this.matrixMes, day);
          const dayOfWeek = dateObj.getDay(); // 0 Dom, 6 Sab
          const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

          const isPastOrToday = (maxExpectedDay > 0 && day <= maxExpectedDay);
          const isFuture = (day > maxExpectedDay);

          const reg = recordMap.get(`${u.id}_${dateISO}`);
          let hasData = false;
          let totalComensais = 0;

          if (reg) {
            if (reg.publicos && typeof reg.publicos === 'object') {
              const vals = Object.values(reg.publicos);
              const nums = vals.map(v => parseInt(v, 10)).filter(n => !isNaN(n));
              if (nums.length > 0) {
                totalComensais = nums.reduce((acc, curr) => acc + curr, 0);
              }
            }
            if (totalComensais === 0 && typeof reg.totalComensais === 'number') {
              totalComensais = reg.totalComensais;
            }
            hasData = (totalComensais > 0);
          }

          if (hasData) {
            somaRefeicoes += totalComensais;
          }

          if (isPastOrToday) {
            if (hasData) {
              preenchidos++;
            }
          }

          diasStatus.push({
            day,
            dateISO,
            dayOfWeek,
            isWeekend,
            isFuture,
            isPastOrToday,
            hasData,
            totalComensais,
            reg
          });
        }

        totalRefeicoesMes += somaRefeicoes;
        const diasEsperados = maxExpectedDay;
        const taxa = diasEsperados > 0 ? Math.round((preenchidos / diasEsperados) * 100) : 100;
        const temPendencia = diasEsperados > 0 && preenchidos < diasEsperados;
        const pendenciasCount = diasEsperados > 0 ? (diasEsperados - preenchidos) : 0;

        totalEsperadoGeral += diasEsperados;
        totalPreenchidoGeral += preenchidos;

        if (!temPendencia && diasEsperados > 0) {
          totalLojas100++;
        } else if (temPendencia) {
          totalLojasPendentes++;
        }

        return {
          unit: u,
          diasStatus,
          preenchidos,
          diasEsperados,
          taxa,
          temPendencia,
          pendenciasCount,
          somaRefeicoes
        };
      });

      // Atualizar KPIs
      const taxaGeral = totalEsperadoGeral > 0 ? Math.round((totalPreenchidoGeral / totalEsperadoGeral) * 100) : 100;
      const kpiTaxa = this.container.querySelector('#matrix-kpi-taxa');
      const kpiTaxaSub = this.container.querySelector('#matrix-kpi-taxa-sub');
      const kpiLojas100 = this.container.querySelector('#matrix-kpi-lojas-completas');
      const kpiLojasPendentes = this.container.querySelector('#matrix-kpi-lojas-pendentes');
      const kpiTotalRef = this.container.querySelector('#matrix-kpi-total-refeicoes');
      const countPend = this.container.querySelector('#matrix-count-pendentes');
      const countComp = this.container.querySelector('#matrix-count-completas');

      if (kpiTaxa) kpiTaxa.textContent = `${taxaGeral}%`;
      if (kpiTaxaSub) kpiTaxaSub.textContent = `${totalPreenchidoGeral} de ${totalEsperadoGeral} envios esperados (até dia ${String(maxExpectedDay).padStart(2, '0')})`;
      if (kpiLojas100) kpiLojas100.textContent = `${totalLojas100} / ${sortedUnits.length}`;
      if (kpiLojasPendentes) kpiLojasPendentes.textContent = `${totalLojasPendentes}`;
      if (kpiTotalRef) kpiTotalRef.textContent = totalRefeicoesMes.toLocaleString('pt-BR');
      if (countPend) countPend.textContent = `${totalLojasPendentes}`;
      if (countComp) countComp.textContent = `${totalLojas100}`;

      // Filtrar unidades para exibição
      let displayUnits = unitStats;
      if (this.matrixFilter === 'pendentes') {
        displayUnits = unitStats.filter(s => s.temPendencia);
      } else if (this.matrixFilter === 'completas') {
        displayUnits = unitStats.filter(s => !s.temPendencia);
      }

      // Construir Tabela Heatmap
      const wrapper = this.container.querySelector('#matrix-table-wrapper');
      if (!wrapper) return;

      if (displayUnits.length === 0) {
        wrapper.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--text-muted);">
            Nenhuma unidade encontrada para o filtro selecionado.
          </div>
        `;
        return;
      }

      const weekLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const weekNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      let headerDaysHtml = '';
      let headerWeekdaysHtml = '';

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(this.matrixAno, this.matrixMes, day);
        const dow = dateObj.getDay();
        const isWeekend = (dow === 0 || dow === 6);
        const isToday = isCurrentMonth && (day === today.getDate());
        const isCutoff = (day === maxExpectedDay && maxExpectedDay < daysInMonth);

        const weekendClass = isWeekend ? 'cell-weekend-header' : '';
        const cutoffClass = isCutoff ? 'matrix-cutoff-col' : '';
        const todayStyle = isToday ? 'border-bottom: 2px solid var(--primary); font-weight: 800; color: var(--primary);' : '';

        headerDaysHtml += `<th class="${weekendClass} ${cutoffClass}" style="${todayStyle}" data-col-day="${day}">${String(day).padStart(2, '0')}</th>`;
        headerWeekdaysHtml += `<th class="${weekendClass} ${cutoffClass}" style="font-size: 0.65rem; color: #475569; padding: 2px 0;" data-col-day="${day}">${weekLetters[dow]}</th>`;
      }

      let rowsHtml = '';
      displayUnits.forEach(item => {
        const u = item.unit;
        const nomeAbrev = formatLojaDisplayName(u.loja);

        let badgeTaxa = '';
        if (item.diasEsperados === 0) {
          badgeTaxa = `<span class="badge" style="background: #f1f5f9; color: #64748b; font-size: 0.65rem;">-</span>`;
        } else if (item.taxa === 100) {
          badgeTaxa = `<span class="badge badge-success" style="font-size: 0.65rem; padding: 2px 4px;">100%</span>`;
        } else {
          badgeTaxa = `<span class="badge" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; font-size: 0.65rem; padding: 2px 4px;">${item.taxa}%</span>`;
        }

        let cellsHtml = '';
        item.diasStatus.forEach(d => {
          let cellClass = '';
          let cellContent = '';
          const isCutoff = (d.day === maxExpectedDay && maxExpectedDay < daysInMonth);
          const cutoffClass = isCutoff ? 'matrix-cutoff-col' : '';

          if (d.isFuture) {
            if (d.hasData) {
              cellClass = 'cell-future cell-future-with-data';
              cellContent = d.totalComensais > 999 ? '999+' : String(d.totalComensais);
            } else {
              cellClass = 'cell-future';
              cellContent = '-';
            }
          } else if (d.hasData) {
            cellClass = 'cell-filled';
            cellContent = d.totalComensais > 999 ? '999+' : String(d.totalComensais);
          } else {
            cellClass = 'cell-missing';
            cellContent = '-';
          }

          cellsHtml += `<td class="matrix-cell ${cellClass} ${cutoffClass}" data-col-day="${d.day}" data-unit-id="${u.id}" data-date-iso="${d.dateISO}">${cellContent}</td>`;
        });

        rowsHtml += `
          <tr>
            <td class="col-loja" title="${u.loja}">
              <strong>${nomeAbrev}</strong>
            </td>
            <td class="col-status">
              ${badgeTaxa}
            </td>
            ${cellsHtml}
            <td class="col-total">
              ${item.somaRefeicoes.toLocaleString('pt-BR')}
            </td>
          </tr>
        `;
      });

      wrapper.innerHTML = `
        <table class="matrix-table">
          <thead>
            <tr>
              <th rowspan="2" class="col-loja" style="vertical-align: middle;">Loja / Unidade</th>
              <th rowspan="2" class="col-status" style="vertical-align: middle;">Envios</th>
              ${headerDaysHtml}
              <th rowspan="2" class="col-total" style="vertical-align: middle;">Total</th>
            </tr>
            <tr>
              ${headerWeekdaysHtml}
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;

      // Mapeamento e Eventos de Crosshair (Coluna Ativa) e Tooltip Flutuante
      const publicos = await getPublicos();
      const tooltip = this.container.querySelector('#matrix-floating-tooltip');
      const table = wrapper.querySelector('.matrix-table');

      const diaDetalhesMap = new Map();
      displayUnits.forEach(item => {
        item.diasStatus.forEach(d => {
          if (d.hasData && d.reg) {
            diaDetalhesMap.set(`${item.unit.id}_${d.dateISO}`, {
              loja: item.unit.loja,
              dataDisplay: `${String(d.day).padStart(2, '0')}/${String(this.matrixMes + 1).padStart(2, '0')}/${this.matrixAno}`,
              diaSemana: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][d.dayOfWeek],
              total: d.totalComensais,
              publicos: d.reg.publicos || {},
              observacao: d.reg.observacao || ''
            });
          }
        });
      });

      let currentColDay = null;

      table.addEventListener('mouseover', (e) => {
        const target = e.target.closest('[data-col-day]');
        if (target) {
          const colDay = target.dataset.colDay;
          if (colDay !== currentColDay) {
            if (currentColDay) {
              table.querySelectorAll(`[data-col-day="${currentColDay}"]`).forEach(el => el.classList.remove('matrix-col-hover'));
            }
            currentColDay = colDay;
            table.querySelectorAll(`[data-col-day="${colDay}"]`).forEach(el => el.classList.add('matrix-col-hover'));
          }
        } else {
          if (currentColDay) {
            table.querySelectorAll(`[data-col-day="${currentColDay}"]`).forEach(el => el.classList.remove('matrix-col-hover'));
            currentColDay = null;
          }
        }

        const cell = e.target.closest('.matrix-cell');
        if (cell && tooltip) {
          const unitId = cell.dataset.unitId;
          const dateIso = cell.dataset.dateIso;
          const info = diaDetalhesMap.get(`${unitId}_${dateIso}`);

          if (info) {
            let pubItemsHtml = '';
            publicos.forEach(p => {
              const val = info.publicos[p.id];
              if (val !== undefined && val !== null && val !== '' && Number(val) > 0) {
                pubItemsHtml += `
                  <div class="matrix-tt-pub-item">
                    <span>${p.nome}:</span>
                    <strong>${val}</strong>
                  </div>
                `;
              }
            });

            if (!pubItemsHtml) {
              pubItemsHtml = `<div style="color: var(--text-muted); font-size: 0.72rem;">Sem divisão por público</div>`;
            }

            tooltip.innerHTML = `
              <div class="matrix-tt-header">
                <div class="matrix-tt-title">${info.loja}</div>
                <div class="matrix-tt-date">${info.dataDisplay} • ${info.diaSemana}${info.diaSemana !== 'Domingo' && info.diaSemana !== 'Sábado' ? '-feira' : ''}</div>
              </div>
              <div class="matrix-tt-total">
                <span>Total de Refeições:</span>
                <strong>${info.total}</strong>
              </div>
              <div class="matrix-tt-publicos-list">
                ${pubItemsHtml}
              </div>
              ${info.observacao ? `
                <div class="matrix-tt-obs">
                  <strong>Obs:</strong> ${info.observacao}
                </div>
              ` : ''}
            `;

            tooltip.classList.remove('hidden');
          } else {
            tooltip.classList.add('hidden');
          }
        } else if (tooltip) {
          tooltip.classList.add('hidden');
        }
      });

      table.addEventListener('mousemove', (e) => {
        if (tooltip && !tooltip.classList.contains('hidden')) {
          let x = e.clientX + 14;
          let y = e.clientY + 14;
          if (x + 340 > window.innerWidth) x = e.clientX - 335;
          if (y + 240 > window.innerHeight) y = e.clientY - 210;
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
        }
      });

      table.addEventListener('mouseout', (e) => {
        const fromEl = e.target.closest('[data-col-day]');
        const toEl = e.relatedTarget ? e.relatedTarget.closest('[data-col-day]') : null;

        if (!toEl && currentColDay) {
          table.querySelectorAll(`[data-col-day="${currentColDay}"]`).forEach(el => el.classList.remove('matrix-col-hover'));
          currentColDay = null;
        }

        const cell = e.target.closest('.matrix-cell');
        if (cell && tooltip) {
          tooltip.classList.add('hidden');
        }
      });

      table.addEventListener('mouseleave', () => {
        if (currentColDay) {
          table.querySelectorAll(`[data-col-day="${currentColDay}"]`).forEach(el => el.classList.remove('matrix-col-hover'));
          currentColDay = null;
        }
        if (tooltip) {
          tooltip.classList.add('hidden');
        }
      });
    }
  }

  // --- 10. ADMIN PANEL ---
  class AdminPanel {
    constructor(appController) {
      this.appController = appController;
      this.isAuthenticated = false;
    }

    render(container) {
      this.container = container;
      if (!this.isAuthenticated) this.renderPasswordModal();
      else this.renderPanelContent();
    }

    renderPasswordModal() {
      this.container.innerHTML = `
        <div class="admin-auth-overlay">
          <div class="admin-auth-card">
            <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 4px;">Painel Administrativo</h2>
            <p class="subtitle" style="margin-bottom: 16px;">Digite a Senha Máster para autenticar</p>
            <form id="form-admin-auth">
              <div style="margin-bottom: 16px;">
                <input type="password" id="input-admin-password" class="input-field" placeholder="Digite a senha..." autofocus required>
              </div>
              <button type="submit" class="btn btn-primary btn-block">Acessar Painel</button>
            </form>
            <div style="margin-top: 12px; text-align: center;">
              <button id="btn-cancel-admin" class="btn btn-secondary btn-sm" style="border: none;">Cancelar e Voltar</button>
            </div>
          </div>
        </div>
      `;

      const form = this.container.querySelector('#form-admin-auth');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = this.container.querySelector('#input-admin-password').value;
        const config = await getConfig();
        const masterPass = config.adminPassword || 'Gestao@5170';

        if (pass === masterPass) {
          this.isAuthenticated = true;
          this.renderPanelContent();
        } else {
          showToast("Senha incorreta.", "error");
        }
      });

      this.container.querySelector('#btn-cancel-admin').addEventListener('click', () => {
        window.location.hash = '';
        window.app.switchView('dashboard');
      });
    }

    async renderPanelContent() {
      this.container.innerHTML = `
        <div class="admin-layout">
          <div class="admin-sidebar">
            <div class="admin-logo"><h3>Administração</h3></div>
            <nav class="admin-nav">
              <button class="nav-tab active" data-tab="links-whatsapp">Links do WhatsApp</button>
              <button class="nav-tab" data-tab="unidades">Empresas e Unidades (${(await getUnidades()).length})</button>
              <button class="nav-tab" data-tab="publicos">Categorias de Públicos</button>
              <button class="nav-tab" data-tab="perfis">Perfis e Permissões</button>
              <button class="nav-tab" data-tab="firebase">Configuração Firebase</button>
              <button class="nav-tab" data-tab="backup">Backup e Importação</button>
            </nav>
            <div class="admin-sidebar-footer" style="margin-top: 24px;">
              <button id="btn-sair-admin" class="btn btn-secondary btn-block">Sair do Admin</button>
            </div>
          </div>
          <div class="admin-content-area" id="admin-tab-body"></div>
        </div>
      `;

      this.bindTabEvents();
      await this.loadTabContent('links-whatsapp');
    }

    bindTabEvents() {
      const tabs = this.container.querySelectorAll('.nav-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          await this.loadTabContent(tab.getAttribute('data-tab'));
        });
      });

      this.container.querySelector('#btn-sair-admin').addEventListener('click', () => {
        this.isAuthenticated = false;
        window.location.hash = '';
        window.app.switchView('dashboard');
      });
    }

    async loadTabContent(tabKey) {
      const body = this.container.querySelector('#admin-tab-body');
      if (tabKey === 'links-whatsapp') await this.renderLinksWhatsAppTab(body);
      else if (tabKey === 'unidades') await this.renderUnidadesTab(body);
      else if (tabKey === 'publicos') await this.renderPublicosTab(body);
      else if (tabKey === 'perfis') await this.renderPerfisTab(body);
      else if (tabKey === 'firebase') await this.renderFirebaseTab(body);
      else if (tabKey === 'backup') await this.renderBackupTab(body);
    }

    async renderLinksWhatsAppTab(body) {
      const unidades = await getUnidades();
      const baseUrl = `${window.location.origin}${window.location.pathname}`;

      body.innerHTML = `
        <div class="tab-header">
          <div>
            <h3>Gerador de Links de Acesso Seguro para WhatsApp</h3>
            <p class="subtitle">Envie o link exclusivo de cada unidade diretamente para a RT ou Cozinheira responsável.</p>
          </div>
        </div>

        <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-title); margin-bottom: 6px;">
            Links Diretos Restritos por Módulo (Acesso Exclusivo)
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
            Ao abrir por estes links, o dispositivo solicita a Senha Máster e trava a navegação exclusivamente naquele módulo, impedindo voltar ao painel geral.
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; flex-wrap: wrap;">
              <div>
                <strong style="font-size: 0.9rem; color: var(--text-title);">Módulo Comensais Diários:</strong>
                <code style="font-size: 0.78rem; color: #2563eb; display: block; margin-top: 2px;">${baseUrl}?modulo=comensais</code>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn btn-sm btn-primary btn-copy-module-link" data-link="${baseUrl}?modulo=comensais" data-name="Comensais Diários">
                  Copiar Link Comensais
                </button>
                <a href="${baseUrl}?modulo=comensais" target="_blank" class="btn btn-sm btn-secondary" title="Abrir link em nova aba" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 8px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; flex-wrap: wrap;">
              <div>
                <strong style="font-size: 0.9rem; color: var(--text-title);">Módulo Hortifrúti Semanal:</strong>
                <code style="font-size: 0.78rem; color: #2563eb; display: block; margin-top: 2px;">${baseUrl}?modulo=hortifruti</code>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn btn-sm btn-primary btn-copy-module-link" data-link="${baseUrl}?modulo=hortifruti" data-name="Hortifrúti Semanal">
                  Copiar Link Hortifrúti
                </button>
                <a href="${baseUrl}?modulo=hortifruti" target="_blank" class="btn btn-sm btn-secondary" title="Abrir link em nova aba" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 8px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Cód</th>
                <th>Grupo</th>
                <th>Loja / Unidade</th>
                <th>Token Secreto</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${unidades.map(u => {
                const fullLink = `${baseUrl}?token=${u.tokenAcesso}`;
                const grpClass = u.grupo ? `group-badge-${u.grupo.toLowerCase()}` : '';
                return `
                  <tr>
                    <td>${u.codigo || '-'}</td>
                    <td><span class="group-badge-tag ${grpClass}">${u.grupo || '-'}</span></td>
                    <td><strong>${u.loja}</strong></td>
                    <td><code>${u.tokenAcesso}</code></td>
                    <td>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="btn btn-sm btn-primary btn-copy-whatsapp-link" data-loja="${u.loja}" data-link="${fullLink}">
                          Copiar Link
                        </button>
                        <button class="btn btn-sm btn-secondary btn-regerar-token" data-id="${u.id}" data-loja="${u.loja}">
                          Regerar Token
                        </button>
                        <a href="${fullLink}" target="_blank" class="btn btn-sm btn-secondary" title="Abrir link em nova aba" style="display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 8px;">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      body.querySelectorAll('.btn-copy-module-link').forEach(btn => {
        btn.addEventListener('click', () => {
          const link = btn.getAttribute('data-link');
          const name = btn.getAttribute('data-name');
          const temp = document.createElement('textarea');
          temp.value = link;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
          showToast(`Link direto para ${name} copiado com sucesso!`, "success");
        });
      });

      body.querySelectorAll('.btn-copy-whatsapp-link').forEach(btn => {
        btn.addEventListener('click', () => {
          const loja = btn.getAttribute('data-loja');
          const link = btn.getAttribute('data-link');

          const temp = document.createElement('textarea');
          temp.value = link;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);

          showToast(`Link da unidade ${loja} copiado!`, "success");
        });
      });

      body.querySelectorAll('.btn-regerar-token').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const loja = btn.getAttribute('data-loja');
          if (confirm(`Atenção: Deseja revogar o link antigo e gerar um NOVO token seguro para a unidade ${loja}?`)) {
            await regenerateUnitToken(id);
            showToast(`Novo token gerado para ${loja}!`, "success");
            await this.renderLinksWhatsAppTab(body);
          }
        });
      });
    }

    async renderUnidadesTab(body) {
      const unidades = await getUnidades();
      body.innerHTML = `
        <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>Cadastro das 21 Unidades</h3>
          <button id="btn-nova-unidade" class="btn btn-primary">+ Nova Unidade</button>
        </div>
        <div class="table-responsive-card">
          <table class="data-table">
            <thead>
              <tr><th>Cód</th><th>Grupo</th><th>Loja</th><th>Filial / Unidade</th><th>CNPJ</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              ${unidades.map(u => `
                <tr>
                  <td>${u.codigo || '-'}</td>
                  <td><span class="badge-tag">${u.grupo || '-'}</span></td>
                  <td><strong>${u.loja}</strong></td>
                  <td>${u.unidade || '-'}</td>
                  <td><code>${u.cnpj || '-'}</code></td>
                  <td>${u.ativo !== false ? '<span class="badge badge-success">ATIVO</span>' : '<span class="badge badge-pending">INATIVO</span>'}</td>
                  <td><button class="btn btn-sm btn-secondary btn-edit-unidade" data-id="${u.id}">Editar</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <!-- Modal Editar/Nova Unidade -->
        <div id="modal-unidade" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="title-modal-unidade">Nova Unidade</h3>
              <button class="btn-close-modal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form id="form-unidade-crud">
              <input type="hidden" id="edit-unidade-id">
              <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; gap: 10px;">
                  <div style="flex:1;"><label style="font-size: 0.8rem; font-weight: 600;">Código:</label><input type="text" id="u-codigo" class="input-field" placeholder="ex: 259"></div>
                  <div style="flex:1;"><label style="font-size: 0.8rem; font-weight: 600;">Grupo:</label><input type="text" id="u-grupo" class="input-field" placeholder="ex: MOC, ABIB, AC"></div>
                </div>
                <div><label style="font-size: 0.8rem; font-weight: 600;">Nome da Loja:*</label><input type="text" id="u-loja" class="input-field" required placeholder="ex: MONTES CLAROS II"></div>
                <div><label style="font-size: 0.8rem; font-weight: 600;">Subdivisão / Unidade:</label><input type="text" id="u-unidade" class="input-field" placeholder="ex: FILIAL 1, MATRIZ"></div>
                <div><label style="font-size: 0.8rem; font-weight: 600;">CNPJ Formatado:</label><input type="text" id="u-cnpj" class="input-field" placeholder="ex: 50.940.370/0002-68"></div>
              </div>
              <div class="modal-footer" style="margin-top: 16px;"><button type="submit" class="btn btn-primary btn-block">Salvar Unidade</button></div>
            </form>
          </div>
        </div>
      `;

      const modal = body.querySelector('#modal-unidade');
      const form = body.querySelector('#form-unidade-crud');

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });

      body.querySelector('#btn-nova-unidade').addEventListener('click', () => {
        form.reset();
        body.querySelector('#edit-unidade-id').value = '';
        body.querySelector('#title-modal-unidade').textContent = 'Nova Unidade';
        modal.classList.remove('hidden');
      });

      body.querySelector('.btn-close-modal').addEventListener('click', () => closeModal(modal));

      body.querySelectorAll('.btn-edit-unidade').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = unidades.find(x => x.id === btn.getAttribute('data-id'));
          if (target) {
            body.querySelector('#edit-unidade-id').value = target.id;
            body.querySelector('#u-codigo').value = target.codigo || '';
            body.querySelector('#u-grupo').value = target.grupo || '';
            body.querySelector('#u-loja').value = target.loja || '';
            body.querySelector('#u-unidade').value = target.unidade || '';
            body.querySelector('#u-cnpj').value = target.cnpj || '';
            body.querySelector('#title-modal-unidade').textContent = 'Editar Unidade';
            modal.classList.remove('hidden');
          }
        });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUnidade({
          id: body.querySelector('#edit-unidade-id').value || undefined,
          codigo: body.querySelector('#u-codigo').value,
          grupo: body.querySelector('#u-grupo').value,
          loja: body.querySelector('#u-loja').value,
          unidade: body.querySelector('#u-unidade').value,
          cnpj: body.querySelector('#u-cnpj').value,
          ativo: true
        });
        closeModal(modal);
        showToast("Unidade salva com sucesso!", "success");
        await this.renderUnidadesTab(body);
      });
    }

    async renderPublicosTab(body) {
      const publicos = await getPublicos();
      body.innerHTML = `
        <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>Categorias de Públicos</h3>
          <button id="btn-novo-publico" class="btn btn-primary">+ Novo Público</button>
        </div>
        <div class="table-responsive-card">
          <table class="data-table">
            <thead><tr><th>Ordem</th><th>Nome da Categoria</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              ${publicos.map(p => `
                <tr>
                  <td>${p.ordem || 1}</td>
                  <td><strong>${p.nome}</strong></td>
                  <td>${p.ativo !== false ? '<span class="badge badge-success">ATIVO</span>' : '<span class="badge badge-pending">INATIVO</span>'}</td>
                  <td><button class="btn btn-sm btn-secondary btn-edit-pub" data-id="${p.id}">Editar</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      body.querySelector('#btn-novo-publico').addEventListener('click', async () => {
        const nome = await showPrompt("Digite o nome da nova categoria de público:", "", "Nova Categoria");
        if (nome) {
          await savePublico({ nome });
          showToast("Categoria de público criada!", "success");
          await this.renderPublicosTab(body);
        }
      });

      body.querySelectorAll('.btn-edit-pub').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pub = publicos.find(x => x.id === btn.getAttribute('data-id'));
          if (pub) {
            const novoNome = await showPrompt("Digite o novo nome para esta categoria:", pub.nome, "Editar Categoria");
            if (novoNome) {
              await savePublico({ ...pub, nome: novoNome });
              showToast("Categoria de público atualizada!", "success");
              await this.renderPublicosTab(body);
            }
          }
        });
      });
    }

    async renderPerfisTab(body) {
      const perfis = await getPerfis();
      const config = await getConfig();

      body.innerHTML = `
        <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>Perfis de Acesso e Módulos</h3>
          <button id="btn-novo-perfil" class="btn btn-primary">+ Novo Perfil</button>
        </div>

        <div style="background: var(--bg-surface); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 20px; box-shadow: var(--shadow-card);">
          <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-title); margin-bottom: 4px;">Configuração Global de Perfis</h4>
          <p class="subtitle" style="margin-bottom: 12px;">Defina se os usuários podem visualizar e alternar de perfil na tela inicial:</p>
          <label style="display: flex; align-items: center; gap: 10px; font-weight: 700; cursor: pointer; color: var(--text-title);">
            <input type="checkbox" id="chk-permitir-troca-perfil" ${config.permitirTrocaPerfil ? 'checked' : ''}>
            Liberar seletor de perfis no cabeçalho da aplicação
          </label>
        </div>

        <p class="subtitle" style="margin-bottom: 16px;">Gerencie as permissões e módulos visíveis para cada perfil:</p>
        <div class="perfis-cards-grid">
          ${perfis.map(p => {
            const campos = p.permissoesCamposUnidade || ["loja"];
            const modulosList = p.modulos || ["comensais"];
            const isDefault = p.id === 'p_padrao';
            return `
              <div class="card-perfil-admin">
                <div class="card-perfil-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-title);">${p.nome}</h4>
                      ${isDefault ? '<span class="badge badge-success" style="font-size: 0.65rem;">PADRÃO</span>' : ''}
                    </div>
                    <p class="subtitle" style="margin-top: 3px; font-size: 0.8rem; line-height: 1.35;">${p.descricao || 'Sem descrição definida.'}</p>
                  </div>
                  <button class="btn btn-sm btn-secondary btn-edit-perfil-info" data-id="${p.id}" title="Editar nome e descrição do perfil" style="padding: 4px 8px; flex-shrink: 0;">Editar</button>
                </div>
                <div class="field-permissions-box">
                  <h5 style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; font-weight: 800; letter-spacing: 0.4px;">MÓDULOS PERMITIDOS:</h5>
                  <div class="checkbox-grid-modulos" data-perfil-id="${p.id}" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; font-size: 0.82rem;">
                    <label><input type="checkbox" value="comensais" ${modulosList.includes('comensais') ? 'checked' : ''}> Comensais Diários</label>
                    <label><input type="checkbox" value="pratos" ${modulosList.includes('pratos') ? 'checked' : ''}> Inventário de Pratos & Louças</label>
                    <label><input type="checkbox" value="precos" ${modulosList.includes('precos') ? 'checked' : ''}> Preços & Custos por Unidade</label>
                  </div>

                  <h5 style="font-size: 0.74rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; font-weight: 800; letter-spacing: 0.4px;">CAMPOS DAS UNIDADES:</h5>
                  <div class="checkbox-grid" data-perfil-id="${p.id}">
                    <label><input type="checkbox" value="codigo" ${campos.includes('codigo') ? 'checked' : ''}> Código</label>
                    <label><input type="checkbox" value="grupo" ${campos.includes('grupo') ? 'checked' : ''}> Grupo (AC/ABIB/MOC)</label>
                    <label><input type="checkbox" value="loja" ${campos.includes('loja') ? 'checked' : ''}> Nome da Loja</label>
                    <label><input type="checkbox" value="unidade" ${campos.includes('unidade') ? 'checked' : ''}> Filial / Matriz</label>
                    <label><input type="checkbox" value="cnpj" ${campos.includes('cnpj') ? 'checked' : ''}> CNPJ (Completo)</label>
                  </div>
                </div>
                <div class="card-perfil-actions">
                  <button class="btn btn-sm btn-primary btn-save-perfil-perm" data-id="${p.id}">Salvar Permissões</button>
                  ${!isDefault ? `<button class="btn btn-sm btn-danger btn-del-perfil" data-id="${p.id}">Excluir</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Modal Editar / Novo Perfil -->
        <div id="modal-perfil-crud" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="title-modal-perfil">Editar Perfil</h3>
              <button class="btn-close-modal-perfil"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <form id="form-perfil-crud">
              <input type="hidden" id="edit-perfil-id">
              <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px;">
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-title); text-transform: uppercase;">Nome do Perfil:*</label>
                  <input type="text" id="perfil-nome-input" class="input-field" required placeholder="ex: Nutricionista Geral" style="margin-top: 4px;">
                </div>
                <div>
                  <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-title); text-transform: uppercase;">Descrição do Perfil:*</label>
                  <textarea id="perfil-desc-input" class="input-field" style="height: 80px; resize: vertical; margin-top: 4px;" required placeholder="Descreva as funções e nível de acesso deste perfil..."></textarea>
                </div>
              </div>
              <div class="modal-footer" style="margin-top: 18px;">
                <button type="submit" class="btn btn-primary btn-block">Salvar Perfil</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const chkTroca = body.querySelector('#chk-permitir-troca-perfil');
      chkTroca.addEventListener('change', async (e) => {
        const val = e.target.checked;
        await saveConfig({ permitirTrocaPerfil: val });
        showToast(val ? "Seletor de perfil ativado no cabeçalho!" : "Seletor de perfil ocultado.", "info");
        window.app.renderHeader();
      });

      const modal = body.querySelector('#modal-perfil-crud');
      const form = body.querySelector('#form-perfil-crud');
      const btnClose = body.querySelector('.btn-close-modal-perfil');

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });

      btnClose.addEventListener('click', () => closeModal(modal));

      body.querySelector('#btn-novo-perfil').addEventListener('click', () => {
        form.reset();
        body.querySelector('#edit-perfil-id').value = '';
        body.querySelector('#title-modal-perfil').textContent = 'Novo Perfil de Acesso';
        modal.classList.remove('hidden');
      });

      body.querySelectorAll('.btn-edit-perfil-info').forEach(btn => {
        btn.addEventListener('click', () => {
          const p = perfis.find(x => x.id === btn.getAttribute('data-id'));
          if (p) {
            body.querySelector('#edit-perfil-id').value = p.id;
            body.querySelector('#perfil-nome-input').value = p.nome || '';
            body.querySelector('#perfil-desc-input').value = p.descricao || '';
            body.querySelector('#title-modal-perfil').textContent = 'Editar Perfil de Acesso';
            modal.classList.remove('hidden');
          }
        });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = body.querySelector('#edit-perfil-id').value;
        const nome = body.querySelector('#perfil-nome-input').value.trim();
        const descricao = body.querySelector('#perfil-desc-input').value.trim();

        if (id) {
          const perfil = perfis.find(x => x.id === id);
          await savePerfil({ ...perfil, nome, descricao });
          showToast(`Perfil "${nome}" atualizado!`, "success");
        } else {
          await savePerfil({
            nome,
            descricao,
            modulos: ['comensais'],
            permissoesCamposUnidade: ['loja', 'grupo', 'codigo', 'unidade', 'cnpj']
          });
          showToast(`Novo perfil "${nome}" criado!`, "success");
        }

        closeModal(modal);
        await this.renderPerfisTab(body);
      });

      body.querySelectorAll('.btn-save-perfil-perm').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const perfil = perfis.find(x => x.id === id);
          const boxCampos = body.querySelector(`.checkbox-grid[data-perfil-id="${id}"]`);
          const checkedCampos = Array.from(boxCampos.querySelectorAll('input:checked')).map(cb => cb.value);

          const boxModulos = body.querySelector(`.checkbox-grid-modulos[data-perfil-id="${id}"]`);
          const checkedModulos = Array.from(boxModulos.querySelectorAll('input:checked')).map(cb => cb.value);

          await savePerfil({ ...perfil, permissoesCamposUnidade: checkedCampos, modulos: checkedModulos });
          showToast(`Permissões salvas para "${perfil.nome}".`, "success");
        });
      });

      body.querySelectorAll('.btn-del-perfil').forEach(btn => {
        btn.addEventListener('click', async () => {
          const perfil = perfis.find(x => x.id === btn.getAttribute('data-id'));
          const confirmou = await showConfirm(`Tem certeza que deseja excluir o perfil <strong>"${perfil.nome}"</strong>?`, "Excluir Perfil");
          if (confirmou) {
            await deletePerfil(perfil.id);
            showToast(`Perfil "${perfil.nome}" excluído com sucesso.`, "success");
            await this.renderPerfisTab(body);
          }
        });
      });
    }

    async renderFirebaseTab(body) {
      const config = await getConfig();
      const fb = config.firebaseConfig || DEFAULT_FIREBASE_CONFIG;
      body.innerHTML = `
        <div class="tab-header" style="margin-bottom: 16px;"><h3>Configuração de Senhas & Banco Cloud (Firebase)</h3></div>
        
        <div class="card" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px; max-width: 500px; box-shadow: var(--shadow-sm);">
          <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-title); margin-bottom: 6px;">
            Senhas de Acesso aos Módulos & Gerência
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
            Defina a Senha Máster Geral e as senhas exclusivas de cada módulo. A Senha Máster de Gerente libera acesso total.
          </p>

          <form id="form-passwords-config" style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Senha Máster Geral (Gerência / Diretoria):</label>
              <input type="text" id="cfg-adminPassword" class="input-field" value="${config.adminPassword || 'Gestao@5170'}">
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Senha Exclusiva: Módulo Comensais Diários:</label>
              <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                <input type="text" id="cfg-passwordComensais" class="input-field" style="flex: 1;" value="${config.passwordComensais || 'Comensais@3928'}">
                <button type="button" id="btn-gen-pass-comensais" class="btn btn-sm btn-secondary" style="white-space: nowrap;">
                  Gerar Nova Sequência
                </button>
              </div>
            </div>
            <div>
              <label style="font-size: 0.8rem; font-weight: 600;">Senha Exclusiva: Módulo Hortifrúti Semanal:</label>
              <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                <input type="text" id="cfg-passwordHortifruti" class="input-field" style="flex: 1;" value="${config.passwordHortifruti || 'Hortifruti@6481'}">
                <button type="button" id="btn-gen-pass-hortifruti" class="btn btn-sm btn-secondary" style="white-space: nowrap;">
                  Gerar Nova Sequência
                </button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 4px;">Salvar Senhas</button>
          </form>
        </div>

        <form id="form-firebase-config" class="form-card" style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
          <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-title); margin-bottom: 4px;">
            Conexão Google Firebase (Cloud Sync)
          </h4>
          <div><label style="font-size: 0.8rem; font-weight: 600;">API Key (apiKey):*</label><input type="text" id="fb-apikey" class="input-field" value="${fb.apiKey || ''}"></div>
          <div><label style="font-size: 0.8rem; font-weight: 600;">Database URL (databaseURL):*</label><input type="text" id="fb-databaseurl" class="input-field" value="${fb.databaseURL || ''}"></div>
          <div><label style="font-size: 0.8rem; font-weight: 600;">Project ID (projectId):</label><input type="text" id="fb-projectid" class="input-field" value="${fb.projectId || ''}"></div>
          <button type="submit" class="btn btn-secondary btn-block" style="margin-top: 10px;">Salvar Credenciais Firebase</button>
        </form>
      `;

      body.querySelector('#btn-gen-pass-comensais')?.addEventListener('click', () => {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        body.querySelector('#cfg-passwordComensais').value = `Comensais@${randNum}`;
      });

      body.querySelector('#btn-gen-pass-hortifruti')?.addEventListener('click', () => {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        body.querySelector('#cfg-passwordHortifruti').value = `Hortifruti@${randNum}`;
      });

      body.querySelector('#form-passwords-config').addEventListener('submit', async (e) => {
        e.preventDefault();
        const adminPassword = body.querySelector('#cfg-adminPassword').value.trim();
        const passwordComensais = body.querySelector('#cfg-passwordComensais').value.trim();
        const passwordHortifruti = body.querySelector('#cfg-passwordHortifruti').value.trim();
        
        await saveConfig({ adminPassword, passwordComensais, passwordHortifruti });
        showToast("Senhas salvas com sucesso!", "success");
      });

      body.querySelector('#form-firebase-config').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fbConfig = {
          apiKey: body.querySelector('#fb-apikey').value.trim(),
          databaseURL: body.querySelector('#fb-databaseurl').value.trim(),
          projectId: body.querySelector('#fb-projectid').value.trim()
        };
        await saveConfig({ firebaseConfig: fbConfig });
        initFirebase(fbConfig);
        showToast("Configurações do Firebase salvas!", "success");
      });
    }

    async renderBackupTab(body) {
      body.innerHTML = `
        <div class="tab-header" style="margin-bottom: 16px;"><h3>Backup e Importação de Dados</h3></div>
        <div class="backup-grid" style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div class="backup-card" style="background: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; flex: 1; min-width: 240px;">
            <h4>Exportar Backup Completo</h4>
            <p class="subtitle" style="margin-bottom: 12px;">Download em formato JSON contendo todas as unidades e histórico.</p>
            <button id="btn-export-json" class="btn btn-primary">Download Backup JSON</button>
          </div>
          <div class="backup-card" style="background: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; flex: 1; min-width: 240px;">
            <h4>Restaurar Backup</h4>
            <p class="subtitle" style="margin-bottom: 12px;">Selecione um arquivo de backup (.json) salvo anteriormente.</p>
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
              <label for="input-import-json" class="btn btn-secondary" style="cursor: pointer;">
                Selecionar Arquivo JSON
              </label>
              <span id="file-name-display" style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Nenhum arquivo selecionado</span>
              <input type="file" id="input-import-json" accept=".json" style="display: none;">
            </div>
          </div>
        </div>
      `;

      const fileInput = body.querySelector('#input-import-json');
      const fileNameDisplay = body.querySelector('#file-name-display');

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          fileNameDisplay.textContent = file.name;
          fileNameDisplay.style.color = 'var(--text-title)';
          
          const reader = new FileReader();
          reader.onload = async (evt) => {
            try {
              await importFullBackup(JSON.parse(evt.target.result));
              showToast("Backup restaurado com sucesso!", "success");
              setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
              showToast("Erro ao importar backup: " + err.message, "error");
            }
          };
          reader.readAsText(file);
        } else {
          fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
          fileNameDisplay.style.color = 'var(--text-muted)';
        }
      });

      body.querySelector('#btn-export-json').addEventListener('click', async () => {
        const data = await exportFullBackup();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        link.setAttribute('download', `backup_gestao_abib_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showToast("Download do backup iniciado!", "success");
      });
    }
  }

  // --- 10. HORTIFRÚTI SERVICE & VIEW ---
  async function getProdutosHortifruti() {
    const produtos = await getCollection(STORAGE_KEYS.HORTIFRUTI_PRODUTOS);
    return (produtos || [])
      .filter(p => p.ativo !== false)
      .sort((a, b) => (a.ordem || 99) - (b.ordem || 99));
  }

  function generatePedidoId(unidadeId, mesAno, semana) {
    const cleanUid = String(unidadeId).toLowerCase().startsWith('u') ? unidadeId : `u${unidadeId}`;
    return `horti_${cleanUid}_${mesAno}_w${semana}`;
  }

  async function getPedidoSemanal(unidadeId, mesAno, semana) {
    const pedidos = await getCollection(STORAGE_KEYS.HORTIFRUTI_PEDIDOS);
    if (!pedidos || !pedidos.length) return null;

    const targetUid = String(unidadeId).toLowerCase();
    const targetClean = targetUid.replace(/^u/, '');

    const pedido = (pedidos || []).find(p => {
      if (!p) return false;
      const matchSemana = parseInt(p.semana) === parseInt(semana);
      const matchMes = p.mesAno === mesAno;
      if (!matchMes || !matchSemana) return false;

      const pUid = String(p.unidadeId || '').toLowerCase();
      const pClean = pUid.replace(/^u/, '');

      return pUid === targetUid || pClean === targetClean;
    });

    return pedido || null;
  }

  async function copiarPrecosSemanaAnterior(unidadeId, mesAnoAtual, semanaAtual) {
    const sAtual = parseInt(semanaAtual);
    let mesAnoBusca = mesAnoAtual;
    let semanaBusca = sAtual - 1;

    if (sAtual === 1) {
      const [ano, mes] = mesAnoAtual.split('-').map(Number);
      let anoAnt = ano;
      let mesAnt = mes - 1;
      if (mesAnt < 1) {
        mesAnt = 12;
        anoAnt = ano - 1;
      }
      mesAnoBusca = `${anoAnt}-${String(mesAnt).padStart(2, '0')}`;
      semanaBusca = 4;
    }

    const pedidoAnterior = await getPedidoSemanal(unidadeId, mesAnoBusca, semanaBusca);
    if (!pedidoAnterior || !pedidoAnterior.itens || !pedidoAnterior.itens.length) {
      return { sucesso: false, mensagem: `Nenhum pedido encontrado na Semana ${semanaBusca} (${mesAnoBusca}) para copiar.` };
    }

    const mapaPrecos = {};
    pedidoAnterior.itens.forEach(item => {
      mapaPrecos[item.produtoId] = {
        precoSacolao: item.precoSacolao || 0,
        precoMartMinas: item.precoMartMinas || 0
      };
    });

    return {
      sucesso: true,
      mesAnoOrigem: mesAnoBusca,
      semanaOrigem: semanaBusca,
      mapaPrecos
    };
  }

  function calcularTotaisPedido(itens, produtosCadastrados = []) {
    let totalSacolao = 0;
    let totalMartMinas = 0;
    let economiaEstimada = 0;

    const itensCalculados = itens.map(item => {
      const produtoInfo = produtosCadastrados.find(p => p.id === item.produtoId) || {};
      const pSacolao = parseFloat(item.precoSacolao) || 0;
      const pMartMinas = parseFloat(item.precoMartMinas) || 0;
      const qtd = parseFloat(item.quantidade) || 0;

      let fornecedorVencedorAuto = '';
      if (pSacolao > 0 && pMartMinas > 0) {
        fornecedorVencedorAuto = pSacolao <= pMartMinas ? 'Sacolão' : 'Mart Minas';
      } else if (pMartMinas > 0) {
        fornecedorVencedorAuto = 'Mart Minas';
      } else if (pSacolao > 0) {
        fornecedorVencedorAuto = 'Sacolão';
      }

      const fornecedorEscolhido = item.fornecedorEscolhido || fornecedorVencedorAuto;
      const precoEscolhido = fornecedorEscolhido === 'Mart Minas' ? pMartMinas : (fornecedorEscolhido === 'Sacolão' ? pSacolao : 0);
      const subtotal = Math.round((qtd * precoEscolhido) * 100) / 100;

      if (qtd > 0 && precoEscolhido > 0) {
        if (fornecedorEscolhido === 'Sacolão') {
          totalSacolao += subtotal;
        } else {
          totalMartMinas += subtotal;
        }
      }

      if (pSacolao > 0 && pMartMinas > 0 && qtd > 0) {
        const precoMaior = Math.max(pSacolao, pMartMinas);
        const economiaItem = (precoMaior - precoEscolhido) * qtd;
        economiaEstimada += economiaItem;
      }

      return {
        ...item,
        nomeProduto: item.nomeProduto || produtoInfo.nome || 'Produto',
        unidadeMedida: item.unidadeMedida || produtoInfo.unidadeMedida || 'kg',
        categoria: item.categoria || produtoInfo.categoria || 'Hortifrúti',
        precoSacolao: pSacolao > 0 ? pSacolao : '',
        precoMartMinas: pMartMinas > 0 ? pMartMinas : '',
        quantidade: qtd > 0 ? qtd : '',
        fornecedorVencedorAuto,
        fornecedorEscolhido,
        subtotal
      };
    });

    return {
      totalSacolao: Math.round(totalSacolao * 100) / 100,
      totalMartMinas: Math.round(totalMartMinas * 100) / 100,
      economiaEstimada: Math.round(economiaEstimada * 100) / 100,
      itensCalculados
    };
  }

  async function savePedidoSemanal(pedidoRaw) {
    const produtos = await getProdutosHortifruti();
    const calculados = calcularTotaisPedido(pedidoRaw.itens, produtos);
    const uId = String(pedidoRaw.unidadeId).toLowerCase().startsWith('u') ? pedidoRaw.unidadeId : `u${pedidoRaw.unidadeId}`;

    const doc = {
      id: generatePedidoId(uId, pedidoRaw.mesAno, pedidoRaw.semana),
      unidadeId: uId,
      nutricionistaId: pedidoRaw.nutricionistaId || 'nutri_geral',
      mesAno: pedidoRaw.mesAno,
      semana: parseInt(pedidoRaw.semana),
      dataCriacao: pedidoRaw.dataCriacao || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      itens: calculados.itensCalculados,
      totalSacolao: calculados.totalSacolao,
      totalMartMinas: calculados.totalMartMinas,
      economiaEstimada: calculados.economiaEstimada,
      observacoes: pedidoRaw.observacoes || ''
    };

    await saveDoc(STORAGE_KEYS.HORTIFRUTI_PEDIDOS, doc);
    return doc;
  }

  async function getPedidosPorMes(mesAno, unidadeId = 'todas') {
    const pedidos = await getCollection(STORAGE_KEYS.HORTIFRUTI_PEDIDOS);
    return (pedidos || []).filter(p => {
      const matchMes = p.mesAno === mesAno;
      const matchUnidade = unidadeId === 'todas' || p.unidadeId === unidadeId;
      return matchMes && matchUnidade;
    });
  }

  async function getConsolidadoMensal(mesAno, unidadeIdFilter = 'todas') {
    const pedidos = await getPedidosPorMes(mesAno, unidadeIdFilter);
    const produtos = await getProdutosHortifruti();

    let totalGeralSacolao = 0;
    let totalGeralMartMinas = 0;
    let totalGeralEconomia = 0;

    const consumoPorProduto = {};
    produtos.forEach(p => {
      consumoPorProduto[p.id] = {
        produtoId: p.id,
        nome: p.nome,
        unidadeMedida: p.unidadeMedida,
        categoria: p.categoria,
        qtdTotalSacolao: 0,
        qtdTotalMartMinas: 0,
        qtdTotal: 0,
        valorTotalSacolao: 0,
        valorTotalMartMinas: 0,
        valorTotal: 0
      };
    });

    const resumoPorUnidade = {};
    UNIDADES_SEED.forEach(u => {
      if (unidadeIdFilter === 'todas' || u.id === unidadeIdFilter) {
        resumoPorUnidade[u.id] = {
          unidadeId: u.id,
          nomeLoja: u.loja,
          grupo: u.grupo,
          totalSacolao: 0,
          totalMartMinas: 0,
          totalGeral: 0,
          economia: 0,
          semanasPreenchidas: []
        };
      }
    });

    pedidos.forEach(p => {
      totalGeralSacolao += p.totalSacolao || 0;
      totalGeralMartMinas += p.totalMartMinas || 0;
      totalGeralEconomia += p.economiaEstimada || 0;

      if (resumoPorUnidade[p.unidadeId]) {
        resumoPorUnidade[p.unidadeId].totalSacolao += p.totalSacolao || 0;
        resumoPorUnidade[p.unidadeId].totalMartMinas += p.totalMartMinas || 0;
        resumoPorUnidade[p.unidadeId].totalGeral += (p.totalSacolao || 0) + (p.totalMartMinas || 0);
        resumoPorUnidade[p.unidadeId].economia += p.economiaEstimada || 0;
        resumoPorUnidade[p.unidadeId].semanasPreenchidas.push(p.semana);
      }

      if (p.itens && Array.isArray(p.itens)) {
        p.itens.forEach(item => {
          if (item.quantidade > 0) {
            if (!consumoPorProduto[item.produtoId]) {
              consumoPorProduto[item.produtoId] = {
                produtoId: item.produtoId,
                nome: item.nomeProduto || 'Produto',
                unidadeMedida: item.unidadeMedida || 'kg',
                categoria: item.categoria || 'Hortifrúti',
                qtdTotalSacolao: 0,
                qtdTotalMartMinas: 0,
                qtdTotal: 0,
                valorTotalSacolao: 0,
                valorTotalMartMinas: 0,
                valorTotal: 0
              };
            }

            const prod = consumoPorProduto[item.produtoId];
            prod.qtdTotal += item.quantidade;
            prod.valorTotal += item.subtotal || 0;

            if (item.fornecedorEscolhido === 'Sacolão') {
              prod.qtdTotalSacolao += item.quantidade;
              prod.valorTotalSacolao += item.subtotal || 0;
            } else {
              prod.qtdTotalMartMinas += item.quantidade;
              prod.valorTotalMartMinas += item.subtotal || 0;
            }
          }
        });
      }
    });

    return {
      mesAno,
      unidadeIdFilter,
      totalGeralSacolao: Math.round(totalGeralSacolao * 100) / 100,
      totalGeralMartMinas: Math.round(totalGeralMartMinas * 100) / 100,
      totalGeral: Math.round((totalGeralSacolao + totalGeralMartMinas) * 100) / 100,
      totalGeralEconomia: Math.round(totalGeralEconomia * 100) / 100,
      unidades: Object.values(resumoPorUnidade),
      produtosConsumidos: Object.values(consumoPorProduto).filter(p => p.qtdTotal > 0)
    };
  }

  function generateWhatsAppTextSacolao(pedido, lojaNome) {
    const itensSacolao = (pedido.itens || []).filter(i => i.quantidade > 0 && i.fornecedorEscolhido === 'Sacolão');
    let txt = `*PEDIDO HORTIFRÚTI - SACOLÃO LOCAL*\nUnidade: ${lojaNome}\nReferência: Semana ${pedido.semana} (${pedido.mesAno})\n------------------------------------\n\n`;

    if (itensSacolao.length === 0) {
      txt += `Nenhum item direcionado para o Sacolão nesta semana.\n`;
    } else {
      itensSacolao.forEach((item, idx) => {
        txt += `${idx + 1}. *${item.nomeProduto}*: ${item.quantidade} ${item.unidadeMedida} x R$ ${item.precoSacolao.toFixed(2)} = *R$ ${item.subtotal.toFixed(2)}*\n`;
      });
      txt += `\n------------------------------------\nTOTAL SACOLÃO: R$ ${pedido.totalSacolao.toFixed(2)}\n`;
    }

    return txt;
  }

  function generateWhatsAppTextMartMinas(pedido, lojaNome) {
    const itensMart = (pedido.itens || []).filter(i => i.quantidade > 0 && i.fornecedorEscolhido === 'Mart Minas');
    let txt = `*PEDIDO HORTIFRÚTI - MART MINAS*\nUnidade: ${lojaNome}\nReferência: Semana ${pedido.semana} (${pedido.mesAno})\n------------------------------------\n\n`;

    if (itensMart.length === 0) {
      txt += `Nenhum item direcionado para o Mart Minas nesta semana.\n`;
    } else {
      itensMart.forEach((item, idx) => {
        txt += `${idx + 1}. *${item.nomeProduto}*: ${item.quantidade} ${item.unidadeMedida} x R$ ${item.precoMartMinas.toFixed(2)} = *R$ ${item.subtotal.toFixed(2)}*\n`;
      });
      txt += `\n------------------------------------\nTOTAL MART MINAS: R$ ${pedido.totalMartMinas.toFixed(2)}\n`;
    }

    return txt;
  }

  function normalizeHortiString(str) {
    return (str || '')
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function matchesFuzzySearch(text, query) {
    const normText = normalizeHortiString(text);
    const normQuery = normalizeHortiString(query).trim();
    if (!normQuery) return true;

    const terms = normQuery.split(/\s+/);
    return terms.every(term => normText.includes(term));
  }

  class HortifrutiModuleView {
    constructor() {
      this.id = 'hortifruti';
      this.name = 'Hortifrúti Semanal';
      const now = new Date();
      this.currentMesAno = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      this.currentSemana = 1;
      this.currentUnidadeId = UNIDADES_SEED[0].id;
      this.activeTab = 'cotacao';
      this.produtosCache = [];
      this.itensState = [];
      this.currentPedido = null;
      this.currentProfile = null;
      this.searchQuery = '';
      this.selectedCategories = new Set(['Verduras', 'Legumes', 'Frutas', 'Ovos']);
    }

    async render(container, currentProfile, lockedUnit = null) {
      this.container = container;
      this.currentProfile = currentProfile;
      this.lockedUnit = lockedUnit || (window.app && window.app.lockedUnit);

      if (this.lockedUnit) {
        this.currentUnidadeId = this.lockedUnit.id;
      }

      const isLocked = !!this.lockedUnit;
      this.produtosCache = await getProdutosHortifruti();

      container.innerHTML = `
      <div class="module-header">
        <div class="header-titles">
          <h2>Cotação & Pedidos de Hortifrúti</h2>
          <p class="subtitle">${isLocked ? `Mart Minas — ${this.lockedUnit.loja}` : 'Comparativo de menor preço por produto (Sacolão x Mart Minas) e auditoria de NFs'}</p>
        </div>
        <div class="header-actions">
          ${!isLocked ? `
            <button id="btn-links-whatsapp-horti" class="btn btn-primary">Links das 21 Unidades</button>
            <button id="tab-btn-relatorio" class="btn btn-secondary">
              ${this.activeTab === 'cotacao' ? 'Histórico e Relatórios' : 'Voltar para Cotação'}
            </button>
          ` : ''}
        </div>
      </div>

      <div id="section-cotacao" class="horti-section ${this.activeTab === 'cotacao' ? '' : 'hidden'}">
        <div class="date-and-filter-bar" style="display: flex; flex-direction: column; gap: 12px; padding: 14px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; width: 100%;">
            ${!isLocked ? `
              <div class="date-picker-group">
                <label for="select-horti-unidade">Unidade:</label>
                <select id="select-horti-unidade" class="select-field" style="width: auto; min-width: 200px;">
                  ${UNIDADES_SEED.map(u => `<option value="${u.id}" ${u.id === this.currentUnidadeId ? 'selected' : ''}>${u.loja} (${u.grupo})</option>`).join('')}
                </select>
              </div>
            ` : `
              <div class="date-picker-group">
                <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary-color); display: flex; align-items: center; gap: 6px;">
                   Unidade: <strong>Mart Minas — ${this.lockedUnit.loja}</strong>
                </span>
              </div>
            `}

              <div class="date-picker-group">
                <label for="input-horti-mesano">Mês/Ano:</label>
                <input type="month" id="input-horti-mesano" class="input-date" style="width: auto;" value="${this.currentMesAno}">
              </div>
            </div>

            <div style="border-top: 1px solid var(--border-color); width: 100%; margin: 2px 0;"></div>

            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; width: 100%;">
              <div class="filter-pills" id="semana-pills-group" style="display: flex; gap: 8px;">
                <button class="pill ${this.currentSemana === 1 ? 'active' : ''}" data-semana="1">Semana 1</button>
                <button class="pill ${this.currentSemana === 2 ? 'active' : ''}" data-semana="2">Semana 2</button>
                <button class="pill ${this.currentSemana === 3 ? 'active' : ''}" data-semana="3">Semana 3</button>
                <button class="pill ${this.currentSemana === 4 ? 'active' : ''}" data-semana="4">Semana 4</button>
              </div>

              <button id="btn-copiar-anterior" class="btn btn-secondary" style="white-space: nowrap; font-size: 0.82rem; padding: 6px 14px;">
                Copiar Preços da Semana Anterior
              </button>
            </div>
          </div>

          <div class="search-and-category-bar" style="margin-bottom: 14px; background: var(--bg-surface); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-card);">
            <div class="search-group" style="width: 100%;">
              <input type="text" id="input-search-horti-produto" class="input-search" placeholder="Buscar produto (ex: Batata, Tomate, Laranja)..." style="width: 100%; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.88rem; outline: none;">
            </div>
          </div>

          <div class="table-responsive-container">
            <table class="horti-table">
              <thead>
                <tr>
                  <th class="col-produto">Produto</th>
                  <th class="col-estoque text-center" style="text-align: center;">Estoque</th>
                  <th class="col-sacolao text-center" style="text-align: center;">Preço Sacolão (R$)</th>
                  <th class="col-martminas text-center" style="text-align: center;">Preço Mart Minas (R$)</th>
                  <th class="col-qtd text-center" style="text-align: center;">Quantidade</th>
                  <th class="col-vencedor text-center" style="text-align: center;">Fornecedor Vencedor</th>
                  <th class="col-subtotal text-center" style="text-align: center;">Subtotal (R$)</th>
                </tr>
              </thead>
              <tbody id="horti-tbody-produtos">
                <tr><td colspan="7" class="text-center pad-20">Carregando itens de hortifrúti...</td></tr>
              </tbody>
            </table>
          </div>

          <div class="horti-footer-bar">
            <div class="cards-summary-row">
              <div class="summary-card card-sacolao">
                <div class="card-details">
                  <span class="card-title">TOTAL SACOLÃO</span>
                  <strong id="card-total-sacolao" class="card-value">R$ 0,00</strong>
                </div>
              </div>
              <div class="summary-card card-martminas">
                <div class="card-details">
                  <span class="card-title">TOTAL MART MINAS</span>
                  <strong id="card-total-martminas" class="card-value">R$ 0,00</strong>
                </div>
              </div>
              <div class="summary-card card-economia">
                <div class="card-details">
                  <span class="card-title">ECONOMIA ESTIMADA</span>
                  <strong id="card-total-economia" class="card-value green-text">R$ 0,00</strong>
                </div>
              </div>
            </div>

            <div class="footer-actions">
              <button id="btn-finalizar-pedido" class="btn btn-whatsapp btn-lg">Copiar p/ WhatsApp</button>
            </div>
          </div>
        </div>

        <div id="section-relatorio" class="horti-section ${this.activeTab === 'relatorio' ? '' : 'hidden'}">
          <div class="date-and-filter-bar">
            <div class="date-picker-group">
              <label for="input-rel-mesano">Mês/Ano Referência:</label>
              <input type="month" id="input-rel-mesano" class="input-date" value="${this.currentMesAno}">
            </div>

            <div class="date-picker-group">
              <label for="select-rel-unidade">Unidade:</label>
              <select id="select-rel-unidade" class="input-select select-field">
                <option value="todas">Todas as 21 Unidades</option>
                ${UNIDADES_SEED.map(u => `<option value="${u.id}">${u.loja} (${u.grupo})</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="relatorio-content-container"><div class="loading-spinner">Carregando consolidado...</div></div>
        </div>

        <div id="modal-horti-listas" class="modal hidden">
          <div class="modal-content modal-lg">
            <div class="modal-header">
              <h3>Resumo Formatado para WhatsApp</h3>
              <button class="btn-close-modal" id="btn-close-modal-listas"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div class="modal-body">
              <div class="modal-tabs">
                <button id="modal-tab-sacolao" class="modal-tab-btn active">Lista Sacolão Local</button>
                <button id="modal-tab-martminas" class="modal-tab-btn">Lista Mart Minas</button>
              </div>

              <div id="modal-panel-sacolao" class="modal-tab-panel">
                <p class="subtitle" style="margin-bottom: 8px;">Copia o texto pronto para enviar ao fornecedor do Sacolão:</p>
                <textarea id="txt-whatsapp-sacolao" readonly class="whatsapp-textarea"></textarea>
                <button id="btn-copiar-txt-sacolao" class="btn btn-whatsapp btn-block" style="margin-top: 10px; width: 100%;">Copiar Lista do Sacolão para o WhatsApp</button>
              </div>

              <div id="modal-panel-martminas" class="modal-tab-panel hidden">
                <p class="subtitle" style="margin-bottom: 8px;">Copia o texto pronto para a equipe de compras no Mart Minas:</p>
                <textarea id="txt-whatsapp-martminas" readonly class="whatsapp-textarea"></textarea>
                <button id="btn-copiar-txt-martminas" class="btn btn-whatsapp btn-block" style="margin-top: 10px; width: 100%;">Copiar Lista do Mart Minas para o WhatsApp</button>
              </div>
            </div>
          </div>
        </div>

        ${!isLocked ? `
          <!-- Modal WhatsApp Links das 21 Lojas -->
          <div id="modal-whatsapp-links-horti" class="modal hidden">
            <div class="modal-content modal-large">
              <div class="modal-header">
                <h3>Links de Acesso Direto para o WhatsApp (21 Unidades)</h3>
                <button class="btn-close-modal-links-horti"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div class="modal-body">
                <p class="help-text">Clique em <strong>"Copiar Link"</strong> para copiar a URL exclusiva de cada unidade:</p>
                <div class="table-responsive-card">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Cód</th>
                        <th>Grupo</th>
                        <th>Loja / Unidade</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody id="tbody-links-whatsapp-horti-modal">
                      <tr><td colspan="4" class="text-center">Carregando links...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Modal de Confirmação para Zerar Produto -->
        <div id="modal-confirm-zerar-item" class="modal hidden">
          <div class="modal-content" style="max-width: 420px; text-align: center; padding: 24px; border-radius: var(--radius-lg);">
            <div style="width: 54px; height: 54px; border-radius: 50%; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-title); margin-bottom: 6px;">Zerar Valores do Produto</h3>
            <p id="confirm-zerar-item-msg" style="font-size: 0.88rem; color: var(--text-body); margin-bottom: 20px; line-height: 1.4;">
              Tem certeza que deseja zerar os valores deste produto?
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
              <button id="btn-cancel-zerar-item" class="btn btn-secondary" style="flex: 1; padding: 10px; font-weight: 700;">Cancelar</button>
              <button id="btn-confirm-zerar-item" class="btn btn-danger" style="flex: 1; padding: 10px; background: #dc2626; border-color: #dc2626; color: #ffffff; font-weight: 700;">Sim, Zerar Produto</button>
            </div>
          </div>
        </div>
      `;

      this.bindEvents();
      await this.loadCotacaoData();
    }

    bindEvents() {
      this.pendingClearItemIndex = null;
      this.pendingClearItemTr = null;

      const modalConfirm = this.container.querySelector('#modal-confirm-zerar-item');
      const btnCancelConfirm = this.container.querySelector('#btn-cancel-zerar-item');
      const btnDoConfirm = this.container.querySelector('#btn-confirm-zerar-item');

      if (btnCancelConfirm) {
        btnCancelConfirm.addEventListener('click', () => {
          if (modalConfirm) modalConfirm.classList.add('hidden');
          this.pendingClearItemIndex = null;
          this.pendingClearItemTr = null;
        });
      }

      if (btnDoConfirm) {
        btnDoConfirm.addEventListener('click', async () => {
          if (this.pendingClearItemIndex !== null && this.itensState[this.pendingClearItemIndex]) {
            const idx = this.pendingClearItemIndex;
            const item = this.itensState[idx];
            item.estoque = '';
            item.precoSacolao = '';
            item.precoMartMinas = '';
            item.quantidade = '';
            item.fornecedorEscolhido = null;
            item.isManual = false;

            const tr = this.pendingClearItemTr;
            if (tr) {
              tr.querySelectorAll('input').forEach(inp => inp.value = '');
              const select = tr.querySelector('select');
              if (select) select.value = '';
            }

            this.updateRowCalculations(tr, idx);
            this.updateResumoCards();

            const rawDoc = {
              unidadeId: this.currentUnidadeId,
              mesAno: this.currentMesAno,
              semana: this.currentSemana,
              nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
              itens: this.itensState
            };
            await savePedidoSemanal(rawDoc);
          }

          if (modalConfirm) modalConfirm.classList.add('hidden');
          this.pendingClearItemIndex = null;
          this.pendingClearItemTr = null;
        });
      }

      const tabRelatorio = this.container.querySelector('#tab-btn-relatorio');
      const secCotacao = this.container.querySelector('#section-cotacao');
      const secRelatorio = this.container.querySelector('#section-relatorio');

      if (tabRelatorio) {
        tabRelatorio.addEventListener('click', async () => {
          if (this.activeTab === 'cotacao') {
            this.activeTab = 'relatorio';
            tabRelatorio.textContent = 'Voltar para Cotação';
            secCotacao.classList.add('hidden');
            secRelatorio.classList.remove('hidden');
            await this.loadRelatorioData();
          } else {
            this.activeTab = 'cotacao';
            tabRelatorio.textContent = 'Histórico e Relatórios';
            secCotacao.classList.remove('hidden');
            secRelatorio.classList.add('hidden');
          }
        });
      }

      const btnLinksWhatsapp = this.container.querySelector('#btn-links-whatsapp-horti');
      if (btnLinksWhatsapp) {
        btnLinksWhatsapp.addEventListener('click', async () => {
          await this.renderModalLinksWhatsapp();
        });
      }

      const btnCloseLinks = this.container.querySelector('.btn-close-modal-links-horti');
      if (btnCloseLinks) {
        btnCloseLinks.addEventListener('click', () => {
          const modalLinks = this.container.querySelector('#modal-whatsapp-links-horti');
          if (modalLinks) modalLinks.classList.add('hidden');
        });
      }

      const selectUnidade = this.container.querySelector('#select-horti-unidade');
      const inputMesAno = this.container.querySelector('#input-horti-mesano');
      const semanaPills = this.container.querySelectorAll('#semana-pills-group .pill');

      if (selectUnidade) {
        selectUnidade.addEventListener('change', async (e) => {
          this.currentUnidadeId = e.target.value;
          await this.loadCotacaoData();
        });
      }

      if (inputMesAno) {
        inputMesAno.addEventListener('change', async (e) => {
          this.currentMesAno = e.target.value;
          await this.loadCotacaoData();
        });
      }

      semanaPills.forEach(pill => {
        pill.addEventListener('click', async (e) => {
          semanaPills.forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          this.currentSemana = parseInt(e.target.getAttribute('data-semana'));
          await this.loadCotacaoData();
        });
      });

      const inputSearch = this.container.querySelector('#input-search-horti-produto');
      if (inputSearch) {
        inputSearch.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.renderTabelaProdutos();
        });
      }

      const btnCopiar = this.container.querySelector('#btn-copiar-anterior');
      if (btnCopiar) {
        btnCopiar.addEventListener('click', async () => {
          await this.handleCopiarSemanaAnterior();
        });
      }

      const btnZerarCot = this.container.querySelector('#btn-zerar-cotacao');
      if (btnZerarCot) {
        btnZerarCot.addEventListener('click', async () => {
          if (confirm("Atenção: Deseja realmente apagar todos os estoques, preços e quantidades lançados nesta cotação?")) {
            this.itensState.forEach(item => {
              item.estoque = '';
              item.precoSacolao = '';
              item.precoMartMinas = '';
              item.quantidade = '';
              item.fornecedorEscolhido = null;
              item.isManual = false;
            });
            this.renderTabelaProdutos();
            this.updateResumoCards();
            const rawDoc = {
              unidadeId: this.currentUnidadeId,
              mesAno: this.currentMesAno,
              semana: this.currentSemana,
              nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
              itens: this.itensState
            };
            await savePedidoSemanal(rawDoc);
            showToast("Todos os valores foram zerados!", "success");
          }
        });
      }

      const btnFinalizar = this.container.querySelector('#btn-finalizar-pedido');
      btnFinalizar.addEventListener('click', async () => {
        await this.handleFinalizarPedido();
      });

      const inputRelMesAno = this.container.querySelector('#input-rel-mesano');
      if (inputRelMesAno) {
        inputRelMesAno.addEventListener('change', async () => {
          await this.loadRelatorioData();
        });
      }

      const selectRelUnidade = this.container.querySelector('#select-rel-unidade');
      if (selectRelUnidade) {
        selectRelUnidade.addEventListener('change', async () => {
          await this.loadRelatorioData();
        });
      }

      const modalListas = this.container.querySelector('#modal-horti-listas');
      const btnCloseModal = this.container.querySelector('#btn-close-modal-listas');
      if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => modalListas.classList.add('hidden'));
      }

      const tabModalSacolao = this.container.querySelector('#modal-tab-sacolao');
      const tabModalMart = this.container.querySelector('#modal-tab-martminas');
      const panelModalSacolao = this.container.querySelector('#modal-panel-sacolao');
      const panelModalMart = this.container.querySelector('#modal-panel-martminas');

      if (tabModalSacolao && tabModalMart) {
        tabModalSacolao.addEventListener('click', () => {
          tabModalSacolao.classList.add('active');
          tabModalMart.classList.remove('active');
          panelModalSacolao.classList.remove('hidden');
          panelModalMart.classList.add('hidden');
        });

        tabModalMart.addEventListener('click', () => {
          tabModalMart.classList.add('active');
          tabModalSacolao.classList.remove('active');
          panelModalMart.classList.remove('hidden');
          panelModalSacolao.classList.add('hidden');
        });
      }

      const btnCopiarSacolao = this.container.querySelector('#btn-copiar-txt-sacolao');
      const btnCopiarMart = this.container.querySelector('#btn-copiar-txt-martminas');

      if (btnCopiarSacolao) {
        btnCopiarSacolao.addEventListener('click', () => {
          const txt = this.container.querySelector('#txt-whatsapp-sacolao').value;
          navigator.clipboard.writeText(txt);
          showToast("Lista do Sacolão copiada com sucesso!", "success");
        });
      }

      if (btnCopiarMart) {
        btnCopiarMart.addEventListener('click', () => {
          const txt = this.container.querySelector('#txt-whatsapp-martminas').value;
          navigator.clipboard.writeText(txt);
          showToast("Lista do Mart Minas copiada com sucesso!", "success");
        });
      }

      // Listener de Atualização em Tempo Real para Hortifrúti (Realtime Sync)
      if (this.realtimeHandler) {
        window.removeEventListener('abib_realtime_update', this.realtimeHandler);
      }
      this.realtimeHandler = async (e) => {
        if (e.detail && (e.detail.key === STORAGE_KEYS.HORTIFRUTI_PEDIDOS || e.detail.key === STORAGE_KEYS.UNIDADES)) {
          const activeEl = document.activeElement;
          if (activeEl && this.container.contains(activeEl) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
            this.hasPendingRealtimeUpdate = true;
            return;
          }
          await this.loadCotacaoData();
        }
      };
      window.addEventListener('abib_realtime_update', this.realtimeHandler);

      // Sincroniza ao alternar/voltar para esta aba
      if (this.visibilityHandler) {
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        window.removeEventListener('focus', this.visibilityHandler);
      }
      this.visibilityHandler = async () => {
        if (document.visibilityState === 'visible') {
          const activeEl = document.activeElement;
          if (activeEl && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName)) {
            activeEl.blur();
          }
          const rawPedidos = localStorage.getItem(STORAGE_KEYS.HORTIFRUTI_PEDIDOS);
          if (rawPedidos) {
            try { updateMemoryCache(STORAGE_KEYS.HORTIFRUTI_PEDIDOS, JSON.parse(rawPedidos)); } catch (err) {}
          }
          await this.loadCotacaoData();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
      window.addEventListener('focus', this.visibilityHandler);
    }

    async renderModalLinksWhatsapp() {
      const unidades = await getUnidades();
      const modal = this.container.querySelector('#modal-whatsapp-links-horti');
      const tbody = this.container.querySelector('#tbody-links-whatsapp-horti-modal');
      const baseUrl = `${window.location.origin}${window.location.pathname}`;

      if (!modal || !tbody) return;
      tbody.innerHTML = '';

      unidades.forEach(u => {
        const fullLink = `${baseUrl}?token=${u.tokenAcesso}`;
        const grpClass = u.grupo ? `group-badge-${u.grupo.toLowerCase()}` : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.codigo || '-'}</td>
          <td><span class="group-badge-tag ${grpClass}">${u.grupo || '-'}</span></td>
          <td><strong>${u.loja}</strong></td>
          <td>
            <button class="btn btn-sm btn-primary btn-copy-whatsapp-link" data-loja="${u.loja}" data-link="${fullLink}">
              Copiar Link
            </button>
          </td>
        `;

        tr.querySelector('.btn-copy-whatsapp-link').addEventListener('click', () => {
          const temp = document.createElement('textarea');
          temp.value = fullLink;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
          showToast(`Link da unidade ${u.loja} copiado!`, "success");
        });

        tbody.appendChild(tr);
      });

      modal.classList.remove('hidden');
    }

    async loadCotacaoData() {
      const tbody = this.container.querySelector('#horti-tbody-produtos');
      tbody.innerHTML = `<tr><td colspan="6" class="text-center pad-20">Carregando pedido...</td></tr>`;

      this.currentPedido = await getPedidoSemanal(this.currentUnidadeId, this.currentMesAno, this.currentSemana);

      this.itensState = this.produtosCache.map(prod => {
        const itemExistente = this.currentPedido?.itens?.find(i => i.produtoId === prod.id);
        return {
          produtoId: prod.id,
          nomeProduto: prod.nome,
          unidadeMedida: prod.unidadeMedida,
          categoria: prod.categoria,
          estoque: itemExistente ? (itemExistente.estoque !== undefined && itemExistente.estoque !== null ? itemExistente.estoque : '') : '',
          precoSacolao: itemExistente ? (itemExistente.precoSacolao !== undefined && itemExistente.precoSacolao !== null && itemExistente.precoSacolao !== 0 ? itemExistente.precoSacolao : '') : '',
          precoMartMinas: itemExistente ? (itemExistente.precoMartMinas !== undefined && itemExistente.precoMartMinas !== null && itemExistente.precoMartMinas !== 0 ? itemExistente.precoMartMinas : '') : '',
          quantidade: itemExistente ? (itemExistente.quantidade !== undefined && itemExistente.quantidade !== null && itemExistente.quantidade !== 0 ? itemExistente.quantidade : '') : '',
          fornecedorEscolhido: itemExistente ? itemExistente.fornecedorEscolhido : null,
          isManual: itemExistente ? !!itemExistente.isManual : false
        };
      });

      this.renderTabelaProdutos();
      this.updateResumoCards();
    }

    renderTabelaProdutos() {
      const tbody = this.container.querySelector('#horti-tbody-produtos');
      tbody.innerHTML = '';
      let categoriaAtual = '';
      let itensExibidosCount = 0;

      this.itensState.forEach((item, index) => {
        if (this.searchQuery) {
          const matchNome = matchesFuzzySearch(item.nomeProduto, this.searchQuery);
          if (!matchNome) {
            return;
          }
        }

        itensExibidosCount++;

        const pSac = parseFloat(item.precoSacolao) || 0;
        const pMart = parseFloat(item.precoMartMinas) || 0;
        const qtd = parseFloat(item.quantidade) || 0;
        const est = parseFloat(item.estoque) || 0;

        let sacHighlight = '';
        let martHighlight = '';
        let vencedorAuto = '';

        if (pSac > 0 && pMart > 0) {
          if (pSac < pMart) {
            sacHighlight = 'bg-green-highlight';
            vencedorAuto = 'Sacolão';
          } else if (pMart < pSac) {
            martHighlight = 'bg-green-highlight';
            vencedorAuto = 'Mart Minas';
          } else {
            sacHighlight = 'bg-green-highlight';
            vencedorAuto = 'Sacolão';
          }
        } else if (pMart > 0) {
          martHighlight = 'bg-green-highlight';
          vencedorAuto = 'Mart Minas';
        } else if (pSac > 0) {
          sacHighlight = 'bg-green-highlight';
          vencedorAuto = 'Sacolão';
        } else {
          vencedorAuto = '';
        }

        if (!item.isManual) {
          item.fornecedorEscolhido = vencedorAuto;
        }

        const fornecedorEscolhido = item.fornecedorEscolhido || vencedorAuto;
        const isDiferenteDoAuto = item.isManual && item.fornecedorEscolhido !== vencedorAuto;
        const precoFinal = fornecedorEscolhido === 'Mart Minas' ? pMart : (fornecedorEscolhido === 'Sacolão' ? pSac : 0);
        const subtotal = Math.round((qtd * precoFinal) * 100) / 100;

        const isFilled = (pSac > 0 || pMart > 0 || qtd > 0 || est > 0);
        const tr = document.createElement('tr');
        tr.className = `tr-produto-row ${isFilled ? 'tr-filled' : ''}`;
        tr.innerHTML = `
          <td class="col-produto">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
              <div>
                <strong>${item.nomeProduto}</strong> <small class="text-muted">(${item.unidadeMedida})</small>
              </div>
              <button class="btn-clear-item-row" data-index="${index}" title="Zerar valores deste produto">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>

          <td class="col-input col-estoque">
            <label class="mobile-label">Estoque</label>
            <div class="input-qtd-wrapper">
              <input type="number" step="0.1" min="0" data-index="${index}" data-field="estoque" 
                     class="input-table-number input-estoque" value="${item.estoque}" placeholder="0">
            </div>
          </td>

          <td class="col-input col-sacolao ${sacHighlight}">
            <label class="mobile-label">Sacolão</label>
            <div class="input-money-wrapper">
              <span class="currency-symbol">R$</span>
              <input type="number" step="0.01" min="0" data-index="${index}" data-field="precoSacolao" 
                     class="input-table-number input-sacolao" value="${item.precoSacolao}" placeholder="0,00">
            </div>
          </td>

          <td class="col-input col-martminas ${martHighlight}">
            <label class="mobile-label">Mart Minas</label>
            <div class="input-money-wrapper">
              <span class="currency-symbol">R$</span>
              <input type="number" step="0.01" min="0" data-index="${index}" data-field="precoMartMinas" 
                     class="input-table-number input-martminas" value="${item.precoMartMinas}" placeholder="0,00">
            </div>
          </td>

          <td class="col-input col-qtd">
            <label class="mobile-label">Qtd</label>
            <div class="input-qtd-wrapper">
              <input type="number" step="0.1" min="0" data-index="${index}" data-field="quantidade" 
                     class="input-table-number input-qtd" value="${item.quantidade}" placeholder="0">
            </div>
          </td>

          <td class="col-vencedor text-center">
            <label class="mobile-label">Vencedor</label>
            <select data-index="${index}" data-field="fornecedorEscolhido" class="select-vencedor-override">
              <option value="" ${!fornecedorEscolhido ? 'selected' : ''}>-</option>
              <option value="Sacolão" ${fornecedorEscolhido === 'Sacolão' ? 'selected' : ''}>Sacolão</option>
              <option value="Mart Minas" ${fornecedorEscolhido === 'Mart Minas' ? 'selected' : ''}>Mart Minas</option>
            </select>
            <small class="tag-override" style="font-size: 0.7rem; color: #d97706; font-weight: 600; margin-top: 2px; display: ${isDiferenteDoAuto ? 'block' : 'none'};">(Escolha manual)</small>
          </td>

          <td class="col-subtotal text-center" style="text-align: center;">
            <label class="mobile-label">Subtotal</label>
            <strong class="subtotal-val">R$ ${subtotal.toFixed(2).replace('.', ',')}</strong>
          </td>
        `;
        tbody.appendChild(tr);
      });

      if (itensExibidosCount === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center pad-20" style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum produto encontrado para a busca ou categoria selecionada.</td></tr>`;
      }

      this.bindTableInputs();
    }

    bindTableInputs() {
      const tbody = this.container.querySelector('#horti-tbody-produtos');
      const inputs = tbody.querySelectorAll('input, select');

      inputs.forEach(inp => {
        const handler = (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'));
          const field = e.target.getAttribute('data-field');
          const item = this.itensState[idx];

          if (field === 'fornecedorEscolhido') {
            item.isManual = true;
            item.fornecedorEscolhido = e.target.value;
          } else {
            item[field] = e.target.value;
          }

          this.updateRowCalculations(e.target.closest('tr'), idx);
          this.updateResumoCards();
        };

        inp.addEventListener('input', handler);
        inp.addEventListener('change', handler);

        // Auto-seleciona texto ao focar (digitação rápida)
        inp.addEventListener('focus', (e) => {
          if (e.target.tagName === 'INPUT') {
            e.target.select();
          }
        });

        // Formatação com 2 casas decimais no blur (ao perder o foco) e Salvamento Imediato no Banco
        inp.addEventListener('blur', async (e) => {
          const field = e.target.getAttribute('data-field');
          const idx = parseInt(e.target.getAttribute('data-index'));
          if (field && !isNaN(idx) && this.itensState[idx]) {
            const rawVal = e.target.value.trim();
            if (rawVal === '' || rawVal === '0') {
              this.itensState[idx][field] = '';
              e.target.value = '';
            } else {
              const numVal = parseFloat(rawVal);
              if (!isNaN(numVal) && numVal > 0) {
                if (field === 'precoSacolao' || field === 'precoMartMinas') {
                  const formatted = numVal.toFixed(2);
                  e.target.value = formatted;
                  this.itensState[idx][field] = formatted;
                } else {
                  this.itensState[idx][field] = numVal;
                }
              }
            }
          }
          if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
          }
          const rawDoc = {
            unidadeId: this.currentUnidadeId,
            mesAno: this.currentMesAno,
            semana: this.currentSemana,
            nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
            itens: this.itensState
          };
          await savePedidoSemanal(rawDoc);
        });
      });

      tbody.querySelectorAll('.btn-clear-item-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const idx = parseInt(btn.getAttribute('data-index'));
          if (!isNaN(idx) && this.itensState[idx]) {
            const item = this.itensState[idx];
            const nomeProd = item.nome || item.nomeProduto || 'este produto';
            
            this.pendingClearItemIndex = idx;
            this.pendingClearItemTr = btn.closest('tr');

            const modalConfirm = this.container.querySelector('#modal-confirm-zerar-item');
            const msgConfirm = this.container.querySelector('#confirm-zerar-item-msg');

            if (msgConfirm) {
              msgConfirm.innerHTML = `Tem certeza que deseja apagar o estoque, preços e quantidade de <strong>${nomeProd}</strong>?`;
            }
            if (modalConfirm) {
              modalConfirm.classList.remove('hidden');
            }
          }
        });
      });
    }

    updateRowCalculations(tr, idx) {
      const item = this.itensState[idx];
      const pSac = parseFloat(item.precoSacolao) || 0;
      const pMart = parseFloat(item.precoMartMinas) || 0;
      const qtd = parseFloat(item.quantidade) || 0;

      const isFilled = (pSac > 0 || pMart > 0 || qtd > 0);
      if (isFilled) {
        tr.classList.add('tr-filled');
      } else {
        tr.classList.remove('tr-filled');
      }

      const tdSac = tr.querySelector('.col-sacolao');
      const tdMart = tr.querySelector('.col-martminas');

      if (tdSac) tdSac.classList.remove('bg-green-highlight');
      if (tdMart) tdMart.classList.remove('bg-green-highlight');

      let vencedorAuto = '';
      if (pSac > 0 && pMart > 0) {
        if (pSac < pMart) {
          if (tdSac) tdSac.classList.add('bg-green-highlight');
          vencedorAuto = 'Sacolão';
        } else if (pMart < pSac) {
          if (tdMart) tdMart.classList.add('bg-green-highlight');
          vencedorAuto = 'Mart Minas';
        } else {
          if (tdSac) tdSac.classList.add('bg-green-highlight');
          vencedorAuto = 'Sacolão';
        }
      } else if (pMart > 0) {
        if (tdMart) tdMart.classList.add('bg-green-highlight');
        vencedorAuto = 'Mart Minas';
      } else if (pSac > 0) {
        if (tdSac) tdSac.classList.add('bg-green-highlight');
        vencedorAuto = 'Sacolão';
      } else {
        vencedorAuto = '';
      }

      if (!item.isManual) {
        item.fornecedorEscolhido = vencedorAuto;
        const selectVencedor = tr.querySelector('.select-vencedor-override');
        if (selectVencedor) {
          selectVencedor.value = vencedorAuto;
        }
      }

      const isDiferenteDoAuto = item.isManual && item.fornecedorEscolhido !== vencedorAuto;
      const tagOverride = tr.querySelector('.tag-override');
      if (tagOverride) {
        tagOverride.style.display = isDiferenteDoAuto ? 'block' : 'none';
      }

      const precoFinal = item.fornecedorEscolhido === 'Mart Minas' ? pMart : (item.fornecedorEscolhido === 'Sacolão' ? pSac : 0);
      const subtotal = Math.round((qtd * precoFinal) * 100) / 100;

      const subtotalEl = tr.querySelector('.subtotal-val');
      if (subtotalEl) {
        subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
      }
    }

    updateResumoCards() {
      const calculados = calcularTotaisPedido(this.itensState, this.produtosCache);
      const cardSac = this.container.querySelector('#card-total-sacolao');
      const cardMart = this.container.querySelector('#card-total-martminas');
      const cardEco = this.container.querySelector('#card-total-economia');

      if (cardSac) cardSac.textContent = `R$ ${calculados.totalSacolao.toFixed(2).replace('.', ',')}`;
      if (cardMart) cardMart.textContent = `R$ ${calculados.totalMartMinas.toFixed(2).replace('.', ',')}`;
      if (cardEco) cardEco.textContent = `R$ ${calculados.economiaEstimada.toFixed(2).replace('.', ',')}`;

      this.autoSaveCotacao();
    }

    autoSaveCotacao() {
      if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = setTimeout(async () => {
        const rawDoc = {
          unidadeId: this.currentUnidadeId,
          mesAno: this.currentMesAno,
          semana: this.currentSemana,
          nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
          itens: this.itensState
        };
        await savePedidoSemanal(rawDoc);
      }, 300);
    }

    async handleCopiarSemanaAnterior() {
      const res = await copiarPrecosSemanaAnterior(this.currentUnidadeId, this.currentMesAno, this.currentSemana);
      if (!res.sucesso) {
        showToast(res.mensagem, "error");
        return;
      }

      let itensCopiadosCount = 0;
      this.itensState.forEach(item => {
        const precoAnt = res.mapaPrecos[item.produtoId];
        if (precoAnt) {
          if (precoAnt.precoSacolao > 0) item.precoSacolao = precoAnt.precoSacolao;
          if (precoAnt.precoMartMinas > 0) item.precoMartMinas = precoAnt.precoMartMinas;
          itensCopiadosCount++;
        }
      });

      this.renderTabelaProdutos();
      this.updateResumoCards();
      showToast(`Preços copiados da Semana ${res.semanaOrigem} (${res.mesAnoOrigem}) com sucesso!`, "success");
    }

    async handleFinalizarPedido() {
      if (this.autoSaveTimer) clearTimeout(this.autoSaveTimer);
      const rawDoc = {
        unidadeId: this.currentUnidadeId,
        mesAno: this.currentMesAno,
        semana: this.currentSemana,
        nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
        itens: this.itensState
      };

      const docSalvo = await savePedidoSemanal(rawDoc);
      const lojaObj = UNIDADES_SEED.find(u => u.id === this.currentUnidadeId);
      const nomeLoja = lojaObj ? `${lojaObj.loja} (${lojaObj.grupo})` : 'Unidade';

      const txtSacolao = generateWhatsAppTextSacolao(docSalvo, nomeLoja);
      const txtMart = generateWhatsAppTextMartMinas(docSalvo, nomeLoja);

      const txtAreaSacolao = this.container.querySelector('#txt-whatsapp-sacolao');
      const txtAreaMart = this.container.querySelector('#txt-whatsapp-martminas');

      if (txtAreaSacolao) txtAreaSacolao.value = txtSacolao;
      if (txtAreaMart) txtAreaMart.value = txtMart;

      const modal = this.container.querySelector('#modal-horti-listas');
      modal.classList.remove('hidden');
    }

    async loadRelatorioData() {
      const containerRel = this.container.querySelector('#relatorio-content-container');
      const inputMesAno = this.container.querySelector('#input-rel-mesano');
      const selectUnidade = this.container.querySelector('#select-rel-unidade');

      const mesAno = inputMesAno ? inputMesAno.value : this.currentMesAno;
      const unidadeIdFilter = selectUnidade ? selectUnidade.value : 'todas';

      containerRel.innerHTML = `<div class="loading-spinner">Gerando relatório de auditoria...</div>`;
      const data = await getConsolidadoMensal(mesAno, unidadeIdFilter);

      containerRel.innerHTML = `
        <div class="rel-cards-grid">
          <div class="summary-card card-sacolao">
            <div class="card-details">
              <span class="card-title">Acumulado Sacolão</span>
              <strong class="card-value">R$ ${data.totalGeralSacolao.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>

          <div class="summary-card card-martminas">
            <div class="card-details">
              <span class="card-title">Acumulado Mart Minas</span>
              <strong class="card-value">R$ ${data.totalGeralMartMinas.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>

          <div class="summary-card card-economia">
            <div class="card-details">
              <span class="card-title">Economia Acumulada no Mês</span>
              <strong class="card-value green-text">R$ ${data.totalGeralEconomia.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
        </div>

        <div class="rel-table-box" style="margin-top: 32px;">
          <h3 style="margin-bottom: 12px;">Auditoria por Unidade (Conferência com Notas Fiscais)</h3>
          <div class="table-responsive-container">
            <table class="horti-table table-striped table-auditoria-unidades">
              <thead>
                <tr>
                  <th>Unidade</th>
                  <th class="text-right">Total Sacolão (R$)</th>
                  <th class="text-right">Total Mart Minas (R$)</th>
                  <th class="text-right">Economia (R$)</th>
                  <th class="text-right">Total Geral (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${data.unidades.map(u => `
                  <tr class="tr-auditoria-row">
                    <td class="col-unidade-nome">
                      <strong>${u.nomeLoja}</strong> <small class="text-muted">(${u.grupo})</small>
                    </td>
                    <td class="col-auditoria-sacolao text-right">
                      <label class="mobile-label">Sacolão</label>
                      <span>R$ ${u.totalSacolao.toFixed(2).replace('.', ',')}</span>
                    </td>
                    <td class="col-auditoria-martminas text-right">
                      <label class="mobile-label">Mart Minas</label>
                      <span>R$ ${u.totalMartMinas.toFixed(2).replace('.', ',')}</span>
                    </td>
                    <td class="col-auditoria-economia text-right green-text">
                      <label class="mobile-label">Economia</label>
                      <span>R$ ${u.economia.toFixed(2).replace('.', ',')}</span>
                    </td>
                    <td class="col-auditoria-total text-right">
                      <label class="mobile-label inline">Total Geral: </label>
                      <strong>R$ ${u.totalGeral.toFixed(2).replace('.', ',')}</strong>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="rel-table-box" style="margin-top: 32px;">
          <h3 style="margin-bottom: 12px;">Consumo Total de Produtos no Mês</h3>
          <div class="table-responsive-container">
            <table class="horti-table table-striped table-consumo-produtos">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th class="text-center">No Sacolão</th>
                  <th class="text-center">No Mart Minas</th>
                  <th class="text-center">Qtd. Total Consumida</th>
                  <th class="text-right">Valor Total Acumulado</th>
                </tr>
              </thead>
              <tbody>
                ${data.produtosConsumidos.length > 0 ? data.produtosConsumidos.map(p => `
                  <tr class="tr-consumo-row">
                    <td class="col-consumo-nome">
                      <strong>${p.nome}</strong> <span class="tag-cat">${p.categoria}</span>
                    </td>
                    <td class="col-consumo-sacolao text-center">
                      <label class="mobile-label">No Sacolão</label>
                      <span>${p.qtdTotalSacolao} ${p.unidadeMedida}</span>
                    </td>
                    <td class="col-consumo-martminas text-center">
                      <label class="mobile-label">No Mart Minas</label>
                      <span>${p.qtdTotalMartMinas} ${p.unidadeMedida}</span>
                    </td>
                    <td class="col-consumo-qtd text-center">
                      <label class="mobile-label">Qtd Total</label>
                      <strong>${p.qtdTotal} ${p.unidadeMedida}</strong>
                    </td>
                    <td class="col-consumo-valor text-right">
                      <label class="mobile-label inline">Valor Total: </label>
                      <strong>R$ ${p.valorTotal.toFixed(2).replace('.', ',')}</strong>
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="5" class="text-center pad-20">Nenhum consumo registrado neste período.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  // --- 11. APP CONTROLLER PRINCIPAL ---
  class AppController {
    constructor() {
      this.currentProfile = null;
      this.currentView = 'dashboard';
      this.lockedUnit = null;
      this.lockedModule = null;
      this.comensaisModule = new ComensaisModuleView();
      this.comensaisReportView = new ComensaisReportView(this);
      this.hortifrutiModule = new HortifrutiModuleView();
      this.adminPanel = new AdminPanel(this);
      this.logoClickCount = 0;
      this.logoClickTimer = null;
    }

    isAuthorized(targetModule = null) {
      const isMaster = sessionStorage.getItem('abib_manager_logged') === 'true';
      if (isMaster) return true;
      if (targetModule === 'comensais') return sessionStorage.getItem('abib_module_logged_comensais') === 'true';
      if (targetModule === 'hortifruti') return sessionStorage.getItem('abib_module_logged_hortifruti') === 'true';
      return false;
    }

    async init() {
      try {
        console.log("Inicializando Sistema de Gestão ABIB...");
        const config = await getConfig();
        if (config.firebaseConfig) {
          initFirebase(config.firebaseConfig);
        } else {
          initFirebase(DEFAULT_FIREBASE_CONFIG);
        }

        // 1. VERIFICAR TOKEN DE UNIDADE OU MÓDULO EXCLUSIVO NA URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token') || urlParams.get('t') || urlParams.get('u');
        const urlModulo = (urlParams.get('modulo') || urlParams.get('m') || '').toLowerCase();

        if (urlToken) {
          const validatedUnit = await getUnidadeByToken(urlToken);
          if (validatedUnit) {
            this.lockedUnit = validatedUnit;
            this.lockedModule = 'hortifruti';
            this.currentProfile = {
              id: 'p_operante',
              nome: `Nutricionista (${validatedUnit.loja})`,
              icone: '',
              modulos: ['hortifruti']
            };
            this.renderAppLocked('hortifruti');
            return;
          } else {
            this.renderTokenInvalidView();
            return;
          }
        }

        if (urlModulo === 'comensais' || urlModulo === 'hortifruti') {
          this.lockedModule = urlModulo;
        }

        // 2. SE NÃO HÁ TOKEN NA URL: REMOVER QUALQUER TRAVA DE UNIDADE ANTIGA
        localStorage.removeItem('abib_unit_token');
        this.lockedUnit = null;

        // 3. VERIFICAR AUTENTICAÇÃO E SENHA REQUERIDA
        if (this.lockedModule) {
          if (!this.isAuthorized(this.lockedModule)) {
            this.renderManagerLoginView(this.lockedModule);
            return;
          }
        } else {
          if (!this.isAuthorized(null)) {
            this.renderManagerLoginView(null);
            return;
          }
        }

        // 4. AUTENTICADO: CARREGAR PERFIL E NAVEGAR
        this.currentProfile = await getActiveProfile() || {
          id: 'p_diretoria',
          nome: 'Gestão & Diretoria',
          icone: '',
          modulos: ['comensais', 'hortifruti'],
          permissoesCamposUnidade: ["codigo", "grupo", "loja", "unidade", "cnpj"]
        };

        if (this.lockedModule) {
          this.renderAppLocked(this.lockedModule);
          return;
        }

        window.addEventListener('popstate', () => this.checkHashRoute());
        window.addEventListener('hashchange', () => this.checkHashRoute());

        this.checkHashRoute();
      } catch (err) {
        console.error("Erro ao inicializar:", err);
        this.renderManagerLoginView();
      }
    }

    renderManagerLoginView(targetModule = null) {
      const container = document.getElementById('main-view-container');
      if (!container) return;

      let title = "Acesso Restrito da Gerência";
      let subtitle = "Digite a Senha Máster para acessar o Sistema de Gestão ABIB";
      let placeholder = "Digite a senha máster...";

      if (targetModule === 'comensais') {
        title = "Acesso Restrito: Comensais Diários";
        subtitle = "Digite a senha do Módulo de Comensais ou a Senha Máster";
        placeholder = "Digite a senha do módulo comensais...";
      } else if (targetModule === 'hortifruti') {
        title = "Acesso Restrito: Hortifrúti Semanal";
        subtitle = "Digite a senha do Módulo de Hortifrúti ou a Senha Máster";
        placeholder = "Digite a senha do módulo hortifrúti...";
      }

      container.innerHTML = `
        <div class="admin-auth-overlay">
          <div class="admin-auth-card">
            <div class="auth-icon"></div>
            <h2>${title}</h2>
            <p class="subtitle">${subtitle}</p>

            <form id="form-manager-login">
              <input type="password" id="input-manager-password" class="input-field" placeholder="${placeholder}" autofocus required>
              <button type="submit" class="btn btn-primary btn-block" style="margin-top: 12px;">Entrar no Sistema</button>
            </form>
          </div>
        </div>
      `;

      const form = container.querySelector('#form-manager-login');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = container.querySelector('#input-manager-password').value;
        const moduleTarget = targetModule || this.lockedModule;
        const authResult = await validateModulePIN(pass, moduleTarget);

        if (authResult.valid) {
          if (authResult.isMaster) {
            sessionStorage.setItem('abib_manager_logged', 'true');
          } else if (moduleTarget) {
            sessionStorage.setItem(`abib_module_logged_${moduleTarget}`, 'true');
          }

          this.currentProfile = await getActiveProfile() || {
            id: 'p_diretoria',
            nome: 'Gestão & Diretoria',
            icone: '',
            modulos: ['comensais', 'hortifruti'],
            permissoesCamposUnidade: ["codigo", "grupo", "loja", "unidade", "cnpj"]
          };
          if (this.lockedModule) {
            this.renderAppLocked(this.lockedModule);
          } else {
            this.renderApp();
          }
        } else {
          alert("Senha Incorreta! Tente novamente.");
        }
      });
    }

    renderAppLocked(targetModule = 'hortifruti') {
      this.lockedModule = targetModule;
      this.renderHeaderLockedModule(targetModule);
      this.switchView(targetModule);
    }

    renderHeaderLockedModule(targetModule) {
      if (this.lockedUnit) {
        this.renderHeaderLocked();
        return;
      }

      const profileName = document.getElementById('active-profile-name');
      if (profileName && this.currentProfile) {
        profileName.textContent = this.currentProfile.nome || 'Gestão Restrita';
      }

      const btnChangeProfile = document.getElementById('btn-change-profile');
      if (btnChangeProfile) {
        btnChangeProfile.style.display = 'inline-flex';
        btnChangeProfile.innerHTML = ' Sair da Gestão';
        btnChangeProfile.onclick = () => {
          sessionStorage.removeItem('abib_manager_logged');
          sessionStorage.removeItem('abib_module_logged_comensais');
          sessionStorage.removeItem('abib_module_logged_hortifruti');
          this.renderManagerLoginView(targetModule);
        };
      }

      const btnHome = document.getElementById('btn-go-home');
      if (btnHome) {
        btnHome.classList.add('locked-brand');
        btnHome.style.cursor = 'default';
        btnHome.removeAttribute('title');
        btnHome.onclick = (e) => {
          if (e) e.preventDefault();
        };
      }
    }

    renderHeaderLocked() {
      const btnChangeProfile = document.getElementById('btn-change-profile');
      if (btnChangeProfile) {
        btnChangeProfile.style.display = 'none';
      }

      const btnHome = document.getElementById('btn-go-home');
      if (btnHome) {
        btnHome.classList.add('locked-brand');
        btnHome.style.cursor = 'default';
        btnHome.removeAttribute('title');
        btnHome.onclick = (e) => {
          if (e) e.preventDefault();
        };
      }
    }

    async promptMasterPINAccess() {
      this.renderManagerLoginView();
    }

    renderTokenInvalidView() {
      const container = document.getElementById('main-view-container');
      if (!container) return;
      container.innerHTML = `
        <div class="admin-auth-overlay">
          <div class="admin-auth-card">
            <div class="auth-icon"></div>
            <h2>Link ou Token Inválido</h2>
            <p class="subtitle">O link de acesso desta unidade é inválido ou foi revogado.</p>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Solicite um novo link de acesso direto ao seu gestor da ABIB.</p>

            <button id="btn-unlock-master-invalid" class="btn btn-primary btn-block">Entrar com Senha Máster de Gerente</button>
          </div>
        </div>
      `;

      container.querySelector('#btn-unlock-master-invalid').onclick = async () => {
        this.renderManagerLoginView();
      };
    }

    isAdminRoute() {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return path.endsWith('/admin') || path.endsWith('/admin/') || hash === '#admin' || hash === '#/admin';
    }

    checkHashRoute() {
      if (this.isAdminRoute()) {
        this.switchView('admin');
      } else {
        this.renderApp();
      }
    }

    async renderApp() {
      await this.renderHeader();
      this.switchView(this.currentView);
    }

    async renderHeader() {
      const profileName = document.getElementById('active-profile-name');

      if (profileName && this.currentProfile) {
        profileName.textContent = this.currentProfile.nome || 'Gestão';
      }

      const btnChangeProfile = document.getElementById('btn-change-profile');
      if (btnChangeProfile) {
        btnChangeProfile.style.display = 'inline-flex';
        btnChangeProfile.innerHTML = ' Sair da Gestão';
        btnChangeProfile.onclick = () => {
          sessionStorage.removeItem('abib_manager_logged');
          sessionStorage.removeItem('abib_module_logged_comensais');
          sessionStorage.removeItem('abib_module_logged_hortifruti');
          this.renderManagerLoginView();
        };
      }

      const btnAdmin = document.getElementById('btn-open-admin');
      if (btnAdmin) {
        btnAdmin.style.display = 'inline-flex';
        btnAdmin.onclick = () => {
          this.switchView('admin');
        };
      }

      const btnHome = document.getElementById('btn-go-home');
      if (btnHome) {
        btnHome.classList.remove('locked-brand');
        btnHome.style.cursor = 'pointer';
        btnHome.title = 'Ir para início';
        btnHome.onclick = () => {
          this.switchView('dashboard');
        };
      }
    }

    async switchView(viewName) {
      if (this.lockedModule && viewName === 'dashboard') {
        viewName = this.lockedModule;
      }

      // Checagem de autorização por destino
      if (viewName === 'dashboard' && !this.isAuthorized(null)) {
        this.renderManagerLoginView(null);
        return;
      } else if ((viewName === 'comensais' || viewName === 'comensais-relatorios') && !this.isAuthorized('comensais')) {
        this.renderManagerLoginView('comensais');
        return;
      } else if (viewName === 'hortifruti' && !this.lockedUnit && !this.isAuthorized('hortifruti')) {
        this.renderManagerLoginView('hortifruti');
        return;
      }

      this.currentView = viewName;
      const viewContainer = document.getElementById('main-view-container');
      if (!viewContainer) return;
      viewContainer.innerHTML = '';

      if (viewName === 'dashboard') {
        this.renderDashboard(viewContainer);
      } else if (viewName === 'comensais') {
        await this.comensaisModule.render(viewContainer, this.currentProfile);
      } else if (viewName === 'comensais-relatorios') {
        await this.comensaisReportView.render(viewContainer, this.currentProfile);
      } else if (viewName === 'hortifruti') {
        await this.hortifrutiModule.render(viewContainer, this.currentProfile, this.lockedUnit);
      } else if (viewName === 'admin') {
        this.adminPanel.render(viewContainer);
      }
    }

    renderDashboard(container) {
      let allowedModules = (this.currentProfile && this.currentProfile.modulos) || ['comensais', 'hortifruti'];
      if (!allowedModules.includes('hortifruti')) {
        allowedModules = [...allowedModules, 'hortifruti'];
        if (this.currentProfile) {
          this.currentProfile.modulos = allowedModules;
        }
      }

      let modulesHTML = '';
      if (allowedModules.includes('comensais')) {
        modulesHTML += `
          <div class="card-module-primary" id="card-modulo-comensais">
            <span class="tag-active-module">Módulo Ativo</span>
            <div class="module-card-info">
              <h3>Comensais Diários</h3>
              <p>Registro diário das 21 unidades, controle de status, alertas de variação e envio formatado para WhatsApp.</p>
            </div>
          </div>
        `;
      }

      if (allowedModules.includes('hortifruti')) {
        modulesHTML += `
          <div class="card-module-primary" id="card-modulo-hortifruti">
            <span class="tag-active-module">Módulo Ativo</span>
            <div class="module-card-info">
              <h3>Hortifrúti Semanal</h3>
              <p>Cotação comparativa (Sacolão x Mart Minas), apoio a pedidos e auditoria mensal de NFs.</p>
            </div>
          </div>
        `;
      }

      if (allowedModules.includes('pratos')) {
        modulesHTML += `
          <div class="card-module-primary" id="card-modulo-pratos">
            <span class="tag-active-module">Módulo Ativo</span>
            <div class="module-card-info">
              <h3>Inventário de Pratos & Louças</h3>
              <p>Módulo de controle de estoque de talheres danificados e louças por unidade.</p>
            </div>
          </div>
        `;
      }

      if (allowedModules.includes('precos')) {
        modulesHTML += `
          <div class="card-module-primary" id="card-modulo-precos">
            <span class="tag-active-module">Módulo Ativo</span>
            <div class="module-card-info">
              <h3>Preços & Custos por Unidade</h3>
              <p>Módulo de acompanhamento de preços de refeições e insumos.</p>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="dashboard-welcome">
          <h2>Selecione um Módulo para iniciar:</h2>
        </div>

        <div class="modules-cards-grid">
          ${modulesHTML || '<p class="subtitle" style="padding: 20px 0;">Nenhum módulo liberado para este perfil.</p>'}
        </div>
      `;

      const cardComensais = container.querySelector('#card-modulo-comensais');
      if (cardComensais) {
        cardComensais.onclick = () => this.switchView('comensais');
      }

      const cardHortifruti = container.querySelector('#card-modulo-hortifruti');
      if (cardHortifruti) {
        cardHortifruti.onclick = () => this.switchView('hortifruti');
      }
    }
  }

  // Inicialização no DOM
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
  });

})();
