/**
 * Comensais Report - Relatórios, Histórico e Painel Gráfico SVG de Alto Impacto
 */

import { getCollection } from '../../services/storageService.js';
import { getUnidades, getPublicos } from '../../services/adminService.js';
import { exportComensaisCSV } from '../../services/comensaisService.js';

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

export class ComensaisReportView {
  constructor(appController) {
    this.appController = appController;
    this.periodo = 'este_mes';
    this.dataInicio = '';
    this.dataFim = '';
    this.activeTab = 'visual'; // 'visual', 'tabela' ou 'matriz'
    this.matrixAno = new Date().getFullYear();
    this.matrixMes = new Date().getMonth();
    this.matrixFilter = 'todas';
    this.matrixDiaLimite = null;
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
          ${!this.isLockedMode() ? `
            <button id="btn-voltar-comensais" class="btn btn-secondary">
              <span>⬅</span> Voltar
            </button>
          ` : ''}
          <button id="btn-copiar-link-relatorio" class="btn btn-secondary" title="Copiar link de acesso direto com senha para este painel de relatórios">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Link Direto</span>
          </button>
          <button id="btn-exportar-csv" class="btn btn-secondary">
             Exportar CSV
          </button>
          <button id="btn-exportar-pdf" class="btn btn-success">
             Exportar PDF
          </button>
          <button id="btn-ver-detalhes-unidades" class="btn btn-primary">
             Unidades
          </button>
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
              <h3> Refeições por Grupo Regional</h3>
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
            <h3> Cadastro e Detalhamento Geral das Unidades</h3>
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

  isLockedMode() {
    return !!(window.app && (window.app.lockedModule === 'comensais-relatorios' || window.app.lockedUnit));
  }

  bindEvents() {
    const btnVoltar = this.container.querySelector('#btn-voltar-comensais');
    if (btnVoltar) {
      btnVoltar.addEventListener('click', () => {
        window.app.switchView('comensais');
      });
    }

    const btnCopiarLink = this.container.querySelector('#btn-copiar-link-relatorio');
    if (btnCopiarLink) {
      btnCopiarLink.addEventListener('click', () => {
        const fullUrl = `${window.location.origin}${window.location.pathname}?modulo=comensais-relatorios`;
        navigator.clipboard.writeText(fullUrl).then(() => {
          alert("Link direto para o Painel de Relatórios copiado com sucesso!\n\nEste link exige senha para entrar e não permite navegar para outros módulos.");
        }).catch(() => {
          prompt("Copie o link direto para o Painel de Relatórios:", fullUrl);
        });
      });
    }

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
    const todos = await getCollection('abib_gestao_comensais');
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

  // GRÁFICO DE ONDA / ÁREA SVG (SEM DISTORÇÃO DE TEXTO)
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

  // GRÁFICO DONUT SVG
  renderSVGDonutChart(publicosMap, publicos, totalGeral) {
    const container = this.container.querySelector('#chart-public-donut');
    container.innerHTML = '';

    if (totalGeral === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Sem dados para exibir.</p>`;
      return;
    }

    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];
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

  //  COMPARATIVO POR GRUPO REGIONAL (AC, ABIB, MOC COM COR ROXA)
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

  // RANKING DE UNIDADES
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

  // GRÁFICO DE BARRAS DE TODAS AS 21 UNIDADES + RESUMO POR GRUPO E TOTAL GERAL
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
