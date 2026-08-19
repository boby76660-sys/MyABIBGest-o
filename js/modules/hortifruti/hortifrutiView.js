/**
 * Hortifrúti View - Módulo de Cotação Semanal, Comparação de Preços e Auditoria Mensal
 * Estende BaseModule (moduleRegistry.js)
 */

import { BaseModule } from '../moduleRegistry.js';
import { UNIDADES_SEED } from '../../config.js';
import { getUnidades, regenerateUnitToken } from '../../services/adminService.js';
import { 
  getProdutosHortifruti, 
  getPedidoSemanal, 
  savePedidoSemanal, 
  copiarPrecosSemanaAnterior, 
  calcularTotaisPedido, 
  getConsolidadoMensal,
  generateWhatsAppTextSacolao,
  generateWhatsAppTextMartMinas
} from '../../services/hortifrutiService.js';

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

export class HortifrutiModule extends BaseModule {
  constructor() {
    super('hortifruti', 'Hortifrúti Semanal', '', 'Cotação Sacolão x Mart Minas, apoio a pedidos e auditoria mensal de NFs.');
    
    const now = new Date();
    this.currentMesAno = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.currentSemana = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));
    this.currentUnidadeId = UNIDADES_SEED[0].id;
    this.activeTab = 'cotacao'; // 'cotacao' ou 'relatorio'
    this.lockedUnit = null;
    this.isLocalSaving = false;
    this.sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    this.lastLocalSaveTimestamp = 0;
    
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

    // Carrega produtos cadastrados
    this.produtosCache = await getProdutosHortifruti();

    container.innerHTML = `
      <div class="module-header">
        <div class="header-titles">
          <h2>Cotação & Pedidos de Hortifrúti</h2>
          <p class="subtitle">${isLocked ? `Mart Minas — ${this.lockedUnit.loja}` : 'Comparativo de menor preço por produto (Sacolão x Mart Minas) e auditoria de NFs'}</p>
        </div>
        <div class="header-actions">
          ${!isLocked ? `
            <button id="btn-links-whatsapp-horti" class="btn btn-primary">
               Links das 21 Unidades
            </button>
            <button id="tab-btn-relatorio" class="btn btn-secondary">
              ${this.activeTab === 'cotacao' ? 'Histórico e Relatórios' : 'Voltar para Cotação'}
            </button>
          ` : ''}
        </div>
      </div>

      <!-- SEÇÃO 1: COTAÇÃO E PEDIDO SEMANAL -->
      <div id="section-cotacao" class="horti-section ${this.activeTab === 'cotacao' ? '' : 'hidden'}">
        <div class="date-and-filter-bar" style="display: flex; flex-direction: column; gap: 12px; padding: 14px 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; width: 100%;">
            ${!isLocked ? `
              <div class="date-picker-group">
                <label for="select-horti-unidade">Unidade:</label>
                <select id="select-horti-unidade" class="select-field" style="width: auto; min-width: 200px;">
                  ${UNIDADES_SEED.map(u => `
                    <option value="${u.id}" ${u.id === this.currentUnidadeId ? 'selected' : ''}>
                      ${u.loja} (${u.grupo})
                    </option>
                  `).join('')}
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

        <!-- Barra de Pesquisa -->
        <div style="margin: 16px 0;">
          <div class="search-group" style="width: 100%;">
            <input type="text" id="input-search-horti" class="input-search" placeholder="Buscar produto (ex: Batata, Tomate, Laranja)...">
          </div>
        </div>

        <!-- Tabela de Produtos -->
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
              <tr><td colspan="7" class="text-center pad-20">Carregando produtos...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Barra Inferior de Resumo de Totais e Ação WhatsApp -->
        <div class="horti-bottom-bar" style="margin-top: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; background: #ffffff; padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; font-weight: 700; text-transform: uppercase;">Total Sacolão</span>
              <strong id="card-total-sacolao" style="font-size: 1.1rem; color: var(--text-title);">R$ 0,00</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; font-weight: 700; text-transform: uppercase;">Total Mart Minas</span>
              <strong id="card-total-martminas" style="font-size: 1.1rem; color: var(--text-title);">R$ 0,00</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: #047857; display: block; font-weight: 700; text-transform: uppercase;">Economia Estimada</span>
              <strong id="card-total-economia" style="font-size: 1.1rem; color: #047857;">R$ 0,00</strong>
            </div>
          </div>

          <button id="btn-finalizar-horti" class="btn btn-whatsapp" style="font-size: 0.95rem; padding: 10px 20px;">
             Gerar Listas para o WhatsApp
          </button>
        </div>
      </div>

      <!-- SEÇÃO 2: HISTÓRICO E RELATÓRIO CONSOLIDADO -->
      <div id="section-relatorio" class="horti-section ${this.activeTab === 'relatorio' ? '' : 'hidden'}">
        <div class="date-and-filter-bar" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
            <div class="date-picker-group">
              <label for="input-rel-mesano">Período (Mês/Ano):</label>
              <input type="month" id="input-rel-mesano" class="input-date" value="${this.currentMesAno}">
            </div>

            <div class="date-picker-group">
              <label for="select-rel-unidade">Filtrar Loja:</label>
              <select id="select-rel-unidade" class="select-field" style="width: auto;">
                <option value="todas">Todas as Unidades (Consolidado Redecentro)</option>
                ${UNIDADES_SEED.map(u => `<option value="${u.id}">${u.loja} (${u.grupo})</option>`).join('')}
              </select>
            </div>
          </div>

          <button id="btn-filtrar-relatorio-horti" class="btn btn-primary">Aplicar Filtro</button>
        </div>

        <div id="relatorio-content-container">
          <!-- Conteúdo do relatório mensal preenchido via JS -->
        </div>
      </div>

      <!-- Modal WhatsApp Listas Sacolão & Mart Minas -->
      <div id="modal-horti-listas" class="modal hidden">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>Listas Formatadas para o WhatsApp</h3>
            <button class="btn-close-modal" id="btn-close-modal-listas"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <div class="modal-body">
            <div class="modal-tabs" style="display: flex; gap: 8px; margin-bottom: 12px;">
              <button id="modal-tab-sacolao" class="modal-tab-btn active">Lista Sacolão Local</button>
              <button id="modal-tab-martminas" class="modal-tab-btn">Lista Mart Minas</button>
            </div>

            <div id="modal-panel-sacolao" class="modal-tab-panel">
              <p class="subtitle" style="margin-bottom: 8px;">Copia o texto pronto para enviar ao fornecedor do Sacolão:</p>
              <textarea id="txt-whatsapp-sacolao" readonly class="whatsapp-textarea" style="height: 220px;"></textarea>
              <button id="btn-copiar-txt-sacolao" class="btn btn-whatsapp btn-block" style="margin-top: 10px; width: 100%;">Copiar Lista do Sacolão para o WhatsApp</button>
            </div>

            <div id="modal-panel-martminas" class="modal-tab-panel hidden">
              <p class="subtitle" style="margin-bottom: 8px;">Copia o texto pronto para a equipe de compras no Mart Minas:</p>
              <textarea id="txt-whatsapp-martminas" readonly class="whatsapp-textarea" style="height: 220px;"></textarea>
              <button id="btn-copiar-txt-martminas" class="btn btn-whatsapp btn-block" style="margin-top: 10px; width: 100%;">Copiar Lista do Mart Minas para o WhatsApp</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Links das 21 Unidades -->
      ${!isLocked ? `
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
          item.fornecedorEscolhido = '';
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
        const modal = this.container.querySelector('#modal-whatsapp-links-horti');
        if (modal) modal.classList.add('hidden');
      });
    }

    const selectUnidade = this.container.querySelector('#select-horti-unidade');
    if (selectUnidade) {
      selectUnidade.addEventListener('change', async (e) => {
        this.currentUnidadeId = e.target.value;
        await this.loadCotacaoData();
      });
    }

    const inputMesAno = this.container.querySelector('#input-horti-mesano');
    if (inputMesAno) {
      inputMesAno.addEventListener('change', async (e) => {
        this.currentMesAno = e.target.value;
        await this.loadCotacaoData();
      });
    }

    const semanaPills = this.container.querySelectorAll('#semana-pills-group .pill');
    semanaPills.forEach(p => {
      p.addEventListener('click', async () => {
        semanaPills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        this.currentSemana = parseInt(p.getAttribute('data-semana'));
        await this.loadCotacaoData();
      });
    });

    const inputSearch = this.container.querySelector('#input-search-horti');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.filterAndRenderRows();
      });
    }

    const btnCopiarAnt = this.container.querySelector('#btn-copiar-anterior');
    if (btnCopiarAnt) {
      btnCopiarAnt.addEventListener('click', async () => {
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
            item.fornecedorEscolhido = '';
            item.isManual = false;
          });
          this.filterAndRenderRows();
          this.updateResumoCards();
          const rawDoc = {
            unidadeId: this.currentUnidadeId,
            mesAno: this.currentMesAno,
            semana: this.currentSemana,
            nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
            itens: this.itensState
          };
          await savePedidoSemanal(rawDoc);
          alert("Todos os valores da cotação foram zerados com sucesso!");
        }
      });
    }

    const btnFinalizar = this.container.querySelector('#btn-finalizar-horti');
    if (btnFinalizar) {
      btnFinalizar.addEventListener('click', async () => {
        await this.handleFinalizarPedido();
      });
    }

    const modalListas = this.container.querySelector('#modal-horti-listas');
    const btnCloseModal = this.container.querySelector('#btn-close-modal-listas');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => {
        if (modalListas) modalListas.classList.add('hidden');
      });
    }

    const tabSac = this.container.querySelector('#modal-tab-sacolao');
    const tabMart = this.container.querySelector('#modal-tab-martminas');
    const panelSac = this.container.querySelector('#modal-panel-sacolao');
    const panelMart = this.container.querySelector('#modal-panel-martminas');

    if (tabSac && tabMart) {
      tabSac.addEventListener('click', () => {
        tabSac.classList.add('active');
        tabMart.classList.remove('active');
        panelSac.classList.remove('hidden');
        panelMart.classList.add('hidden');
      });

      tabMart.addEventListener('click', () => {
        tabMart.classList.add('active');
        tabSac.classList.remove('active');
        panelMart.classList.remove('hidden');
        panelSac.classList.add('hidden');
      });
    }

    const btnCopiarSac = this.container.querySelector('#btn-copiar-txt-sacolao');
    if (btnCopiarSac) {
      btnCopiarSac.addEventListener('click', () => {
        const txt = this.container.querySelector('#txt-whatsapp-sacolao');
        txt.select();
        document.execCommand('copy');
        alert("Lista do Sacolão copiada para a área de transferência!");
      });
    }

    const btnCopiarMart = this.container.querySelector('#btn-copiar-txt-martminas');
      if (btnCopiarMart) {
        btnCopiarMart.addEventListener('click', () => {
          const txt = this.container.querySelector('#txt-whatsapp-martminas');
          txt.select();
          document.execCommand('copy');
          alert("Lista do Mart Minas copiada para a área de transferência!");
        });
      }

      // Listener de Tempo Real Não-Destrutivo (Sincronização instantânea entre abas/dispositivos)
      if (this.realtimeHandler) {
        window.removeEventListener('abib_realtime_update', this.realtimeHandler);
      }
      this.realtimeHandler = async (e) => {
        if (e.detail && (e.detail.key === 'abib_gestao_hortifruti_pedidos' || e.detail.key === 'abib_gestao_unidades')) {
          if (this.isLocalSaving) return;
          if (this.activeTab === 'cotacao') {
            const updated = await getPedidoSemanal(this.currentUnidadeId, this.currentMesAno, this.currentSemana);
            this.applyRealtimeUpdateToDOM(updated);
          } else if (this.activeTab === 'relatorio') {
            await this.renderRelatorio();
          }
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
          if (this.isLocalSaving) return;
          const rawPedidos = localStorage.getItem('abib_gestao_hortifruti_pedidos');
          if (rawPedidos) {
            try { updateMemoryCache('abib_gestao_hortifruti_pedidos', JSON.parse(rawPedidos)); } catch (err) {}
          }
          if (this.activeTab === 'cotacao') {
            const updated = await getPedidoSemanal(this.currentUnidadeId, this.currentMesAno, this.currentSemana);
            this.applyRealtimeUpdateToDOM(updated);
          } else if (this.activeTab === 'relatorio') {
            await this.renderRelatorio();
          }
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
        alert(`Link da unidade ${u.loja} copiado com sucesso!`);
      });

      tbody.appendChild(tr);
    });

    modal.classList.remove('hidden');
  }

  async loadCotacaoData(showLoading = false) {
    if (showLoading) {
      const tbody = this.container.querySelector('#horti-tbody-produtos');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center pad-20">Carregando produtos...</td></tr>`;
      }
    }
    this.currentPedido = await getPedidoSemanal(this.currentUnidadeId, this.currentMesAno, this.currentSemana);
    const mapaItensGravados = new Map();
    if (this.currentPedido && this.currentPedido.itens) {
      this.currentPedido.itens.forEach(it => mapaItensGravados.set(it.produtoId, it));
    }

    this.itensState = this.produtosCache.map(prod => {
      const gravado = mapaItensGravados.get(prod.id);
      return {
        produtoId: prod.id,
        nome: prod.nome,
        categoria: prod.categoria,
        unidadeMedida: prod.unidadeMedida,
        estoque: gravado ? (gravado.estoque !== undefined && gravado.estoque !== null ? gravado.estoque : '') : '',
        precoSacolao: gravado ? (gravado.precoSacolao !== undefined && gravado.precoSacolao !== null && gravado.precoSacolao !== 0 ? gravado.precoSacolao : '') : '',
        precoMartMinas: gravado ? (gravado.precoMartMinas !== undefined && gravado.precoMartMinas !== null && gravado.precoMartMinas !== 0 ? gravado.precoMartMinas : '') : '',
        quantidade: gravado ? (gravado.quantidade !== undefined && gravado.quantidade !== null && gravado.quantidade !== 0 ? gravado.quantidade : '') : '',
        fornecedorEscolhido: gravado ? (gravado.fornecedorEscolhido || '') : '',
        isManual: gravado ? (gravado.isManual || false) : false
      };
    });

    this.filterAndRenderRows();
    this.updateResumoCards();
  }

  applyRealtimeUpdateToDOM(updatedPedido) {
    if (!updatedPedido || !updatedPedido.itens) return;

    // Se o documento recebido foi gerado por esta própria aba/sessão, ignora (nossos dados locais já são os mais novos)
    if (updatedPedido.lastUpdatedBy && updatedPedido.lastUpdatedBy === this.sessionId) {
      return;
    }

    // Se o documento recebido for mais antigo do que o último salvamento local desta aba, ignora
    if (this.currentPedido && this.currentPedido.atualizadoEm && updatedPedido.atualizadoEm) {
      const remoteTime = new Date(updatedPedido.atualizadoEm).getTime();
      const localTime = new Date(this.currentPedido.atualizadoEm).getTime();
      if (remoteTime < localTime) {
        return;
      }
    }

    this.currentPedido = updatedPedido;
    const mapaItens = new Map();
    updatedPedido.itens.forEach(it => mapaItens.set(it.produtoId, it));

    const tbody = this.container.querySelector('#horti-tbody-produtos');
    if (!tbody) return;

    this.itensState.forEach((item, idx) => {
      const remote = mapaItens.get(item.produtoId);
      if (remote) {
        item.estoque = remote.estoque !== undefined && remote.estoque !== null ? remote.estoque : '';
        item.precoSacolao = remote.precoSacolao !== undefined && remote.precoSacolao !== null && remote.precoSacolao !== 0 ? remote.precoSacolao : '';
        item.precoMartMinas = remote.precoMartMinas !== undefined && remote.precoMartMinas !== null && remote.precoMartMinas !== 0 ? remote.precoMartMinas : '';
        item.quantidade = remote.quantidade !== undefined && remote.quantidade !== null && remote.quantidade !== 0 ? remote.quantidade : '';
        item.fornecedorEscolhido = remote.fornecedorEscolhido || null;
        item.isManual = !!remote.isManual;

        const tr = tbody.querySelector(`tr [data-index="${idx}"]`)?.closest('tr');
        if (tr) {
          const inpEst = tr.querySelector('[data-field="estoque"]');
          const inpSac = tr.querySelector('[data-field="precoSacolao"]');
          const inpMart = tr.querySelector('[data-field="precoMartMinas"]');
          const inpQtd = tr.querySelector('[data-field="quantidade"]');
          const selVenc = tr.querySelector('.select-vencedor-override');

          const activeEl = document.activeElement;
          if (inpEst && activeEl !== inpEst) inpEst.value = item.estoque;
          if (inpSac && activeEl !== inpSac) inpSac.value = item.precoSacolao ? (parseFloat(item.precoSacolao) || 0).toFixed(2) : '';
          if (inpMart && activeEl !== inpMart) inpMart.value = item.precoMartMinas ? (parseFloat(item.precoMartMinas) || 0).toFixed(2) : '';
          if (inpQtd && activeEl !== inpQtd) inpQtd.value = item.quantidade;
          if (selVenc && activeEl !== selVenc) selVenc.value = item.fornecedorEscolhido || '';

          this.updateRowCalculations(tr, idx);
        }
      }
    });

    const calculados = calcularTotaisPedido(this.itensState, this.produtosCache);
    const cardSac = this.container.querySelector('#card-total-sacolao');
    const cardMart = this.container.querySelector('#card-total-martminas');
    const cardEco = this.container.querySelector('#card-total-economia');

    if (cardSac) cardSac.textContent = `R$ ${calculados.totalSacolao.toFixed(2).replace('.', ',')}`;
    if (cardMart) cardMart.textContent = `R$ ${calculados.totalMartMinas.toFixed(2).replace('.', ',')}`;
    if (cardEco) cardEco.textContent = `R$ ${calculados.economiaEstimada.toFixed(2).replace('.', ',')}`;
  }

  filterAndRenderRows() {
    const tbody = this.container.querySelector('#horti-tbody-produtos');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtrados = this.itensState.filter(item => {
      return matchesFuzzySearch(item.nome, this.searchQuery);
    });

    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center pad-20">Nenhum produto encontrado.</td></tr>`;
      return;
    }

    filtrados.forEach((item) => {
      const globalIdx = this.itensState.findIndex(x => x.produtoId === item.produtoId);

      const pSac = parseFloat(item.precoSacolao) || 0;
      const pMart = parseFloat(item.precoMartMinas) || 0;
      const qtd = parseFloat(item.quantidade) || 0;
      const est = parseFloat(item.estoque) || 0;

      let vencAuto = '';
      let sacHighlight = '';
      let martHighlight = '';
      if (pSac > 0 && pMart > 0) {
        if (pSac < pMart) {
          vencAuto = 'Sacolão';
          sacHighlight = 'bg-green-highlight';
        } else if (pMart < pSac) {
          vencAuto = 'Mart Minas';
          martHighlight = 'bg-green-highlight';
        } else {
          // Preços empatados: nenhum é o melhor preço!
          vencAuto = '';
        }
      } else if (pMart > 0) {
        vencAuto = 'Mart Minas';
        martHighlight = 'bg-green-highlight';
      } else if (pSac > 0) {
        vencAuto = 'Sacolão';
        sacHighlight = 'bg-green-highlight';
      }

      if (!item.isManual) item.fornecedorEscolhido = vencAuto;

      const precoFinal = item.fornecedorEscolhido === 'Mart Minas' ? pMart : (item.fornecedorEscolhido === 'Sacolão' ? pSac : 0);
      const subtotal = Math.round((qtd * precoFinal) * 100) / 100;
      const valSac = (item.precoSacolao !== '' && item.precoSacolao !== null && item.precoSacolao !== undefined) ? (parseFloat(item.precoSacolao) || 0).toFixed(2) : '';
      const valMart = (item.precoMartMinas !== '' && item.precoMartMinas !== null && item.precoMartMinas !== undefined) ? (parseFloat(item.precoMartMinas) || 0).toFixed(2) : '';
      const isFilled = (pSac > 0 || pMart > 0 || qtd > 0 || est > 0);

      const tr = document.createElement('tr');
      tr.className = `tr-produto-row ${isFilled ? 'tr-filled' : ''}`;
      tr.innerHTML = `
        <td class="col-produto">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
            <div>
              <strong>${item.nome}</strong> <small class="text-muted">(${item.unidadeMedida})</small>
            </div>
            <button class="btn-clear-item-row" data-index="${globalIdx}" title="Zerar valores deste produto">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
        <td class="col-estoque text-center">
          <label class="mobile-label">Estoque</label>
          <input type="number" step="0.1" min="0" class="input-horti-num" data-index="${globalIdx}" data-field="estoque" value="${item.estoque}" placeholder="0">
        </td>
        <td class="col-sacolao text-center ${sacHighlight}">
          <label class="mobile-label">Preço Sacolão</label>
          <div class="input-money-wrapper">
            <span class="currency-symbol">R$</span>
            <input type="number" step="0.01" min="0" class="input-horti-num input-table-number" data-index="${globalIdx}" data-field="precoSacolao" value="${valSac}" placeholder="0,00">
          </div>
        </td>
        <td class="col-martminas text-center ${martHighlight}">
          <label class="mobile-label">Preço Mart Minas</label>
          <div class="input-money-wrapper">
            <span class="currency-symbol">R$</span>
            <input type="number" step="0.01" min="0" class="input-horti-num input-table-number" data-index="${globalIdx}" data-field="precoMartMinas" value="${valMart}" placeholder="0,00">
          </div>
        </td>
        <td class="col-qtd text-center">
          <label class="mobile-label">Quantidade</label>
          <input type="number" step="1" min="0" class="input-horti-num" data-index="${globalIdx}" data-field="quantidade" value="${item.quantidade}" placeholder="0">
        </td>
        <td class="col-vencedor text-center">
          <label class="mobile-label">Vencedor</label>
          <select class="select-vencedor-override" data-index="${globalIdx}">
            <option value="" ${!item.fornecedorEscolhido ? 'selected' : ''}>-</option>
            <option value="Sacolão" ${item.fornecedorEscolhido === 'Sacolão' ? 'selected' : ''}>Sacolão</option>
            <option value="Mart Minas" ${item.fornecedorEscolhido === 'Mart Minas' ? 'selected' : ''}>Mart Minas</option>
          </select>
        </td>
        <td class="col-subtotal text-center">
          <label class="mobile-label">Subtotal</label>
          <strong class="subtotal-val">R$ ${subtotal.toFixed(2).replace('.', ',')}</strong>
        </td>
      `;

      tbody.appendChild(tr);
    });

    this.bindTableEvents();
  }

  bindTableEvents() {
    const tbody = this.container.querySelector('#horti-tbody-produtos');
    if (!tbody) return;
    const inputs = tbody.querySelectorAll('input, select');

    inputs.forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        if (field && !isNaN(idx) && this.itensState[idx]) {
          this.itensState[idx][field] = e.target.value;
        }
      });

      if (inp.tagName === 'SELECT') {
        inp.addEventListener('change', async (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'));
          if (!isNaN(idx) && this.itensState[idx]) {
            this.itensState[idx].isManual = true;
            this.itensState[idx].fornecedorEscolhido = e.target.value;
            this.updateRowCalculations(e.target.closest('tr'), idx);
            this.updateResumoCards();
            await this.salvarNoBanco();
          }
        });
      }

      inp.addEventListener('focus', (e) => {
        if (e.target.tagName === 'INPUT') {
          e.target.select();
        }
      });

      inp.addEventListener('blur', async (e) => {
        const field = e.target.getAttribute('data-field');
        const idx = parseInt(e.target.getAttribute('data-index'));
        if (field && !isNaN(idx) && this.itensState[idx]) {
          const rawVal = e.target.value.trim();
          if (field === 'precoSacolao' || field === 'precoMartMinas') {
            if (rawVal !== '') {
              const formatted = (parseFloat(rawVal) || 0).toFixed(2);
              e.target.value = formatted;
              this.itensState[idx][field] = formatted;
            } else {
              this.itensState[idx][field] = '';
            }
          } else {
            this.itensState[idx][field] = rawVal;
          }
        }
        this.updateRowCalculations(e.target.closest('tr'), idx);
        this.updateResumoCards();
        await this.salvarNoBanco();
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
    const est = parseFloat(item.estoque) || 0;

    const isFilled = (pSac > 0 || pMart > 0 || qtd > 0 || est > 0);
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
        // Empate: nenhum recebe destaque verde!
        vencedorAuto = '';
      }
    } else if (pMart > 0) {
      if (tdMart) tdMart.classList.add('bg-green-highlight');
      vencedorAuto = 'Mart Minas';
    } else if (pSac > 0) {
      if (tdSac) tdSac.classList.add('bg-green-highlight');
      vencedorAuto = 'Sacolão';
    }

    if (!item.isManual) {
      item.fornecedorEscolhido = vencedorAuto;
      const selectVencedor = tr.querySelector('.select-vencedor-override');
      if (selectVencedor) {
        selectVencedor.value = vencedorAuto;
      }
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
  }

  async salvarNoBanco() {
    this.isLocalSaving = true;
    this.lastLocalSaveTimestamp = Date.now();
    const saveTime = new Date().toISOString();
    try {
      const rawDoc = {
        unidadeId: this.currentUnidadeId,
        mesAno: this.currentMesAno,
        semana: this.currentSemana,
        nutricionistaId: this.currentProfile ? this.currentProfile.id : 'nutri_geral',
        itens: this.itensState,
        lastUpdatedBy: this.sessionId,
        atualizadoEm: saveTime
      };
      this.currentPedido = await savePedidoSemanal(rawDoc);
    } catch (err) {
      console.warn("Erro ao salvar cotação:", err);
    } finally {
      setTimeout(() => {
        this.isLocalSaving = false;
      }, 1000);
    }
  }

  async handleCopiarSemanaAnterior() {
    const res = await copiarPrecosSemanaAnterior(this.currentUnidadeId, this.currentMesAno, this.currentSemana);
    if (!res.sucesso) {
      alert(res.mensagem);
      return;
    }

    this.itensState.forEach(item => {
      const precoAnt = res.mapaPrecos[item.produtoId];
      if (precoAnt) {
        if (precoAnt.precoSacolao > 0) item.precoSacolao = precoAnt.precoSacolao;
        if (precoAnt.precoMartMinas > 0) item.precoMartMinas = precoAnt.precoMartMinas;
      }
    });

    this.filterAndRenderRows();
    this.updateResumoCards();
    alert(`Preços copiados da Semana ${res.semanaOrigem} (${res.mesAnoOrigem}) com sucesso!`);
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
    `;
  }
}
