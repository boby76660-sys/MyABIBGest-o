/**
 * Comensais View - Form de Registro Diário Rápido das 21 Unidades
 */

import { BaseModule } from '../moduleRegistry.js';
import { getStatusUnidadesNoDia, saveComensaisRegistro, generateWhatsAppSummary, checkDiscrepanciaAlert } from '../../services/comensaisService.js';
import { getPublicos, getUnidades } from '../../services/adminService.js';

export class ComensaisModule extends BaseModule {
  constructor() {
    super('comensais', 'Comensais Diários', '🍽️', 'Registro rápido de refeições vendidas por unidade e público.');
    this.currentDate = new Date().toISOString().split('T')[0];
    this.filterStatus = 'todos'; // todos | pendente | concluido
    this.searchQuery = '';
    this.currentProfile = null;
  }

  async render(container, currentProfile) {
    this.currentProfile = currentProfile;
    this.container = container;
    
    container.innerHTML = `
      <div class="module-header">
        <div class="header-titles">
          <h2>🍽️ Registro de Comensais Diários</h2>
          <p class="subtitle">Lançamento rápido no celular ao final do expediente</p>
        </div>
        <div class="header-actions">
          <button id="btn-whatsapp" class="btn btn-whatsapp">
            <span>📱</span> Copiar p/ WhatsApp
          </button>
          <button id="btn-relatorios" class="btn btn-secondary">
            <span>📊</span> Histórico e Relatórios
          </button>
        </div>
      </div>

      <div class="date-and-filter-bar">
        <div class="date-picker-group">
          <label for="input-data-comensais">📆 Data:</label>
          <input type="date" id="input-data-comensais" class="input-date" value="${this.currentDate}">
        </div>

        <div class="search-group">
          <input type="text" id="input-search-unidades" class="input-search" placeholder="🔍 Buscar loja/unidade...">
        </div>

        <div class="filter-pills">
          <button class="pill ${this.filterStatus === 'todos' ? 'active' : ''}" data-filter="todos">Todos (<span id="count-todos">0</span>)</button>
          <button class="pill pill-pending ${this.filterStatus === 'pendente' ? 'active' : ''}" data-filter="pendente">🔴 Pendentes (<span id="count-pendentes">0</span>)</button>
          <button class="pill pill-success ${this.filterStatus === 'concluido' ? 'active' : ''}" data-filter="concluido">🟢 Concluídos (<span id="count-concluidos">0</span>)</button>
        </div>
      </div>

      <div id="unidades-cards-container" class="cards-grid-vertical">
        <div class="loading-spinner">Carregando unidades...</div>
      </div>

      <!-- Modal WhatsApp -->
      <div id="modal-whatsapp" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h3>📱 Resumo Formatado para WhatsApp</h3>
            <button class="btn-close-modal">&times;</button>
          </div>
          <div class="modal-body">
            <textarea id="whatsapp-preview-text" readonly class="whatsapp-textarea"></textarea>
          </div>
          <div class="modal-footer">
            <button id="btn-copiar-whatsapp" class="btn btn-primary btn-block">📋 Copiar Texto para o WhatsApp</button>
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
      p.addEventListener('click', (e) => {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        this.filterStatus = p.getAttribute('data-filter');
        this.renderCards();
      });
    });

    // Botão WhatsApp
    const btnWhatsapp = this.container.querySelector('#btn-whatsapp');
    btnWhatsapp.addEventListener('click', async () => {
      const texto = await generateWhatsAppSummary(this.currentDate);
      const modal = this.container.querySelector('#modal-whatsapp');
      const textarea = this.container.querySelector('#whatsapp-preview-text');
      textarea.value = texto;
      modal.classList.remove('hidden');
    });

    // Botão Fechar Modal
    const btnCloseModal = this.container.querySelector('.btn-close-modal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        this.container.querySelector('#modal-whatsapp').classList.add('hidden');
      });
    }

    // Botão Copiar WhatsApp
    const btnCopiar = this.container.querySelector('#btn-copiar-whatsapp');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', () => {
        const textarea = this.container.querySelector('#whatsapp-preview-text');
        textarea.select();
        document.execCommand('copy');
        alert("✅ Resumo copiado para a área de transferência! Cole no grupo do WhatsApp.");
        this.container.querySelector('#modal-whatsapp').classList.add('hidden');
      });
    }

    // Botão Relatórios
    const btnRelatorios = this.container.querySelector('#btn-relatorios');
    btnRelatorios.addEventListener('click', () => {
      window.app.switchView('comensais-relatorios');
    });
  }

  async loadData() {
    this.publicos = await getPublicos();
    this.publicosAtivos = this.publicos.filter(p => p.ativo !== false);
    this.statusLista = await getStatusUnidadesNoDia(this.currentDate);
    
    // Atualizar Contadores das Pills
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
      grid.innerHTML = `<div class="empty-state">Nenhuma unidade encontrada.</div>`;
      return;
    }

    filtrados.forEach(item => {
      const u = item.unidade;
      const reg = item.registro || { publicos: {}, observacao: '' };
      const statusBadge = item.status === 'concluido' ? `<span class="badge badge-success">🟢 Concluído (${item.totalComensais})</span>` : `<span class="badge badge-pending">🔴 Pendente</span>`;

      const card = document.createElement('div');
      card.className = `unidade-card ${item.status === 'concluido' ? 'card-done' : ''}`;
      
      // Conforme o pedido do usuário: Na lista de comensais, mostra APENAS o nome da loja/unidade (ex: MONTES CLAROS II)
      card.innerHTML = `
        <div class="card-header-compact">
          <div class="card-unit-title">
            <h3>${u.loja}</h3>
          </div>
          <div class="card-status-area">
            ${statusBadge}
          </div>
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
              <input type="text" class="input-obs" name="observacao" value="${reg.observacao || ''}" placeholder="📝 Observação (ex: evento, chuva)...">
              <button type="submit" class="btn btn-save-unit">
                <span>💾</span> Salvar
              </button>
            </div>
            <div class="alert-discrepancia-container"></div>
          </form>
        </div>
      `;

      // Evento de submit para salvar a unidade individualmente
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

        // Verificar Discrepância
        const alerta = await checkDiscrepanciaAlert(u.id, totalVal);
        const alertaBox = card.querySelector('.alert-discrepancia-container');
        if (alerta) {
          alertaBox.innerHTML = `
            <div class="alert-banner alert-warning">
              ⚠️ <strong>Atenção:</strong> O total (${totalVal}) está ${alerta.difPct > 0 ? '+' : ''}${alerta.difPct}% em relação à média habitual (${alerta.media}) desta unidade.
            </div>
          `;
        } else {
          alertaBox.innerHTML = '';
        }

        // Recarregar dados para atualizar badges
        await this.loadData();
      });

      grid.appendChild(card);
    });
  }
}
