/**
 * Admin Panel - Painel Administrativo Completo Protegido por Senha Máster
 */

import { getUnidades, saveUnidade, getPublicos, savePublico, getPerfis, savePerfil, deletePerfil, getAdminConfig, updateAdminConfig, exportFullBackup, importFullBackup } from '../services/adminService.js';
import { initFirebase } from '../firebaseClient.js';

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
          <div class="auth-icon">🔒</div>
          <h2>Painel Administrativo</h2>
          <p class="subtitle">Digite a Senha Máster para continuar</p>

          <form id="form-admin-auth">
            <input type="password" id="input-admin-password" class="input-field" placeholder="Digite a senha..." autofocus required>
            <button type="submit" class="btn btn-primary btn-block">Acessar Painel Admin</button>
          </form>
          <button id="btn-cancel-admin" class="btn btn-link">⬅️ Cancelar e Voltar</button>
        </div>
      </div>
    `;

    const form = this.container.querySelector('#form-admin-auth');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pass = this.container.querySelector('#input-admin-password').value;
      const config = await getAdminConfig();
      const masterPass = config.adminPassword || 'admin123';

      if (pass === masterPass) {
        this.isAuthenticated = true;
        this.renderPanelContent();
      } else {
        alert("❌ Senha incorreta! Tente novamente.");
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
            <span>⚙️</span>
            <h3>Painel Admin</h3>
          </div>
          <nav class="admin-nav">
            <button class="nav-tab active" data-tab="unidades">🏢 Unidades (${(await getUnidades()).length})</button>
            <button class="nav-tab" data-tab="publicos">👥 Públicos / Refeições</button>
            <button class="nav-tab" data-tab="perfis">👤 Perfis e Visibilidade</button>
            <button class="nav-tab" data-tab="firebase">🔥 Configurar Firebase</button>
            <button class="nav-tab" data-tab="backup">💾 Backup & Importação</button>
          </nav>
          <div class="admin-sidebar-footer">
            <button id="btn-sair-admin" class="btn btn-secondary btn-block">🚪 Sair do Admin</button>
          </div>
        </div>

        <div class="admin-content-area" id="admin-tab-body">
          <!-- Conteúdo da aba ativa -->
        </div>
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

    if (tabKey === 'unidades') {
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

  // --- ABA 1: GESTÃO DE UNIDADES ---
  async renderUnidadesTab(body) {
    const unidades = await getUnidades();

    body.innerHTML = `
      <div class="tab-header">
        <h3>🏢 Cadastro e Gestão das 21 Unidades</h3>
        <button id="btn-nova-unidade" class="btn btn-primary">➕ Nova Unidade</button>
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
                <td>${u.ativo !== false ? '🟢 Ativo' : '🔴 Inativo'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary btn-edit-unidade" data-id="${u.id}">✏️ Editar</button>
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
            <button class="btn-close-modal">&times;</button>
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
        const target = unidades.find(x => x.id === id);
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
      const codigo = body.querySelector('#u-codigo').value;
      const grupo = body.querySelector('#u-grupo').value;
      const loja = body.querySelector('#u-loja').value;
      const unidade = body.querySelector('#u-unidade').value;
      const cnpj = body.querySelector('#u-cnpj').value;

      await saveUnidade({ id: id || undefined, codigo, grupo, loja, unidade, cnpj, ativo: true });
      modal.classList.add('hidden');
      await this.renderUnidadesTab(body);
    });
  }

  // --- ABA 2: GESTÃO DE PÚBLICOS ---
  async renderPublicosTab(body) {
    const publicos = await getPublicos();

    body.innerHTML = `
      <div class="tab-header">
        <h3>👥 Categorias de Públicos de Refeição</h3>
        <button id="btn-novo-publico" class="btn btn-primary">➕ Novo Público</button>
      </div>

      <div class="table-responsive-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Nome da Categoria</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${publicos.map(p => `
              <tr>
                <td>${p.ordem || 1}</td>
                <td><strong>${p.nome}</strong></td>
                <td>${p.ativo !== false ? '🟢 Ativo' : '🔴 Inativo'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary btn-edit-pub" data-id="${p.id}">✏️ Editar</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    body.querySelector('#btn-novo-publico').addEventListener('click', async () => {
      const nome = prompt("Nome da nova categoria de público (ex: Diretoria, Eventos):");
      if (nome) {
        await savePublico({ nome });
        await this.renderPublicosTab(body);
      }
    });

    body.querySelectorAll('.btn-edit-pub').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const pub = publicos.find(x => x.id === id);
        if (pub) {
          const novoNome = prompt("Novo nome para o público:", pub.nome);
          if (novoNome) {
            await savePublico({ ...pub, nome: novoNome });
            await this.renderPublicosTab(body);
          }
        }
      });
    });
  }

  // --- ABA 3: PERFIS E VISIBILIDADE DE CAMPOS ---
  async renderPerfisTab(body) {
    const perfis = await getPerfis();

    body.innerHTML = `
      <div class="tab-header">
        <h3>👤 Gerenciamento de Perfis e Permissões de Visibilidade</h3>
        <button id="btn-novo-perfil" class="btn btn-primary">➕ Novo Perfil</button>
      </div>

      <p class="help-text">Defina aqui quais campos das empresas (Código, Grupo, Loja, Unidade, CNPJ) ficam visíveis para cada perfil:</p>

      <div class="perfis-cards-grid">
        ${perfis.map(p => {
          const campos = p.permissoesCamposUnidade || ["loja"];
          return `
            <div class="card-perfil-admin">
              <div class="card-perfil-header">
                <span class="perfil-icon">${p.icone || '👤'}</span>
                <div>
                  <h4>${p.nome}</h4>
                  <p class="perfil-desc">${p.descricao || ''}</p>
                </div>
              </div>

              <div class="field-permissions-box">
                <h5>👁️ Campos das Empresas Visíveis:</h5>
                <div class="checkbox-grid" data-perfil-id="${p.id}">
                  <label><input type="checkbox" value="codigo" ${campos.includes('codigo') ? 'checked' : ''}> Código</label>
                  <label><input type="checkbox" value="grupo" ${campos.includes('grupo') ? 'checked' : ''}> Grupo (AC/ABIB/MOC)</label>
                  <label><input type="checkbox" value="loja" ${campos.includes('loja') ? 'checked' : ''}> Nome da Loja</label>
                  <label><input type="checkbox" value="unidade" ${campos.includes('unidade') ? 'checked' : ''}> Filial / Matriz</label>
                  <label><input type="checkbox" value="cnpj" ${campos.includes('cnpj') ? 'checked' : ''}> CNPJ</label>
                </div>
              </div>

              <div class="card-perfil-actions">
                <button class="btn btn-sm btn-primary btn-save-perfil-perm" data-id="${p.id}">💾 Salvar Permissões</button>
                <button class="btn btn-sm btn-danger btn-del-perfil" data-id="${p.id}">🗑️ Excluir</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    body.querySelector('#btn-novo-perfil').addEventListener('click', async () => {
      const nome = prompt("Nome do novo perfil (ex: Supervisor Regional):");
      if (nome) {
        await savePerfil({ nome, icone: '👩‍💻', modulos: ['comensais'], permissoesCamposUnidade: ['loja', 'grupo'] });
        await this.renderPerfisTab(body);
      }
    });

    body.querySelectorAll('.btn-save-perfil-perm').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const perfil = perfis.find(x => x.id === id);
        const box = body.querySelector(`.checkbox-grid[data-perfil-id="${id}"]`);
        const checked = Array.from(box.querySelectorAll('input:checked')).map(cb => cb.value);

        await savePerfil({ ...perfil, permissoesCamposUnidade: checked });
        alert(`✅ Permissões de campos salvas para o perfil ${perfil.nome}!`);
      });
    });

    body.querySelectorAll('.btn-del-perfil').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm("Deseja realmente excluir este perfil?")) {
          await deletePerfil(id);
          await this.renderPerfisTab(body);
        }
      });
    });
  }

  // --- ABA 4: CONFIGURAÇÃO DO FIREBASE (REALTIME DATABASE) ---
  async renderFirebaseTab(body) {
    const config = await getAdminConfig();
    const fb = config.firebaseConfig || {};

    body.innerHTML = `
      <div class="tab-header">
        <h3>🔥 Configuração do Google Firebase (Realtime Database)</h3>
      </div>

      <p class="help-text">Cole aqui as credenciais do seu aplicativo Firebase para ativar a sincronização em tempo real na nuvem do Google:</p>

      <form id="form-firebase-config" class="form-card">
        <div class="form-group">
          <label>API Key (apiKey):*</label>
          <input type="text" id="fb-apikey" class="input-field" value="${fb.apiKey || ''}" placeholder="AIzaSyD-...">
        </div>
        <div class="form-group">
          <label>Database URL (databaseURL):*</label>
          <input type="text" id="fb-databaseurl" class="input-field" value="${fb.databaseURL || ''}" placeholder="https://abib-gestao-default-rtdb.firebaseio.com">
        </div>
        <div class="form-group">
          <label>Project ID (projectId):</label>
          <input type="text" id="fb-projectid" class="input-field" value="${fb.projectId || ''}" placeholder="abib-gestao">
        </div>

        <button type="submit" class="btn btn-primary btn-block">💾 Salvar Credenciais do Realtime Database</button>
      </form>
    `;

    body.querySelector('#form-firebase-config').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fbConfig = {
        apiKey: body.querySelector('#fb-apikey').value.trim(),
        databaseURL: body.querySelector('#fb-databaseurl').value.trim(),
        projectId: body.querySelector('#fb-projectid').value.trim()
      };

      await updateAdminConfig({ firebaseConfig: fbConfig });
      initFirebase(fbConfig);
      alert("✅ Configurações do Firebase Realtime Database salvas e inicializadas!");
    });
  }

  // --- ABA 5: BACKUP & IMPORTAÇÃO ---
  async renderBackupTab(body) {
    body.innerHTML = `
      <div class="tab-header">
        <h3>💾 Backup e Importação de Dados</h3>
      </div>

      <div class="backup-grid">
        <div class="backup-card">
          <h4>📥 Exportar Backup Completo</h4>
          <p>Baixe um arquivo JSON contendo todas as 21 unidades, perfis, públicos e históricos de comensais.</p>
          <button id="btn-export-json" class="btn btn-primary">Download Backup JSON</button>
        </div>

        <div class="backup-card">
          <h4>📤 Restaurar Backup</h4>
          <p>Selecione um arquivo JSON de backup salvo anteriormente para restaurar o sistema.</p>
          <input type="file" id="input-import-json" accept=".json" class="input-file">
        </div>
      </div>
    `;

    body.querySelector('#btn-export-json').addEventListener('click', async () => {
      const data = await exportFullBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_gestao_abib_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    body.querySelector('#input-import-json').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const parsed = JSON.parse(evt.target.result);
            await importFullBackup(parsed);
            alert("✅ Backup restaurado com sucesso!");
            window.location.reload();
          } catch (err) {
            alert("❌ Erro ao importar backup: " + err.message);
          }
        };
        reader.readAsText(file);
      }
    });
  }
}
