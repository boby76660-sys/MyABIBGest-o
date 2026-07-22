/**
 * Firebase Client Wrapper - Realtime Database
 * Gerencia a inicialização do SDK Firebase Realtime Database
 */

let rtdb = null;
let isFirebaseActive = false;

export function initFirebase(config) {
  if (!config || !config.apiKey || (!config.databaseURL && !config.projectId)) {
    console.warn("⚠️ Firebase Realtime Database não configurado. Utilizando modo LocalStorage offline.");
    isFirebaseActive = false;
    rtdb = null;
    return false;
  }

  try {
    if (window.firebase && window.firebase.apps) {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(config);
      }
      rtdb = window.firebase.database();
      isFirebaseActive = true;
      console.log("🔥 Firebase Realtime Database conectado com sucesso!");
      return true;
    } else {
      console.warn("⚠️ SDK do Firebase Realtime Database não encontrado na janela global.");
      isFirebaseActive = false;
      return false;
    }
  } catch (err) {
    console.error("❌ Erro ao inicializar Firebase Realtime Database:", err);
    isFirebaseActive = false;
    return false;
  }
}

export function getRealtimeDB() {
  return rtdb;
}

export function checkIsFirebaseActive() {
  return isFirebaseActive;
}
