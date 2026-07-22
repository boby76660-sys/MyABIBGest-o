/**
 * ABIB Gestão - JavaScript Bundle Unificado (Versão Corporativa Executiva - Sem Bordas Unilaterais)
 */

(function () {
  'use strict';

  // --- 1. CONFIGURAÇÃO E DADOS INICIAIS (SEEDS) ---
  const DEFAULT_ADMIN_PASSWORD = "admin123";

  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCLrj5WzSgu-wGU5bBAMeom-P3vH8hZHHQ",
    databaseURL: "https://myabib-gestao-default-rtdb.firebaseio.com/",
    projectId: "myabib-gestao",
    authDomain: "myabib-gestao.firebaseapp.com",
    storageBucket: "myabib-gestao.appspot.com"
  };

  const PUBLICOS_SEED = [
    { id: "pub_ticket", nome: "Ticket", ordem: 1, ativo: true },
    { id: "pub_garra", nome: "Garra / Estrela D'Alva", ordem: 2, ativo: true },
    { id: "pub_promotores", nome: "Promotores ou Motorista (Pix/Cartão)", ordem: 3, ativo: true }
  ];

  const UNIDADES_SEED = [
    { id: "u239", codigo: "239", grupo: "AC", loja: "ITABIRA", unidade: "MATRIZ", cnpj: "44.509.964/0001-35", ordem: 1, ativo: true },
    { id: "u220", codigo: "220", grupo: "AC", loja: "UBÁ", unidade: "FILIAL 1", cnpj: "44.509.964/0002-16", ordem: 2, ativo: true },
    { id: "u253", codigo: "253", grupo: "AC", loja: "JUIZ DE FORA II", unidade: "FILIAL 2", cnpj: "44.509.964/0003-05", ordem: 3, ativo: true },
    { id: "u206", codigo: "206", grupo: "AC", loja: "JUIZ DE FORA I", unidade: "FILIAL 3", cnpj: "44.509.964/0004-88", ordem: 4, ativo: true },
    { id: "u230", codigo: "230", grupo: "AC", loja: "BARBACENA", unidade: "FILIAL 4", cnpj: "44.509.964/0005-69", ordem: 5, ativo: true },
    { id: "u257", codigo: "257", grupo: "AC", loja: "CONGONHAS", unidade: "FILIAL 5", cnpj: "44.509.964/0006-40", ordem: 6, ativo: true },
    { id: "u234", codigo: "234", grupo: "AC", loja: "CONSELHEIRO LAFAIETE", unidade: "FILIAL 6", cnpj: "44.509.964/0007-20", ordem: 7, ativo: true },
    { id: "u241", codigo: "241", grupo: "AC", loja: "SÃO JOÃO DEL REI", unidade: "FILIAL 7", cnpj: "44.509.964/0008-01", ordem: 8, ativo: true },
    { id: "u217", codigo: "217", grupo: "ABIB", loja: "SANTANA DO PARAÍSO", unidade: "MATRIZ", cnpj: "25.191.364/0001-27", ordem: 9, ativo: true },
    { id: "u244", codigo: "244", grupo: "ABIB", loja: "JOÃO MONLEVADE", unidade: "FILIAL 1", cnpj: "25.191.364/0002-08", ordem: 10, ativo: true },
    { id: "u255", codigo: "255", grupo: "ABIB", loja: "LEOPOLDINA", unidade: "FILIAL 2", cnpj: "25.191.364/0003-99", ordem: 11, ativo: true },
    { id: "u256", codigo: "256", grupo: "ABIB", loja: "CARATINGA", unidade: "FILIAL 3", cnpj: "25.191.364/0004-70", ordem: 12, ativo: true },
    { id: "u224", codigo: "224", grupo: "ABIB", loja: "PARACATU", unidade: "FILIAL 4", cnpj: "25.191.364/0005-50", ordem: 13, ativo: true },
    { id: "u240", codigo: "240", grupo: "ABIB", loja: "UNAÍ", unidade: "FILIAL 5", cnpj: "25.191.364/0006-31", ordem: 14, ativo: true },
    { id: "u219", codigo: "219", grupo: "MOC", loja: "MONTES CLAROS I", unidade: "MATRIZ", cnpj: "50.940.370/0001-87", ordem: 15, ativo: true },
    { id: "u259", codigo: "259", grupo: "MOC", loja: "MONTES CLAROS II", unidade: "FILIAL 1", cnpj: "50.940.370/0002-68", ordem: 16, ativo: true },
    { id: "u260", codigo: "260", grupo: "MOC", loja: "MONTES CLAROS III", unidade: "FILIAL 2", cnpj: "50.940.370/0003-49", ordem: 17, ativo: true },
    { id: "u250", codigo: "250", grupo: "MOC", loja: "JANAÚBA", unidade: "FILIAL 3", cnpj: "50.940.370/0004-20", ordem: 18, ativo: true },
    { id: "u267", codigo: "267", grupo: "MOC", loja: "CURVELO", unidade: "FILIAL 4", cnpj: "50.940.370/0005-00", ordem: 19, ativo: true },
    { id: "u272", codigo: "272", grupo: "MOC", loja: "PIRAPORA", unidade: "FILIAL 5", cnpj: "50.940.370/0006-91", ordem: 20, ativo: true },
    { id: "u274", codigo: "274", grupo: "MOC", loja: "JANUÁRIA", unidade: "FILIAL 6", cnpj: "50.940.370/0007-72", ordem: 21, ativo: true }
  ];

  const PERFIS_SEED = [
    {
      id: "p_nutri_geral",
      nome: "Nutricionista Geral",
      descricao: "Lançamento diário de comensais e acompanhamento de todas as 21 unidades.",
      icone: "",
      modulos: ["comensais"],
      permissoesCamposUnidade: ["loja"]
    },
    {
      id: "p_nutri_gestora",
      nome: "Nutricionista Gestora",
      descricao: "Acompanhamento regional e suporte às unidades de sua responsabilidade.",
      icone: "",
      modulos: ["comensais"],
      permissoesCamposUnidade: ["loja", "grupo", "unidade"]
    },
    {
      id: "p_diretoria",
      nome: "Gestão & Diretoria",
      descricao: "Relatórios consolidados, dados fiscais e detalhamento completo de empresas.",
      icone: "",
      modulos: ["comensais"],
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
    }
  ];

  // --- 2. FIREBASE CLIENT ---
  let rtdb = null;
  let isFirebaseActive = false;

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
        console.log("Firebase Realtime Database conectado.");
        return true;
      }
    } catch (err) {
      console.error("Erro Firebase:", err);
      isFirebaseActive = false;
      return false;
    }
  }

  function getRealtimeDB() { return rtdb; }
  function checkIsFirebaseActive() { return isFirebaseActive; }

  function withTimeout(promise, ms = 2000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Timeout Firebase")), ms);
      promise.then(res => { clearTimeout(timer); resolve(res); })
             .catch(err => { clearTimeout(timer); reject(err); });
    });
  }

  // --- 3. STORAGE SERVICE ---
  const STORAGE_KEYS = {
    UNIDADES: 'abib_gestao_unidades',
    PUBLICOS: 'abib_gestao_publicos',
    PERFIS: 'abib_gestao_perfis',
    MODULOS: 'abib_gestao_modulos',
    COMENSAIS: 'abib_gestao_comensais',
    CONFIG: 'abib_gestao_config'
  };

  function seedInitialData() {
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
        firebaseConfig: DEFAULT_FIREBASE_CONFIG
      }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMENSAIS)) {
      localStorage.setItem(STORAGE_KEYS.COMENSAIS, JSON.stringify([]));
    }
  }

  async function getCollection(key) {
    seedInitialData();

    if (checkIsFirebaseActive()) {
      try {
        const db = getRealtimeDB();
        const snapshot = await withTimeout(db.ref(key).once('value'), 2000);
        const val = snapshot.val();
        if (val) {
          const docs = Array.isArray(val) ? val.filter(Boolean) : Object.values(val);
          localStorage.setItem(key, JSON.stringify(docs));
          return docs;
        }
      } catch (e) {
        console.warn(`[StorageService] Cache local (${key}).`);
      }
    }

    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async function saveCollection(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
    if (checkIsFirebaseActive()) {
      try {
        const db = getRealtimeDB();
        db.ref(key).set(items).catch(err => console.warn("Erro ao salvar no Firebase:", err));
      } catch (e) {
        console.error("Erro salvando coleção:", e);
      }
    }
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
    const config = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return config ? JSON.parse(config) : {};
  }

  async function saveConfig(newConfig) {
    const current = await getConfig();
    const updated = { ...current, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));

    if (checkIsFirebaseActive()) {
      try {
        const db = getRealtimeDB();
        db.ref('configuracoes').set(updated);
      } catch (e) {}
    }
    return updated;
  }

  // --- 4. ADMIN SERVICE ---
  async function getUnidades() {
    const unidades = await getCollection(STORAGE_KEYS.UNIDADES);
    return unidades.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  async function saveUnidade(unidadeData) {
    const unidades = await getUnidades();
    if (!unidadeData.id) {
      unidadeData.id = 'u_' + Date.now();
      unidadeData.ordem = unidades.length + 1;
      unidadeData.ativo = true;
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

  async function getPerfis() { return await getCollection(STORAGE_KEYS.PERFIS); }

  async function savePerfil(perfilData) {
    if (!perfilData.id) perfilData.id = 'p_' + Date.now();
    if (!perfilData.permissoesCamposUnidade) perfilData.permissoesCamposUnidade = ['loja'];
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

  // --- 5. COMENSAIS SERVICE ---
  async function saveComensaisRegistro(registroData) {
    const id = `reg_${registroData.data}_${registroData.unidadeId}`;
    return await saveDoc(STORAGE_KEYS.COMENSAIS, {
      id,
      ...registroData,
      atualizadoEm: new Date().toISOString()
    });
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
      const hasData = reg && reg.publicos && Object.values(reg.publicos).some(val => val !== null && val !== undefined && val !== '');
      
      let totalComensais = 0;
      if (hasData) {
        Object.values(reg.publicos).forEach(v => totalComensais += parseInt(v || 0, 10));
      }

      return {
        unidade: u,
        registro: reg || null,
        status: hasData ? 'concluido' : 'pendente',
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

    statusLista.forEach(item => {
      if (item.status === 'concluido') {
        concluidasCount++;
        totalGeralEmpresa += item.totalComensais;
        texto += `[CONCLUÍDO] ${item.unidade.loja}: ${item.totalComensais} comensais\n`;
        const partes = [];
        publicosAtivos.forEach(p => {
          const qtd = item.registro && item.registro.publicos ? (item.registro.publicos[p.id] || 0) : 0;
          if (qtd > 0) partes.push(`${p.nome}: ${qtd}`);
        });
        if (partes.length > 0) texto += `   └ ${partes.join(' | ')}\n`;
        if (item.observacao) texto += `   └ Obs: ${item.observacao}\n`;
      } else {
        texto += `[PENDENTE] ${item.unidade.loja}\n`;
      }
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

    const filtrados = todos.filter(r => r.data >= inicioISO && r.data <= fimISO);

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

  // --- 6. PERFIL MANAGER ---
  const ACTIVE_PROFILE_KEY = 'abib_gestao_active_profile_id';

  async function getActiveProfile() {
    const perfis = await getPerfis();
    const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (savedId) {
      const found = perfis.find(p => p.id === savedId);
      if (found) return found;
    }
    return null;
  }

  function setActiveProfileId(profileId) {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }

  async function renderProfileSelectorModal(onProfileSelectedCallback) {
    const perfis = await getPerfis();
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'profile-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="profile-modal-card">
        <div class="profile-modal-header">
          <h2>Acesso ao Sistema de Gestão ABIB</h2>
          <p class="subtitle">Selecione seu Perfil de Acesso para continuar:</p>
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

    modalOverlay.querySelectorAll('.btn-profile-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-profile-id');
        setActiveProfileId(id);
        document.body.removeChild(modalOverlay);
        if (onProfileSelectedCallback) {
          const selected = perfis.find(p => p.id === id);
          onProfileSelectedCallback(selected);
        }
      });
    });
  }

  // --- 7. COMENSAIS VIEW ---
  class ComensaisModuleView {
    constructor() {
      this.id = 'comensais';
      this.name = 'Comensais Diários';
      this.currentDate = new Date().toISOString().split('T')[0];
      this.filterStatus = 'todos';
      this.searchQuery = '';
    }

    async render(container, currentProfile) {
      this.currentProfile = currentProfile;
      this.container = container;

      container.innerHTML = `
        <div class="module-header">
          <div class="header-titles">
            <h2>Registro de Comensais Diários</h2>
            <p class="subtitle">Lançamento de refeições por unidade e categoria</p>
          </div>
          <div class="header-actions">
            <button id="btn-whatsapp" class="btn btn-whatsapp">Copiar para WhatsApp</button>
            <button id="btn-relatorios" class="btn btn-secondary">Histórico e Relatórios</button>
          </div>
        </div>

        <div class="date-and-filter-bar">
          <div class="date-picker-group">
            <label for="input-data-comensais">Data:</label>
            <input type="date" id="input-data-comensais" class="input-date" value="${this.currentDate}">
          </div>
          <div class="search-group">
            <input type="text" id="input-search-unidades" class="input-search" placeholder="Buscar unidade ou loja...">
          </div>
          <div class="filter-pills">
            <button class="pill ${this.filterStatus === 'todos' ? 'active' : ''}" data-filter="todos">Todas (<span id="count-todos">0</span>)</button>
            <button class="pill pill-pending ${this.filterStatus === 'pendente' ? 'active' : ''}" data-filter="pendente"><span class="status-dot dot-pending"></span> Pendentes (<span id="count-pendentes">0</span>)</button>
            <button class="pill pill-success ${this.filterStatus === 'concluido' ? 'active' : ''}" data-filter="concluido"><span class="status-dot dot-success"></span> Concluídas (<span id="count-concluidos">0</span>)</button>
          </div>
        </div>

        <div id="unidades-cards-container" class="cards-grid-vertical">
          <div class="loading-spinner">Carregando unidades...</div>
        </div>

        <!-- Modal WhatsApp -->
        <div id="modal-whatsapp" class="modal hidden">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Resumo Formatado para WhatsApp</h3>
              <button class="btn-close-modal">&times;</button>
            </div>
            <div class="modal-body">
              <textarea id="whatsapp-preview-text" readonly class="whatsapp-textarea"></textarea>
            </div>
            <div class="modal-footer">
              <button id="btn-copiar-whatsapp" class="btn btn-primary btn-block">Copiar Texto para WhatsApp</button>
            </div>
          </div>
        </div>
      `;

      this.bindEvents();
      await this.loadData();
    }

    bindEvents() {
      const inputData = this.container.querySelector('#input-data-comensais');
      inputData.addEventListener('change', async (e) => {
        this.currentDate = e.target.value;
        await this.loadData();
      });

      const inputSearch = this.container.querySelector('#input-search-unidades');
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderCards();
      });

      const pills = this.container.querySelectorAll('.pill');
      pills.forEach(p => {
        p.addEventListener('click', () => {
          pills.forEach(x => x.classList.remove('active'));
          p.classList.add('active');
          this.filterStatus = p.getAttribute('data-filter');
          this.renderCards();
        });
      });

      const btnWhatsapp = this.container.querySelector('#btn-whatsapp');
      btnWhatsapp.addEventListener('click', async () => {
        const texto = await generateWhatsAppSummary(this.currentDate);
        const modal = this.container.querySelector('#modal-whatsapp');
        const textarea = this.container.querySelector('#whatsapp-preview-text');
        textarea.value = texto;
        modal.classList.remove('hidden');
      });

      const btnCloseModal = this.container.querySelector('.btn-close-modal');
      if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
          this.container.querySelector('#modal-whatsapp').classList.add('hidden');
        });
      }

      const btnCopiar = this.container.querySelector('#btn-copiar-whatsapp');
      if (btnCopiar) {
        btnCopiar.addEventListener('click', () => {
          const textarea = this.container.querySelector('#whatsapp-preview-text');
          textarea.select();
          document.execCommand('copy');
          alert("Resumo copiado para a área de transferência!");
          this.container.querySelector('#modal-whatsapp').classList.add('hidden');
        });
      }

      const btnRelatorios = this.container.querySelector('#btn-relatorios');
      btnRelatorios.addEventListener('click', () => {
        window.app.switchView('comensais-relatorios');
      });
    }

    async loadData() {
      this.publicos = await getPublicos();
      this.publicosAtivos = this.publicos.filter(p => p.ativo !== false);
      this.statusLista = await getStatusUnidadesNoDia(this.currentDate);

      const pendentesCount = this.statusLista.filter(x => x.status === 'pendente').length;
      const concluidosCount = this.statusLista.filter(x => x.status === 'concluido').length;

      this.container.querySelector('#count-todos').textContent = this.statusLista.length;
      this.container.querySelector('#count-pendentes').textContent = pendentesCount;
      this.container.querySelector('#count-concluidos').textContent = concluidosCount;

      this.renderCards();
    }

    renderCards() {
      const grid = this.container.querySelector('#unidades-cards-container');
      grid.innerHTML = '';

      const filtrados = this.statusLista.filter(item => {
        const u = item.unidade;
        const matchSearch = !this.searchQuery || u.loja.toLowerCase().includes(this.searchQuery) || u.grupo.toLowerCase().includes(this.searchQuery);
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
                  const val = reg.publicos && reg.publicos[p.id] !== undefined ? reg.publicos[p.id] : '';
                  return `
                    <div class="input-publico-item">
                      <label>${p.nome}</label>
                      <input type="number" inputmode="numeric" pattern="[0-9]*" class="input-comensal-num" name="${p.id}" value="${val}" placeholder="0" min="0">
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="obs-and-actions">
                <input type="text" class="input-obs" name="observacao" value="${reg.observacao || ''}" placeholder="Observação (ex: evento especial, falta de energia)...">
                <button type="submit" class="btn btn-save-unit">Salvar</button>
              </div>
              <div class="alert-discrepancia-container" style="margin-top: 8px;"></div>
            </form>
          </div>
        `;

        const form = card.querySelector('.form-comensais-unidade');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const publicosValues = {};
          let totalVal = 0;

          this.publicosAtivos.forEach(p => {
            const rawVal = formData.get(p.id);
            const num = rawVal !== '' && rawVal !== null ? parseInt(rawVal, 10) : 0;
            publicosValues[p.id] = num;
            totalVal += num;
          });

          const observacao = formData.get('observacao') || '';

          await saveComensaisRegistro({
            data: this.currentDate,
            unidadeId: u.id,
            publicos: publicosValues,
            observacao
          });

          const alerta = await checkDiscrepanciaAlert(u.id, totalVal);
          const alertaBox = card.querySelector('.alert-discrepancia-container');
          if (alerta) {
            alertaBox.innerHTML = `
              <div style="padding: 8px 12px; background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 0.8rem; border-radius: 4px;">
                Atenção: O total (${totalVal}) está ${alerta.difPct > 0 ? '+' : ''}${alerta.difPct}% em relação à média habitual (${alerta.media}) desta unidade.
              </div>
            `;
          } else {
            alertaBox.innerHTML = '';
          }

          await this.loadData();
        });

        grid.appendChild(card);
      });
    }
  }

  // --- 8. COMENSAIS REPORT VIEW CORPORATIVO ---
  class ComensaisReportView {
    constructor(appController) {
      this.appController = appController;
      this.periodo = 'este_mes';
      this.dataInicio = '';
      this.dataFim = '';
    }

    async render(container, currentProfile) {
      this.currentProfile = currentProfile;
      this.container = container;
      this.setPeriodDates('este_mes');

      container.innerHTML = `
        <div class="module-header">
          <div class="header-titles">
            <h2>Relatório e Histórico de Comensais</h2>
            <p class="subtitle">Consolidado por período e detalhamento de empresas</p>
          </div>
          <div class="header-actions">
            <button id="btn-voltar-comensais" class="btn btn-secondary">Voltar ao Lançamento</button>
            <button id="btn-exportar-csv" class="btn btn-success">Exportar CSV / Excel</button>
            <button id="btn-ver-detalhes-unidades" class="btn btn-primary">Detalhamento das Unidades</button>
          </div>
        </div>

        <div class="date-and-filter-bar">
          <div class="filter-group" style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 0.8rem; font-weight: 700;">PERÍODO:</label>
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
            <input type="date" id="report-date-start" class="input-date">
            <input type="date" id="report-date-end" class="input-date">
          </div>
          <div class="filter-group">
            <select id="select-filtro-loja" class="select-field">
              <option value="todas">Todas as Unidades</option>
            </select>
          </div>
          <button id="btn-filtrar-relatorio" class="btn btn-primary">Filtrar</button>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><span class="kpi-title">Total de Refeições</span><span class="kpi-value" id="kpi-total-refeicoes">0</span></div>
          <div class="kpi-card"><span class="kpi-title">Média Diária</span><span class="kpi-value" id="kpi-media-diaria">0</span></div>
          <div class="kpi-card"><span class="kpi-title">Unidades Ativas</span><span class="kpi-value" id="kpi-unidades-ativas">0</span></div>
        </div>

        <div class="table-responsive-card">
          <table class="data-table" id="table-relatorio-comensais">
            <thead>
              <tr><th>Data</th><th>Loja / Unidade</th><th>Públicos Detalhados</th><th>Total Comensais</th><th>Observação</th><th>Ações</th></tr>
            </thead>
            <tbody><tr><td colspan="6" style="padding: 20px; text-align: center;">Carregando dados...</td></tr></tbody>
          </table>
        </div>

        <!-- Modal de Detalhes das Unidades -->
        <div id="modal-detalhes-unidades" class="modal hidden">
          <div class="modal-content modal-large">
            <div class="modal-header">
              <h3>Cadastro e Detalhamento Geral das Unidades</h3>
              <button class="btn-close-modal-unidades">&times;</button>
            </div>
            <div class="modal-body">
              <p class="subtitle" style="margin-bottom: 12px;">Campos visíveis para o perfil ativo: <strong>${currentProfile ? currentProfile.nome : 'Padrão'}</strong></p>
              <div class="table-responsive-card">
                <table class="data-table" id="table-detalhes-unidades-modal">
                  <thead><tr id="header-detalhes-unidades"></tr></thead>
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
        this.dataInicio = iso; this.dataFim = iso;
      } else if (type === 'ontem') {
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        const iso = yesterday.toISOString().split('T')[0];
        this.dataInicio = iso; this.dataFim = iso;
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
      btnVoltar.addEventListener('click', () => window.app.switchView('comensais'));

      const selectPeriodo = this.container.querySelector('#select-periodo');
      const customGroup = this.container.querySelector('.custom-date-group');

      selectPeriodo.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'personalizado') {
          customGroup.classList.remove('hidden');
        } else {
          customGroup.classList.add('hidden');
          this.setPeriodDates(val);
        }
      });

      const btnFiltrar = this.container.querySelector('#btn-filtrar-relatorio');
      btnFiltrar.addEventListener('click', async () => {
        if (selectPeriodo.value === 'personalizado') {
          this.dataInicio = this.container.querySelector('#report-date-start').value;
          this.dataFim = this.container.querySelector('#report-date-end').value;
        }
        await this.loadReportData();
      });

      const btnExport = this.container.querySelector('#btn-exportar-csv');
      btnExport.addEventListener('click', async () => {
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

      const btnVerDetalhes = this.container.querySelector('#btn-ver-detalhes-unidades');
      btnVerDetalhes.addEventListener('click', async () => await this.renderModalDetalhesUnidades());

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
        opt.value = u.id; opt.textContent = u.loja;
        select.appendChild(opt);
      });
    }

    async loadReportData() {
      const todos = await getCollection(STORAGE_KEYS.COMENSAIS);
      const unidades = await getUnidades();
      const publicos = await getPublicos();
      const unidadesMap = new Map(unidades.map(u => [u.id, u]));

      const lojaFiltro = this.container.querySelector('#select-filtro-loja').value;

      const filtrados = todos.filter(r => {
        const dateMatch = r.data >= this.dataInicio && r.data <= this.dataFim;
        const lojaMatch = lojaFiltro === 'todas' || r.unidadeId === lojaFiltro;
        return dateMatch && lojaMatch;
      }).sort((a, b) => b.data.localeCompare(a.data));

      let totalRefeicoes = 0;
      const datasSet = new Set();

      filtrados.forEach(r => {
        datasSet.add(r.data);
        if (r.publicos) Object.values(r.publicos).forEach(v => totalRefeicoes += parseInt(v || 0, 10));
      });

      const numDias = datasSet.size || 1;
      const mediaDiaria = Math.round(totalRefeicoes / numDias);

      this.container.querySelector('#kpi-total-refeicoes').textContent = totalRefeicoes.toLocaleString('pt-BR');
      this.container.querySelector('#kpi-media-diaria').textContent = mediaDiaria.toLocaleString('pt-BR');
      this.container.querySelector('#kpi-unidades-ativas').textContent = unidades.filter(u => u.ativo !== false).length;

      const tbody = this.container.querySelector('#table-relatorio-comensais tbody');
      tbody.innerHTML = '';

      if (filtrados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum registro encontrado no período selecionado.</td></tr>`;
        return;
      }

      filtrados.forEach(r => {
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
          <td><strong style="color: var(--primary);">${totalDoc}</strong></td>
          <td>${r.observacao || '-'}</td>
          <td><button class="btn btn-sm btn-secondary btn-editar-reg" data-id="${r.id}">Editar</button></td>
        `;

        tr.querySelector('.btn-editar-reg').addEventListener('click', () => window.app.switchView('comensais'));
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
  }

  // --- 9. ADMIN PANEL CORPORATIVO ---
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
        const masterPass = config.adminPassword || 'admin123';

        if (pass === masterPass) {
          this.isAuthenticated = true;
          this.renderPanelContent();
        } else {
          alert("Senha incorreta.");
        }
      });

      this.container.querySelector('#btn-cancel-admin').addEventListener('click', () => {
        window.app.switchView('dashboard');
      });
    }

    async renderPanelContent() {
      this.container.innerHTML = `
        <div class="admin-layout">
          <div class="admin-sidebar">
            <div class="admin-logo"><h3>Administração</h3></div>
            <nav class="admin-nav">
              <button class="nav-tab active" data-tab="unidades">Empresas e Unidades (${(await getUnidades()).length})</button>
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
      await this.loadTabContent('unidades');
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
        window.app.switchView('dashboard');
      });
    }

    async loadTabContent(tabKey) {
      const body = this.container.querySelector('#admin-tab-body');
      if (tabKey === 'unidades') await this.renderUnidadesTab(body);
      else if (tabKey === 'publicos') await this.renderPublicosTab(body);
      else if (tabKey === 'perfis') await this.renderPerfisTab(body);
      else if (tabKey === 'firebase') await this.renderFirebaseTab(body);
      else if (tabKey === 'backup') await this.renderBackupTab(body);
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
              <button class="btn-close-modal">&times;</button>
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

      body.querySelector('#btn-nova-unidade').addEventListener('click', () => {
        form.reset();
        body.querySelector('#edit-unidade-id').value = '';
        body.querySelector('#title-modal-unidade').textContent = 'Nova Unidade';
        modal.classList.remove('hidden');
      });

      body.querySelector('.btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));

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
        modal.classList.add('hidden');
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
        const nome = prompt("Nome da nova categoria de público:");
        if (nome) { await savePublico({ nome }); await this.renderPublicosTab(body); }
      });

      body.querySelectorAll('.btn-edit-pub').forEach(btn => {
        btn.addEventListener('click', async () => {
          const pub = publicos.find(x => x.id === btn.getAttribute('data-id'));
          if (pub) {
            const novoNome = prompt("Novo nome para o público:", pub.nome);
            if (novoNome) { await savePublico({ ...pub, nome: novoNome }); await this.renderPublicosTab(body); }
          }
        });
      });
    }

    async renderPerfisTab(body) {
      const perfis = await getPerfis();
      body.innerHTML = `
        <div class="tab-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3>Perfis de Acesso e Visibilidade de Campos</h3>
          <button id="btn-novo-perfil" class="btn btn-primary">+ Novo Perfil</button>
        </div>
        <p class="subtitle" style="margin-bottom: 16px;">Selecione quais campos das empresas ficam visíveis para cada perfil:</p>
        <div class="perfis-cards-grid">
          ${perfis.map(p => {
            const campos = p.permissoesCamposUnidade || ["loja"];
            return `
              <div class="card-perfil-admin">
                <div class="card-perfil-header" style="margin-bottom: 10px;">
                  <h4 style="font-size: 1rem; font-weight: 700;">${p.nome}</h4>
                  <p class="subtitle">${p.descricao || ''}</p>
                </div>
                <div class="field-permissions-box" style="margin-bottom: 12px;">
                  <h5 style="font-size: 0.78rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Campos Visíveis:</h5>
                  <div class="checkbox-grid" data-perfil-id="${p.id}">
                    <label><input type="checkbox" value="codigo" ${campos.includes('codigo') ? 'checked' : ''}> Código</label>
                    <label><input type="checkbox" value="grupo" ${campos.includes('grupo') ? 'checked' : ''}> Grupo (AC/ABIB/MOC)</label>
                    <label><input type="checkbox" value="loja" ${campos.includes('loja') ? 'checked' : ''}> Nome da Loja</label>
                    <label><input type="checkbox" value="unidade" ${campos.includes('unidade') ? 'checked' : ''}> Filial / Matriz</label>
                    <label><input type="checkbox" value="cnpj" ${campos.includes('cnpj') ? 'checked' : ''}> CNPJ</label>
                  </div>
                </div>
                <div class="card-perfil-actions" style="display: flex; gap: 8px;">
                  <button class="btn btn-sm btn-primary btn-save-perfil-perm" data-id="${p.id}">Salvar Permissões</button>
                  <button class="btn btn-sm btn-danger btn-del-perfil" data-id="${p.id}">Excluir</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      body.querySelector('#btn-novo-perfil').addEventListener('click', async () => {
        const nome = prompt("Nome do novo perfil:");
        if (nome) { await savePerfil({ nome, modulos: ['comensais'], permissoesCamposUnidade: ['loja', 'grupo'] }); await this.renderPerfisTab(body); }
      });

      body.querySelectorAll('.btn-save-perfil-perm').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const perfil = perfis.find(x => x.id === id);
          const box = body.querySelector(`.checkbox-grid[data-perfil-id="${id}"]`);
          const checked = Array.from(box.querySelectorAll('input:checked')).map(cb => cb.value);
          await savePerfil({ ...perfil, permissoesCamposUnidade: checked });
          alert(`Permissões salvas para o perfil ${perfil.nome}.`);
        });
      });

      body.querySelectorAll('.btn-del-perfil').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm("Excluir este perfil?")) { await deletePerfil(btn.getAttribute('data-id')); await this.renderPerfisTab(body); }
        });
      });
    }

    async renderFirebaseTab(body) {
      const config = await getConfig();
      const fb = config.firebaseConfig || DEFAULT_FIREBASE_CONFIG;
      body.innerHTML = `
        <div class="tab-header" style="margin-bottom: 16px;"><h3>Configuração do Google Firebase Realtime Database</h3></div>
        <form id="form-firebase-config" class="form-card" style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
          <div><label style="font-size: 0.8rem; font-weight: 600;">API Key (apiKey):*</label><input type="text" id="fb-apikey" class="input-field" value="${fb.apiKey || ''}"></div>
          <div><label style="font-size: 0.8rem; font-weight: 600;">Database URL (databaseURL):*</label><input type="text" id="fb-databaseurl" class="input-field" value="${fb.databaseURL || ''}"></div>
          <div><label style="font-size: 0.8rem; font-weight: 600;">Project ID (projectId):</label><input type="text" id="fb-projectid" class="input-field" value="${fb.projectId || ''}"></div>
          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 10px;">Salvar Credenciais</button>
        </form>
      `;

      body.querySelector('#form-firebase-config').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fbConfig = {
          apiKey: body.querySelector('#fb-apikey').value.trim(),
          databaseURL: body.querySelector('#fb-databaseurl').value.trim(),
          projectId: body.querySelector('#fb-projectid').value.trim()
        };
        await saveConfig({ firebaseConfig: fbConfig });
        initFirebase(fbConfig);
        alert("Configurações salvas.");
      });
    }

    async renderBackupTab(body) {
      body.innerHTML = `
        <div class="tab-header" style="margin-bottom: 16px;"><h3>Backup e Importação de Dados</h3></div>
        <div class="backup-grid" style="display: flex; gap: 16px; flex-wrap: wrap;">
          <div class="backup-card" style="background: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; flex: 1; min-width: 240px;">
            <h4>Exportar Backup Completo</h4>
            <p class="subtitle" style="margin-bottom: 12px;">Download em formato JSON.</p>
            <button id="btn-export-json" class="btn btn-primary">Download Backup JSON</button>
          </div>
          <div class="backup-card" style="background: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; flex: 1; min-width: 240px;">
            <h4>Restaurar Backup</h4>
            <p class="subtitle" style="margin-bottom: 12px;">Selecione um arquivo de backup salvo anteriormente.</p>
            <input type="file" id="input-import-json" accept=".json" class="input-file">
          </div>
        </div>
      `;

      body.querySelector('#btn-export-json').addEventListener('click', async () => {
        const data = await exportFullBackup();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url;
        link.setAttribute('download', `backup_gestao_abib_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      });

      body.querySelector('#input-import-json').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            try {
              await importFullBackup(JSON.parse(evt.target.result));
              alert("Backup restaurado!"); window.location.reload();
            } catch (err) { alert("Erro ao importar backup: " + err.message); }
          };
          reader.readAsText(file);
        }
      });
    }
  }

  // --- 10. APP CONTROLLER PRINCIPAL CORPORATIVO ---
  class AppController {
    constructor() {
      this.currentProfile = null;
      this.currentView = 'dashboard';
      this.comensaisModule = new ComensaisModuleView();
      this.comensaisReportView = new ComensaisReportView(this);
      this.adminPanel = new AdminPanel(this);
    }

    async init() {
      console.log("Inicializando Sistema de Gestão ABIB...");
      const config = await getConfig();
      if (config.firebaseConfig) {
        initFirebase(config.firebaseConfig);
      } else {
        initFirebase(DEFAULT_FIREBASE_CONFIG);
      }

      this.currentProfile = await getActiveProfile();

      if (!this.currentProfile) {
        await renderProfileSelectorModal((profile) => {
          this.currentProfile = profile;
          this.renderApp();
        });
      } else {
        this.renderApp();
      }
    }

    renderApp() {
      this.renderHeader();
      this.switchView(this.currentView);
    }

    renderHeader() {
      const profileBadge = document.getElementById('active-profile-badge');
      const profileName = document.getElementById('active-profile-name');

      if (profileBadge && profileName && this.currentProfile) {
        profileBadge.textContent = '';
        profileName.textContent = this.currentProfile.nome;
      }

      const btnChangeProfile = document.getElementById('btn-change-profile');
      if (btnChangeProfile) {
        btnChangeProfile.onclick = async () => {
          await renderProfileSelectorModal((profile) => {
            this.currentProfile = profile;
            this.renderApp();
          });
        };
      }

      const btnAdmin = document.getElementById('btn-open-admin');
      if (btnAdmin) { btnAdmin.onclick = () => this.switchView('admin'); }

      const btnHome = document.getElementById('btn-go-home');
      if (btnHome) { btnHome.onclick = () => this.switchView('dashboard'); }
    }

    async switchView(viewName) {
      this.currentView = viewName;
      const viewContainer = document.getElementById('main-view-container');
      viewContainer.innerHTML = '';

      if (viewName === 'dashboard') {
        this.renderDashboard(viewContainer);
      } else if (viewName === 'comensais') {
        await this.comensaisModule.render(viewContainer, this.currentProfile);
      } else if (viewName === 'comensais-relatorios') {
        await this.comensaisReportView.render(viewContainer, this.currentProfile);
      } else if (viewName === 'admin') {
        this.adminPanel.render(viewContainer);
      }
    }

    renderDashboard(container) {
      container.innerHTML = `
        <div class="dashboard-welcome">
          <h2>Selecione um Módulo para iniciar:</h2>
          <p class="subtitle">Módulos liberados para o perfil <strong>${this.currentProfile ? this.currentProfile.nome : 'Padrão'}</strong>:</p>
        </div>

        <div class="modules-cards-grid">
          <div class="card-module-primary" id="card-modulo-comensais">
            <span class="tag-active-module">Módulo Ativo</span>
            <div class="module-card-info">
              <h3>Comensais Diários</h3>
              <p>Registro diário das 21 unidades, controle de status, alertas de variação e envio formatado para WhatsApp.</p>
            </div>
          </div>

          <div class="card-module-disabled">
            <div class="module-card-info">
              <h3>Inventário de Pratos & Louças</h3>
              <p>Módulo de controle de estoque de talheres e louças por unidade.</p>
            </div>
            <span class="badge-soon">Em Breve</span>
          </div>

          <div class="card-module-disabled">
            <div class="module-card-info">
              <h3>Preços & Custos por Unidade</h3>
              <p>Módulo de acompanhamento de preços de refeições e insumos.</p>
            </div>
            <span class="badge-soon">Em Breve</span>
          </div>
        </div>
      `;

      const cardComensais = container.querySelector('#card-modulo-comensais');
      if (cardComensais) {
        cardComensais.onclick = () => this.switchView('comensais');
      }
    }
  }

  // Inicialização no DOM
  window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
    window.app.init();
  });

})();
