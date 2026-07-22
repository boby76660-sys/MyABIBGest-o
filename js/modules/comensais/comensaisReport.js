/**
 * Comensais Report - Relatórios, Histórico, Edição e Modal de Detalhes da Empresa
 */

import { getCollection } from '../../services/storageService.js';
import { getUnidades, getPublicos } from '../../services/adminService.js';
import { exportComensaisCSV, saveComensaisRegistro } from '../../services/comensaisService.js';

export class ComensaisReportView {
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
          <h2>📊 Relatório e Histórico de Comensais</h2>
          <p class="subtitle">Consolidado por período, detalhamento por unidade e exportação</p>
        </div>
        <div class="header-actions">
          <button id="btn-voltar-comensais" class="btn btn-secondary">
            <span>⬅️</span> Voltar ao Lançamento
          </button>
          <button id="btn-exportar-csv" class="btn btn-success">
            <span>📥</span> Exportar CSV / Excel
          </button>
          <button id="btn-ver-detalhes-unidades" class="btn btn-primary">
            <span>🏢</span> Detalhamento das Unidades
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

          <button id="btn-filtrar-relatorio" class="btn btn-primary">🔍 Aplicar Filtro</button>
        </div>
      </div>

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
          <span class="kpi-title">Unidades Ativas</span>
          <span class="kpi-value" id="kpi-unidades-ativas">0</span>
        </div>
      </div>

      <div class="table-responsive-card">
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

      <!-- Modal de Detalhes das Unidades (Empresas/CNPJs) conforme pedido do Usuário -->
      <div id="modal-detalhes-unidades" class="modal hidden">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h3>🏢 Cadastro e Detalhamento Geral das Unidades</h3>
            <button class="btn-close-modal-unidades">&times;</button>
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

    // Exportar CSV
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

    // Modal de Detalhes de Unidades
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
      opt.textContent = u.loja;
      select.appendChild(opt);
    });
  }

  async loadReportData() {
    const todos = await getCollection('abib_gestao_comensais');
    const unidades = await getUnidades();
    const publicos = await getPublicos();
    const unidadesMap = new Map(unidades.map(u => [u.id, u]));

    const lojaFiltro = this.container.querySelector('#select-filtro-loja').value;

    const filtrados = todos.filter(r => {
      const dateMatch = r.data >= this.dataInicio && r.data <= this.dataFim;
      const lojaMatch = lojaFiltro === 'todas' || r.unidadeId === lojaFiltro;
      return dateMatch && lojaMatch;
    }).sort((a, b) => b.data.localeCompare(a.data));

    // KPIs
    let totalRefeicoes = 0;
    const datasSet = new Set();

    filtrados.forEach(r => {
      datasSet.add(r.data);
      if (r.publicos) {
        Object.values(r.publicos).forEach(v => totalRefeicoes += parseInt(v || 0, 10));
      }
    });

    const numDias = datasSet.size || 1;
    const mediaDiaria = Math.round(totalRefeicoes / numDias);

    this.container.querySelector('#kpi-total-refeicoes').textContent = totalRefeicoes.toLocaleString('pt-BR');
    this.container.querySelector('#kpi-media-diaria').textContent = mediaDiaria.toLocaleString('pt-BR');
    this.container.querySelector('#kpi-unidades-ativas').textContent = unidades.filter(u => u.ativo !== false).length;

    // Tabela
    const tbody = this.container.querySelector('#table-relatorio-comensais tbody');
    tbody.innerHTML = '';

    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum registro encontrado no período selecionado.</td></tr>`;
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
        <td><strong class="text-primary">${totalDoc}</strong></td>
        <td>${r.observacao || '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary btn-editar-reg" data-id="${r.id}">✏️ Editar</button>
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

    // Quais campos o perfil ativo pode visualizar?
    const permissoes = (this.currentProfile && this.currentProfile.permissoesCamposUnidade) || ["codigo", "grupo", "loja", "unidade", "cnpj"];

    // Montar Cabeçalho
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
