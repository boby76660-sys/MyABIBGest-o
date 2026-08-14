/**
 * Admin Panel - Painel Administrativo Completo Protegido por Senha Máster
 * Gerenciamento de Unidades, Públicos, Perfis, Firebase e Gerador de Links de WhatsApp
 */

import { getUnidades, saveUnidade, regenerateUnitToken, getPublicos, savePublico, getPerfis, savePerfil, deletePerfil, getAdminConfig, updateAdminConfig, exportFullBackup } from '../services/adminService.js';
import { initFirebase } from '../firebaseClient.js';
import { DEFAULT_ADMIN_PASSWORD } from '../config.js';

export class AdminPanel {
  constructor(appController) {
    this.appController = appController;
    this.isAuthenticated = false;
  }

  render(container) {
    this.container = container;

    if (!this.isAuthenticated) {
      this.renderPasswordModal();
    } else {
      this.renderPanelContent();
    }
  }

  renderPasswordModal() {
    this.container.innerHTML = `
      <div class="admin-auth-overlay">
        <div class="admin-auth-card">
          <div class="auth-icon"></div>
          <h2>Painel Administrativo</h2>
          <p class="subtitle">Digite a Senha Máster para continuar</p>

          <form id="form-admin-auth">
            <input type="password" id="input-admin-password" class="input-field" placeholder="Digite a senha..." autofocus required>
            <button type="submit" class="btn btn-primary btn-block">Acessar Painel Admin</button>
          </form>
          <button id="btn-cancel-admin" class="btn btn-link">⬅ Cancelar e Voltar</button>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#form-admin-auth');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = this.container.querySelector('#input-admin-password').value;
      const config = await getAdminConfig();
      const masterPass = config.adminPassword || DEFAULT_ADMIN_PASSWORD;

      if (pass === masterPass) {
        this.isAuthenticated = true;
        this.renderPanelContent();
      } else {
        alert("Senha incorreta! Tente novamente.");
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
          <div class="admin-logo">
            
            <h3>Painel Admin</h3>
          </div>
          <nav class="admin-nav">
            <button class="nav-tab active" data-tab="links-whatsapp">Links do WhatsApp</button>
            <button class="nav-tab" data-tab="unidades"> Unidades (${(await getUnidades()).length})</button>
            <button class="nav-tab" data-tab="publicos">Públicos / Refeições</button>
            <button class="nav-tab" data-tab="perfis">Perfis e Visibilidade</button>
            <button class="nav-tab" data-tab="firebase">Configurar Firebase</button>
            <button class="nav-tab" data-tab="backup">Backup & Importação</button>
          </nav>
          <div class="admin-sidebar-footer">
            <button id="btn-sair-admin" class="btn btn-secondary btn-block"> Sair do Admin</button>
          </div>
        </div>

        <div class="admin-content-area" id="admin-tab-body">
          <!-- Conteúdo da aba ativa -->
        </div>
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
        const tabKey = tab.getAttribute('data-tab');
        await this.loadTabContent(tabKey);
      });
    });

    this.container.querySelector('#btn-sair-admin').addEventListener('click', () => {
      this.isAuthenticated = false;
      window.app.switchView('dashboard');
    });
  }

  async loadTabContent(tabKey) {
    const body = this.container.querySelector('#admin-tab-body');

    if (tabKey === 'links-whatsapp') {
      await this.renderLinksWhatsAppTab(body);
    } else if (tabKey === 'unidades') {
      await this.renderUnidadesTab(body);
    } else if (tabKey === 'publicos') {
      await this.renderPublicosTab(body);
    } else if (tabKey === 'perfis') {
      await this.renderPerfisTab(body);
    } else if (tabKey === 'firebase') {
      await this.renderFirebaseTab(body);
    } else if (tabKey === 'backup') {
      await this.renderBackupTab(body);
    }
  }

  // --- ABA DE LINKS DO WHATSAPP ---
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
        alert(`Link direto restrito para ${name} copiado com sucesso!`);
      });
    });

    body.querySelectorAll('.btn-copy-whatsapp-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const loja = btn.getAttribute('data-loja');
        const link = btn.getAttribute('data-link');
        
        const temp = document.createElement('textarea');
        temp.value = link;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        
        alert(`Link da unidade ${loja} copiado com sucesso!`);
      });
    });

    body.querySelectorAll('.btn-regerar-token').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        const loja = btn.getAttribute('data-loja');
        if (confirm(`Atenção: Deseja revogar o link antigo e gerar um NOVO token seguro para a unidade ${loja}?\n\nO link antigo deixará de funcionar.`)) {
          await regenerateUnitToken(id);
          alert(`Novo token gerado com sucesso para a unidade ${loja}!`);
          await this.renderLinksWhatsAppTab(body);
        }
      });
    });
  }

  // --- ABA 1: GESTÃO DE UNIDADES ---
  async renderUnidadesTab(body) {
    const unidades = await getUnidades();

    body.innerHTML = `
      <div class="tab-header">
        <h3> Cadastro e Gestão das 21 Unidades</h3>
        <button id="btn-nova-unidade" class="btn btn-primary">Nova Unidade</button>
      </div>

      <div class="table-responsive-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Cód</th>
              <th>Grupo</th>
              <th>Loja</th>
              <th>Filial / Unidade</th>
              <th>CNPJ</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${unidades.map(u => `
              <tr>
                <td>${u.codigo || '-'}</td>
                <td><span class="badge-tag">${u.grupo || '-'}</span></td>
                <td><strong>${u.loja}</strong></td>
                <td>${u.unidade || '-'}</td>
                <td><code>${u.cnpj || '-'}</code></td>
                <td>${u.ativo !== false ? '🟢 Ativo' : 'Inativo'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary btn-edit-unidade" data-id="${u.id}">Editar</button>
                </td>
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
            <div class="modal-body">
              <div class="form-row">
                <div class="form-group">
                  <label>Código:</label>
                  <input type="text" id="u-codigo" class="input-field" placeholder="ex: 259">
                </div>
                <div class="form-group">
                  <label>Grupo:</label>
                  <input type="text" id="u-grupo" class="input-field" placeholder="ex: MOC, ABIB, AC">
                </div>
              </div>
              <div class="form-group">
                <label>Nome da Loja:*</label>
                <input type="text" id="u-loja" class="input-field" required placeholder="ex: MONTES CLAROS II">
              </div>
              <div class="form-group">
                <label>Subdivisão / Tipo de Unidade:</label>
                <input type="text" id="u-unidade" class="input-field" placeholder="ex: FILIAL 1, MATRIZ">
              </div>
              <div class="form-group">
                <label>CNPJ Formatado:</label>
                <input type="text" id="u-cnpj" class="input-field" placeholder="ex: 50.940.370/0002-68">
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary btn-block">Salvar Unidade</button>
            </div>
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

    body.querySelector('.btn-close-modal').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    body.querySelectorAll('.btn-edit-unidade').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const target = unidades.find(u => u.id === id);
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
      const id = body.querySelector('#edit-unidade-id').value;
      const target = unidades.find(u => u.id === id) || {};

      target.codigo = body.querySelector('#u-codigo').value;
      target.grupo = body.querySelector('#u-grupo').value;
      target.loja = body.querySelector('#u-loja').value;
      target.unidade = body.querySelector('#u-unidade').value;
      target.cnpj = body.querySelector('#u-cnpj').value;

      await saveUnidade(target);
      modal.classList.add('hidden');
      await this.renderUnidadesTab(body);
    });
  }

  // --- ABA 2: PÚBLICOS ---
  async renderPublicosTab(body) {
    const publicos = await getPublicos();

    body.innerHTML = `
      <div class="tab-header">
        <h3>Categorias de Públicos de Comensais</h3>
        <button id="btn-novo-publico" class="btn btn-primary">Novo Público</button>
      </div>

      <div class="table-responsive-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Nome do Público</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${publicos.map(p => `
              <tr>
                <td>${p.ordem || '-'}</td>
                <td><strong>${p.nome}</strong></td>
                <td>${p.ativo !== false ? '🟢 Ativo' : 'Inativo'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary btn-edit-publico" data-id="${p.id}">Editar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- ABA 3: PERFIS DE ACESSO ---
  async renderPerfisTab(body) {
    const perfis = await getPerfis();

    body.innerHTML = `
      <div class="tab-header">
        <h3>Perfis de Acesso & Permissões</h3>
      </div>

      <div class="perfis-grid">
        ${perfis.map(p => `
          <div class="card-perfil">
            <div class="card-perfil-header">
              <span>${p.icone || ''}</span>
              <h4>${p.nome}</h4>
            </div>
            <p>${p.descricao || ''}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- ABA 4: FIREBASE CONFIG & SENHAS ---
  async renderFirebaseTab(body) {
    const config = await getAdminConfig();
    const fb = config.firebaseConfig || {};

    body.innerHTML = `
      <div class="tab-header">
        <h3>Configuração de Senhas & Banco Cloud (Firebase)</h3>
      </div>

      <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
        <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-title); margin-bottom: 6px;">
          Senhas de Acesso aos Módulos & Gerência
        </h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
          Defina a Senha Máster Geral e as senhas exclusivas de cada módulo. A Senha Máster de Gerente libera acesso total.
        </p>

        <form id="form-passwords-config" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="form-group">
            <label style="font-weight: 700;">Senha Máster Geral (Gerência / Diretoria):</label>
            <input type="text" id="cfg-adminPassword" class="input-field" value="${config.adminPassword || 'Gestao@5170'}">
          </div>
          <div class="form-group">
            <label style="font-weight: 700;">Senha Exclusiva: Módulo Comensais Diários:</label>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <input type="text" id="cfg-passwordComensais" class="input-field" style="flex: 1; min-width: 200px;" value="${config.passwordComensais || 'Comensais@3928'}">
              <button type="button" id="btn-gen-pass-comensais" class="btn btn-sm btn-secondary" style="white-space: nowrap;">
                Gerar Nova Sequência
              </button>
            </div>
          </div>
          <div class="form-group">
            <label style="font-weight: 700;">Senha Exclusiva: Módulo Hortifrúti Semanal:</label>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <input type="text" id="cfg-passwordHortifruti" class="input-field" style="flex: 1; min-width: 200px;" value="${config.passwordHortifruti || 'Hortifruti@6481'}">
              <button type="button" id="btn-gen-pass-hortifruti" class="btn btn-sm btn-secondary" style="white-space: nowrap;">
                Gerar Nova Sequência
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="align-self: flex-start; margin-top: 4px;">Salvar Senhas</button>
        </form>
      </div>

      <form id="form-firebase-config" class="form-card">
        <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-title); margin-bottom: 12px;">
          Conexão Google Firebase (Cloud Sync)
        </h4>
        <div class="form-group">
          <label>API Key:</label>
          <input type="text" id="fb-apiKey" class="input-field" value="${fb.apiKey || ''}">
        </div>
        <div class="form-group">
          <label>Database URL:</label>
          <input type="text" id="fb-databaseURL" class="input-field" value="${fb.databaseURL || ''}">
        </div>
        <div class="form-group">
          <label>Project ID:</label>
          <input type="text" id="fb-projectId" class="input-field" value="${fb.projectId || ''}">
        </div>
        <button type="submit" class="btn btn-secondary">Salvar Configuração Firebase</button>
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
      
      await updateAdminConfig({ adminPassword, passwordComensais, passwordHortifruti });
      alert("Senhas de acesso atualizadas com sucesso!");
    });

    body.querySelector('#form-firebase-config').addEventListener('submit', async (e) => {
      e.preventDefault();
      const newFbConfig = {
        apiKey: body.querySelector('#fb-apiKey').value,
        databaseURL: body.querySelector('#fb-databaseURL').value,
        projectId: body.querySelector('#fb-projectId').value
      };
      await updateAdminConfig({ firebaseConfig: newFbConfig });
      initFirebase(newFbConfig);
      alert("Configuração do Firebase atualizada com sucesso!");
    });
  }

  // --- ABA 5: BACKUP ---
  async renderBackupTab(body) {
    body.innerHTML = `
      <div class="tab-header">
        <h3>Backup e Restauração JSON</h3>
      </div>

      <div class="backup-actions">
        <button id="btn-export-json" class="btn btn-primary">Baixar Backup JSON Completo</button>
      </div>
    `;

    body.querySelector('#btn-export-json').addEventListener('click', async () => {
      const data = await exportFullBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_abib_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}
