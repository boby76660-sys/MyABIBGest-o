/**
 * Profile Manager - Gestão do Perfil Ativo do Usuário
 */

import { getPerfis } from '../services/adminService.js';

const ACTIVE_PROFILE_KEY = 'abib_gestao_active_profile_id';

export async function getActiveProfile() {
  const perfis = await getPerfis();
  const savedId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (savedId) {
    const found = perfis.find(p => p.id === savedId);
    if (found) return found;
  }
  return null; // Força seleção se não houver perfil ativo
}

export function setActiveProfileId(profileId) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
}

export async function renderProfileSelectorModal(containerElement, onProfileSelectedCallback) {
  const perfis = await getPerfis();

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'profile-modal-overlay';
  modalOverlay.innerHTML = `
    <div class="profile-modal-card">
      <div class="profile-modal-header">
        <h2>👋 Bem-vindo ao Sistema de Gestão ABIB</h2>
        <p class="subtitle">Selecione seu Perfil de Acesso para continuar:</p>
      </div>

      <div class="profiles-selection-grid">
        ${perfis.map(p => `
          <button class="btn-profile-card" data-profile-id="${p.id}">
            <span class="profile-card-icon">${p.icone || '👤'}</span>
            <div class="profile-card-text">
              <h4>${p.nome}</h4>
              <p>${p.descricao || ''}</p>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  modalOverlay.querySelectorAll('.btn-profile-card').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-profile-id');
      setActiveProfileId(id);
      document.body.removeChild(modalOverlay);
      if (onProfileSelectedCallback) {
        const selected = perfis.find(p => p.id === id);
        onProfileSelectedCallback(selected);
      }
    });
  });
}
