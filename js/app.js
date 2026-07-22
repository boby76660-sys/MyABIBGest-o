/**
 * App Controller Main - Inicializador Principal e Roteador SPA
 */

import { initFirebase } from './firebaseClient.js';
import { getAdminConfig } from './services/adminService.js';
import { getActiveProfile, renderProfileSelectorModal, setActiveProfileId } from './admin/profileManager.js';
import { ModuleRegistry } from './modules/moduleRegistry.js';
import { ComensaisModule } from './modules/comensais/comensaisView.js';
import { ComensaisReportView } from './modules/comensais/comensaisReport.js';
import { AdminPanel } from './admin/adminPanel.js';

class AppController {
  constructor() {
    this.currentProfile = null;
    this.currentView = 'dashboard';
    this.comensaisModule = new ComensaisModule();
    this.comensaisReportView = new ComensaisReportView(this);
    this.adminPanel = new AdminPanel(this);
  }

  async init() {
    console.log("🚀 Inicializando Sistema de Gestão ABIB...");

    // Registrar Módulo de Comensais
    ModuleRegistry.register(this.comensaisModule);

    // Inicializar Firebase se houver config
    const config = await getAdminConfig();
    if (config.firebaseConfig) {
      initFirebase(config.firebaseConfig);
    }

    // Verificar Perfil Ativo
    this.currentProfile = await getActiveProfile();

    if (!this.currentProfile) {
      await renderProfileSelectorModal(document.body, (profile) => {
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
      profileBadge.textContent = this.currentProfile.icone || '👤';
      profileName.textContent = this.currentProfile.nome;
    }

    // Eventos do Header
    const btnChangeProfile = document.getElementById('btn-change-profile');
    if (btnChangeProfile) {
      btnChangeProfile.onclick = async () => {
        await renderProfileSelectorModal(document.body, (profile) => {
          this.currentProfile = profile;
          this.renderApp();
        });
      };
    }

    const btnAdmin = document.getElementById('btn-open-admin');
    if (btnAdmin) {
      btnAdmin.onclick = () => {
        this.switchView('admin');
      };
    }

    const btnHome = document.getElementById('btn-go-home');
    if (btnHome) {
      btnHome.onclick = () => {
        this.switchView('dashboard');
      };
    }
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
        <h2>👋 Olá! Selecione um Módulo para iniciar:</h2>
        <p class="subtitle">Módulos liberados para o perfil <strong>${this.currentProfile ? this.currentProfile.nome : 'Padrão'}</strong>:</p>
      </div>

      <div class="modules-cards-grid">
        <div class="card-module-primary" id="card-modulo-comensais">
          <div class="module-card-icon">🍽️</div>
          <div class="module-card-info">
            <h3>Comensais Diários</h3>
            <p>Registro rápido das 21 unidades, status 🔴/🟢, avisos de discrepância e envio para WhatsApp.</p>
          </div>
          <div class="module-card-arrow">➡️</div>
        </div>

        <div class="card-module-disabled">
          <div class="module-card-icon">📦</div>
          <div class="module-card-info">
            <h3>Inventário de Pratos & Louças</h3>
            <p>Módulo de controle de estoque de talheres e louças (Em Breve).</p>
          </div>
          <span class="badge-soon">Em Breve</span>
        </div>

        <div class="card-module-disabled">
          <div class="module-card-icon">💰</div>
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
  }
}

// Inicializar na janela global
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
  window.app.init();
});
