/**
 * App Controller Main - Inicializador Principal, Validador de Tokens e Roteador SPA
 */

import { initFirebase } from './firebaseClient.js';
import { getAdminConfig, getUnidadeByToken, validateMasterPIN, validateModulePIN, getUnidades, regenerateUnitToken } from './services/adminService.js';
import { getActiveProfile, renderProfileSelectorModal } from './admin/profileManager.js';
import { ModuleRegistry } from './modules/moduleRegistry.js';
import { ComensaisModule } from './modules/comensais/comensaisView.js';
import { ComensaisReportView } from './modules/comensais/comensaisReport.js';
import { HortifrutiModule } from './modules/hortifruti/hortifrutiView.js';
import { AdminPanel } from './admin/adminPanel.js';

class AppController {
  constructor() {
    this.currentProfile = null;
    this.currentView = 'dashboard';
    this.lockedUnit = null; // Se preenchido via URL (?token=...), opera em modo exclusivo de Hortifrúti para a unidade
    this.lockedModule = null;
    this.comensaisModule = new ComensaisModule();
    this.comensaisReportView = new ComensaisReportView(this);
    this.hortifrutiModule = new HortifrutiModule();
    this.adminPanel = new AdminPanel(this);
  }

  isAuthorized(targetModule = null) {
    const isMaster = sessionStorage.getItem('abib_manager_logged') === 'true';
    if (isMaster) return true;
    if (targetModule === 'comensais') return sessionStorage.getItem('abib_module_logged_comensais') === 'true';
    if (targetModule === 'hortifruti') return sessionStorage.getItem('abib_module_logged_hortifruti') === 'true';
    return false;
  }

  async init() {
    console.log("Inicializando Sistema de Gestão ABIB...");

    // Registrar Módulos no Registry
    ModuleRegistry.register(this.comensaisModule);
    ModuleRegistry.register(this.hortifrutiModule);

    // Inicializar Firebase se houver config
    const config = await getAdminConfig();
    if (config.firebaseConfig) {
      initFirebase(config.firebaseConfig);
    }

    // 1. VERIFICAR SE EXISTE TOKEN DE UNIDADE OU MÓDULO EXCLUSIVO NA URL
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

    // 3. SE ACCESSO POR MÓDULO DIRETO OU GERAL: VERIFICAR AUTENTICAÇÃO E SENHAS
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

    this.renderApp();
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

    const profileBadge = document.getElementById('active-profile-badge');
    const profileName = document.getElementById('active-profile-name');

    if (profileName && this.currentProfile) {
      if (profileBadge) profileBadge.textContent = '';
      profileName.textContent = this.currentProfile.nome || 'Gestão Restrita';
    }

    const btnChangeProfile = document.getElementById('btn-change-profile');
    if (btnChangeProfile) {
      btnChangeProfile.style.display = 'inline-flex';
      btnChangeProfile.innerHTML = ' Sair da Gestão';
      btnChangeProfile.onclick = () => {
        sessionStorage.removeItem('abib_manager_logged');
        this.renderManagerLoginView();
      };
    }

    const btnAdmin = document.getElementById('btn-open-admin');
    if (btnAdmin) {
      btnAdmin.style.display = 'none';
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

  renderApp() {
    this.renderHeader();
    this.switchView(this.currentView);
  }

  renderHeaderLocked() {
    const profileBadge = document.getElementById('active-profile-badge');
    const profileName = document.getElementById('active-profile-name');

    if (profileBadge && profileName && this.lockedUnit) {
      profileBadge.textContent = '';
      profileName.textContent = `Nutri (${this.lockedUnit.loja})`;
    }

    const btnChangeProfile = document.getElementById('btn-change-profile');
    if (btnChangeProfile) {
      btnChangeProfile.style.display = 'none';
    }

    const btnAdmin = document.getElementById('btn-open-admin');
    if (btnAdmin) {
      btnAdmin.style.display = 'none';
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

  renderHeader() {
    const profileBadge = document.getElementById('active-profile-badge');
    const profileName = document.getElementById('active-profile-name');

    if (profileBadge && profileName && this.currentProfile) {
      profileBadge.textContent = this.currentProfile.icone || '';
      profileName.textContent = this.currentProfile.nome;
    }

    const btnChangeProfile = document.getElementById('btn-change-profile');
    if (btnChangeProfile) {
      btnChangeProfile.style.display = 'inline-flex';
      btnChangeProfile.innerHTML = ' Sair da Gestão';
      btnChangeProfile.onclick = () => {
        sessionStorage.removeItem('abib_manager_logged');
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

  renderTokenInvalidView() {
    const container = document.getElementById('main-view-container');
    if (!container) return;
    container.innerHTML = `
      <div class="admin-auth-overlay">
        <div class="admin-auth-card">
          <div class="auth-icon"></div>
          <h2>Link ou Token Inválido</h2>
          <p class="subtitle">O link de cotação de hortifrúti desta unidade é inválido ou foi revogado.</p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">Solicite um novo link de acesso direto ao seu gestor da ABIB.</p>

          <button id="btn-unlock-master-invalid" class="btn btn-primary btn-block">Entrar com Senha Máster de Gerente</button>
        </div>
      </div>
    `;

    container.querySelector('#btn-unlock-master-invalid').onclick = () => {
      this.renderManagerLoginView();
    };
  }

  async switchView(viewName) {
    if (this.lockedModule && viewName === 'dashboard') {
      viewName = this.lockedModule;
    }

    // Verificar autorização para a visualização destino
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
      await this.comensaisModule.render(viewContainer, this.currentProfile, null);
    } else if (viewName === 'comensais-relatorios') {
      await this.comensaisReportView.render(viewContainer, this.currentProfile);
    } else if (viewName === 'hortifruti') {
      await this.hortifrutiModule.render(viewContainer, this.currentProfile, this.lockedUnit);
    } else if (viewName === 'admin') {
      this.adminPanel.render(viewContainer);
    }
  }

  renderDashboard(container) {
    const allowedModules = (this.currentProfile && this.currentProfile.modulos) || ['comensais', 'hortifruti'];

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
            <p>Cotação comparativa (Sacolão x Mart Minas), apoio a pedidos, gerador de links das lojas e auditoria mensal de NFs.</p>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="dashboard-welcome">
        <h2>Selecione um Módulo para iniciar:</h2>
        <p class="subtitle">Painel Consolidado de Gestão ABIB (Acesso Liberado para Diretoria)</p>
      </div>

      <div class="modules-cards-grid">
        ${modulesHTML}

        <div class="card-module-disabled">
          <div class="module-card-info">
            <h3>Inventário de Pratos & Louças</h3>
            <p>Módulo de controle de estoque de talheres e louças (Em Breve).</p>
          </div>
          <span class="badge-soon">Em Breve</span>
        </div>

        <div class="card-module-disabled">
          <div class="module-card-info">
            <h3>Preços & Custos por Unidade</h3>
            <p>Módulo de acompanhamento de preços de refeições e insumos (Em Breve).</p>
          </div>
          <span class="badge-soon">Em Breve</span>
        </div>
      </div>
    `;

    const cardComensais = container.querySelector('#card-modulo-comensais');
    if (cardComensais) {
      cardComensais.onclick = () => {
        this.switchView('comensais');
      };
    }

    const cardHortifruti = container.querySelector('#card-modulo-hortifruti');
    if (cardHortifruti) {
      cardHortifruti.onclick = () => {
        this.switchView('hortifruti');
      };
    }
  }
}

// Inicializar na janela global
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
