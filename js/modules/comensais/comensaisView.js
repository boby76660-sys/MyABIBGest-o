/**
 * Comensais View - Form de Registro Diário Rápido das 21 Unidades
 * Suporta modo exclusivo travado por Token de Unidade, Painel de Gestão e Leitura por Foto (IA OCR via OpenRouter)
 */

import { BaseModule } from '../moduleRegistry.js';
import { getStatusUnidadesNoDia, saveComensaisRegistro, generateWhatsAppSummary, checkDiscrepanciaAlert, saveComensaisLote } from '../../services/comensaisService.js';
import { getPublicos, getUnidades, regenerateUnitToken } from '../../services/adminService.js';
import { extractComensaisFromImages, getAiConfig, saveAiConfig, testOpenRouterConnection } from '../../services/aiVisionService.js';
import { enqueueAiJob, getAiJobs, removeAiJob, clearCompletedAiJobs } from '../../services/aiBackgroundQueueService.js';

export class ComensaisModule extends BaseModule {
  constructor() {
    super('comensais', 'Comensais Diários', '', 'Registro rápido de refeições vendidas por unidade e público.');
    this.currentDate = new Date().toISOString().split('T')[0];
    this.filterStatus = 'todos'; // todos | pendente | concluido
    this.searchQuery = '';
    this.currentProfile = null;
    this.lockedUnit = null;

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
                <button type="button" id="btn-link-relatorio-comensais-dropdown" class="dropdown-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  <span>Link Direto dos Relatórios</span>
                </button>
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
          <input type="date" id="input-data-comensais" class="input-date" value="${this.currentDate}" ${dateMin ? `min="${dateMin}"` : ''} ${dateMax ? `max="${dateMax}"` : ''}>
        </div>

        ${!isLocked ? `
          <div class="search-group">
            <input type="text" id="input-search-unidades" class="input-search" placeholder="Buscar loja/unidade...">
          </div>

          <div class="filter-pills">
            <button class="pill ${this.filterStatus === 'todos' ? 'active' : ''}" data-filter="todos">Todos (<span id="count-todos">0</span>)</button>
            <button class="pill pill-pending ${this.filterStatus === 'pendente' ? 'active' : ''}" data-filter="pendente">Pendentes (<span id="count-pendentes">0</span>)</button>
            <button class="pill pill-success ${this.filterStatus === 'concluido' ? 'active' : ''}" data-filter="concluido">Concluídos (<span id="count-concluidos">0</span>)</button>
          </div>
        ` : ''}
      </div>

      <div id="unidades-cards-container" class="cards-grid-vertical">
        <div class="loading-spinner">Carregando unidades...</div>
      </div>

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

      <!-- ========================================================= -->
      <!-- MODAL WHATSAPP LINKS (21 UNIDADES) -->
      <!-- ========================================================= -->
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

        <!-- MODAL WHATSAPP RESUMO -->
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

    // --- OUTROS EVENTOS PADRÃO ---
    const btnLinkRelatorioDropdown = this.container.querySelector('#btn-link-relatorio-comensais-dropdown');
    if (btnLinkRelatorioDropdown) {
      btnLinkRelatorioDropdown.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        const fullUrl = `${window.location.origin}${window.location.pathname}?modulo=comensais-relatorios`;
        const temp = document.createElement('textarea');
        temp.value = fullUrl;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        if (typeof showToast === 'function') {
          showToast("Link do Relatório copiado!", "success");
        }
      });
    }

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
        if (typeof showToast === 'function') {
          showToast("Resumo copiado para a área de transferência!", "success");
        }
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

    // Se já havia unidade travada, pré-selecionar
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

    const closeModal = () => {
      modal.classList.add('hidden');
      this.ocrSelectedFiles = [];
      this.renderOcrThumbnails();
    };

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCloseFooter) btnCloseFooter.addEventListener('click', closeModal);

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

    // Drag & Drop
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
      alert(`Lote da unidade ${targetUnit.loja} (${filesToProcess.length} foto(s)) enviado para processamento em segundo plano!\n\nVocê já pode anexar fotos de outra unidade ou acompanhar o status no botão "Central de Lotes".`);
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
      alert("Configurações do OpenRouter salvas com sucesso!");
      modal.classList.add('hidden');
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
        if (typeof showToast === 'function') {
          showToast(`Link da unidade ${u.loja} copiado!`, "success");
        }
      });

      tr.querySelector('.btn-regerar-token').addEventListener('click', async () => {
        if (confirm(`Atenção: Deseja revogar o link antigo e gerar um NOVO token seguro para a unidade ${u.loja}?`)) {
          await regenerateUnitToken(u.id);
          if (typeof showToast === 'function') {
            showToast(`Novo token gerado para ${u.loja}!`, "success");
          }
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
      const statusBadge = item.status === 'concluido' ? `<span class="badge badge-success">Concluído (${item.totalComensais})</span>` : `<span class="badge badge-pending">Pendente</span>`;

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
        indicator.textContent = 'Salvando...';
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
