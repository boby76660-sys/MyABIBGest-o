/**
 * Comensais View - Form de Registro Diário Rápido das 21 Unidades
 * Suporta modo exclusivo travado por Token de Unidade ou Painel de Gestão Completo
 */

import { BaseModule } from '../moduleRegistry.js';
import { getStatusUnidadesNoDia, saveComensaisRegistro, generateWhatsAppSummary, checkDiscrepanciaAlert } from '../../services/comensaisService.js';
import { getPublicos, getUnidades, regenerateUnitToken } from '../../services/adminService.js';

export class ComensaisModule extends BaseModule {
  constructor() {
    super('comensais', 'Comensais Diários', '', 'Registro rápido de refeições vendidas por unidade e público.');
    this.currentDate = new Date().toISOString().split('T')[0];
    this.filterStatus = 'todos'; // todos | pendente | concluido
    this.searchQuery = '';
    this.currentProfile = null;
    this.lockedUnit = null;
  }

  async render(container, currentProfile, lockedUnit = null) {
    this.currentProfile = currentProfile;
    this.lockedUnit = lockedUnit || (window.app && window.app.lockedUnit);
    this.container = container;

    // Restrição de datas para perfil de operante (apenas hoje e ontem)
    const todayISO = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayISO = yesterdayDate.toISOString().split('T')[0];

    const isLocked = !!this.lockedUnit;
    const dateMin = isLocked ? yesterdayISO : '';
    const dateMax = isLocked ? todayISO : '';

    container.innerHTML = `
      ${isLocked ? `
        <div class="unit-lock-banner">
          <span> <strong>Mart Minas - ${this.lockedUnit.loja}</strong></span>
          <small style="margin-left: auto;">Grupo ${this.lockedUnit.grupo || '-'}</small>
        </div>
      ` : ''}

      <div class="module-header">
        <div class="header-titles">
          <h2> Registro de Comensais Diários</h2>
          <p class="subtitle">${isLocked ? `Unidade ${this.lockedUnit.loja} • Lançamento rápido no celular` : 'Gestão consolidada das 21 unidades, geração de links e relatórios'}</p>
        </div>
        <div class="header-actions">
          ${!isLocked ? `
            <button id="btn-links-whatsapp-unidades" class="btn btn-primary">
               Links WhatsApp das Lojas
            </button>
            <button id="btn-whatsapp" class="btn btn-whatsapp">
               Copiar Resumo Diário
            </button>
            <button id="btn-relatorios" class="btn btn-secondary">
               Histórico e Relatórios
            </button>
          ` : ''}
        </div>
      </div>

      <div class="date-and-filter-bar">
        <div class="date-picker-group">
          <label for="input-data-comensais">Data:</label>
          <input type="date" id="input-data-comensais" class="input-date" value="${this.currentDate}" ${dateMin ? `min="${dateMin}"` : ''} ${dateMax ? `max="${dateMax}"` : ''}>
        </div>

        ${!isLocked ? `
          <div class="search-group">
            <input type="text" id="input-search-unidades" class="input-search" placeholder="Buscar loja/unidade...">
          </div>

          <div class="filter-pills">
            <button class="pill ${this.filterStatus === 'todos' ? 'active' : ''}" data-filter="todos">Todos (<span id="count-todos">0</span>)</button>
            <button class="pill pill-pending ${this.filterStatus === 'pendente' ? 'active' : ''}" data-filter="pendente">Pendentes (<span id="count-pendentes">0</span>)</button>
            <button class="pill pill-success ${this.filterStatus === 'concluido' ? 'active' : ''}" data-filter="concluido">🟢 Concluídos (<span id="count-concluidos">0</span>)</button>
          </div>
        ` : ''}
      </div>

      <div id="unidades-cards-container" class="cards-grid-vertical">
        <div class="loading-spinner">Carregando unidades...</div>
      </div>

      <!-- Modal WhatsApp Links das 21 Lojas -->
      ${!isLocked ? `
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
              <button id="btn-copiar-whatsapp" class="btn btn-primary btn-block">Copiar Texto para o WhatsApp</button>
            </div>
          </div>
        </div>
      ` : ''}
    `;

    this.bindEvents();
    await this.loadData();
  }

  bindEvents() {
    const inputData = this.container.querySelector('#input-data-comensais');
    if (inputData) {
      inputData.addEventListener('change', async (e) => {
        this.currentDate = e.target.value;
        await this.loadData();
      });
    }

    const inputSearch = this.container.querySelector('#input-search-unidades');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderCards();
      });
    }

    const pills = this.container.querySelectorAll('.pill');
    pills.forEach(p => {
      p.addEventListener('click', (e) => {
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        this.filterStatus = p.getAttribute('data-filter');
        this.renderCards();
      });
    });

    // Botão abrir modal de Links das Lojas no WhatsApp
    const btnLinksWhatsapp = this.container.querySelector('#btn-links-whatsapp-unidades');
    if (btnLinksWhatsapp) {
      btnLinksWhatsapp.addEventListener('click', async () => {
        await this.renderModalLinksWhatsapp();
      });
    }

    const btnCloseLinks = this.container.querySelector('.btn-close-modal-links');
    if (btnCloseLinks) {
      btnCloseLinks.addEventListener('click', () => {
        this.container.querySelector('#modal-whatsapp-links-unidades').classList.add('hidden');
      });
    }

    const btnWhatsapp = this.container.querySelector('#btn-whatsapp');
    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', async () => {
        const texto = await generateWhatsAppSummary(this.currentDate);
        const modal = this.container.querySelector('#modal-whatsapp');
        const textarea = this.container.querySelector('#whatsapp-preview-text');
        textarea.value = texto;
        modal.classList.remove('hidden');
      });
    }

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
        alert("Resumo copiado para a área de transferência! Cole no grupo do WhatsApp.");
        this.container.querySelector('#modal-whatsapp').classList.add('hidden');
      });
    }

    const btnRelatorios = this.container.querySelector('#btn-relatorios');
    if (btnRelatorios) {
      btnRelatorios.addEventListener('click', () => {
        window.app.switchView('comensais-relatorios');
      });
    }
  }

  async renderModalLinksWhatsapp() {
    const unidades = await getUnidades();
    const modal = this.container.querySelector('#modal-whatsapp-links-unidades');
    const tbody = this.container.querySelector('#tbody-links-whatsapp-modal');
    const baseUrl = `${window.location.origin}${window.location.pathname}`;

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
              Copiar p/ WhatsApp
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
        const text = `Olá equipe da unidade *Mart Minas - ${u.loja}*!\n\nAcesse o formulário de lançamento diário de comensais por este link exclusivo:\n${fullLink}\n\nEste link é seguro e restrito à sua loja.`;
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        alert(`Link do WhatsApp para a loja ${u.loja} copiado com sucesso!`);
      });

      tr.querySelector('.btn-regerar-token').addEventListener('click', async () => {
        if (confirm(`Atenção: Deseja revogar o link antigo e gerar um NOVO token seguro para a unidade ${u.loja}?`)) {
          await regenerateUnitToken(u.id);
          alert(`Novo token gerado para ${u.loja}!`);
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

    // Se estiver em modo exclusivo por token de unidade, filtrar apenas a unidade travada
    if (this.lockedUnit) {
      this.statusLista = this.statusLista.filter(x => x.unidade && x.unidade.id === this.lockedUnit.id);
    }
    
    // Atualizar Contadores das Pills se existirem
    const countTodos = this.container.querySelector('#count-todos');
    if (countTodos) {
      const pendentesCount = this.statusLista.filter(x => x.status === 'pendente').length;
      const concluidosCount = this.statusLista.filter(x => x.status === 'concluido').length;

      countTodos.textContent = this.statusLista.length;
      this.container.querySelector('#count-pendentes').textContent = pendentesCount;
      this.container.querySelector('#count-concluidos').textContent = concluidosCount;
    }

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
      const statusBadge = item.status === 'concluido' ? `<span class="badge badge-success">🟢 Concluído (${item.totalComensais})</span>` : `<span class="badge badge-pending">Pendente</span>`;

      const card = document.createElement('div');
      card.className = `unidade-card ${item.status === 'concluido' ? 'card-done' : ''}`;
      
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

            <div class="form-group-obs">
              <label>Observação (Opcional):</label>
              <input type="text" class="input-obs" name="observacao" value="${reg.observacao || ''}" placeholder="Ex: Baixo movimento por feriado municipal...">
            </div>

            <div class="card-actions-row">
              <span class="auto-save-indicator" id="indicator-${u.id}">Salvo</span>
              <button type="submit" class="btn btn-sm btn-primary">Salvar Lançamento</button>
            </div>
          </form>
        </div>

        <div class="alerta-box-discrepancia" id="alerta-${u.id}"></div>
      `;

      // Eventos dos Inputs com Auto-Save Debounced
      const form = card.querySelector('.form-comensais-unidade');
      const numInputs = card.querySelectorAll('.input-comensal-num');
      const obsInput = card.querySelector('.input-obs');
      const indicator = card.querySelector(`#indicator-${u.id}`);
      const alertaBox = card.querySelector(`#alerta-${u.id}`);

      let autoSaveTimer = null;

      const performAutoSave = async () => {
        indicator.textContent = '⏳ Salvando...';
        indicator.style.color = 'var(--text-muted)';

        const formData = new FormData(form);
        const publicosVals = {};
        let totalComensais = 0;

        this.publicosAtivos.forEach(p => {
          const val = parseInt(formData.get(p.id) || '0', 10);
          publicosVals[p.id] = val;
          totalComensais += val;
        });

        const observacaoVal = formData.get('observacao') || '';

        const registroObj = {
          id: reg.id || `c_${u.id}_${this.currentDate}`,
          unidadeId: u.id,
          data: this.currentDate,
          publicos: publicosVals,
          observacao: observacaoVal,
          updatedAt: new Date().toISOString()
        };

        await saveComensaisRegistro(registroObj);

        indicator.textContent = 'Salvo';
        indicator.style.color = 'var(--primary)';

        // Alerta de Discrepância
        const alerta = await checkDiscrepanciaAlert(u.id, this.currentDate, totalComensais);
        if (alerta && alerta.hasAlert) {
          alertaBox.innerHTML = `
            <div class="alerta-discrepancia">
              <span><strong>Atenção:</strong> Variação de <strong>${alerta.percent}</strong> em relação à média normal (${alerta.media} comensais).</span>
            </div>
          `;
        } else {
          alertaBox.innerHTML = '';
        }
      };

      numInputs.forEach(inp => {
        inp.addEventListener('input', () => {
          indicator.textContent = 'Editando...';
          indicator.style.color = 'var(--warning, #f59e0b)';
          if (autoSaveTimer) clearTimeout(autoSaveTimer);
          autoSaveTimer = setTimeout(performAutoSave, 500);
        });
        inp.addEventListener('change', performAutoSave);
      });

      if (obsInput) {
        obsInput.addEventListener('input', () => {
          indicator.textContent = 'Editando...';
          if (autoSaveTimer) clearTimeout(autoSaveTimer);
          autoSaveTimer = setTimeout(performAutoSave, 500);
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
