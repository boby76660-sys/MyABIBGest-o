/**
 * Configurações Gerais e Dados Iniciais (Seeds) do Sistema de Gestão ABIB
 */

export const DEFAULT_ADMIN_PASSWORD = "Gestao@3003";
export const DEFAULT_COMENSAIS_PASSWORD = "Comensais@0712";
export const DEFAULT_HORTIFRUTI_PASSWORD = "Horti@6481";

// Configurações do Firebase Realtime Database
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCqwneS6nVKojloKFAAfBVRsZGiLDDaFc4",
  databaseURL: "https://myabib-v6-default-rtdb.firebaseio.com/",
  projectId: "myabib-v6",
  authDomain: "myabib-v6.firebaseapp.com",
  storageBucket: "myabib-v6.appspot.com"
};

// Configurações Padrão de IA OCR (OpenRouter)
export const DEFAULT_OPENROUTER_CONFIG = {
  apiKey: "",
  model: "google/gemini-3.7-flash"
};

// Dados Padrão de Públicos / Categorias de Comensais
export const PUBLICOS_SEED = [
  { id: "pub_ticket", nome: "Tickets", ordem: 1, ativo: true },
  { id: "pub_garra", nome: "Garra / Estrela D'Alva", ordem: 2, ativo: true },
  { id: "pub_promotores_cartao", nome: "Promotores ou Motoristas - Cartão", ordem: 3, ativo: true },
  { id: "pub_promotores_pix", nome: "Promotores ou Motoristas - Pix", ordem: 4, ativo: true },
  { id: "pub_assinaturas", nome: "Assinaturas", ordem: 5, ativo: true }
];


// Dados Padrão das 21 Unidades com Metadados Completos
export const UNIDADES_SEED = [
  { id: "u239", codigo: "239", grupo: "AC", loja: "ITABIRA", unidade: "MATRIZ", cnpj: "44.509.964/0001-35", tokenAcesso: "abib_itabira_239", ordem: 1, ativo: true },
  { id: "u220", codigo: "220", grupo: "AC", loja: "UBÁ", unidade: "FILIAL 1", cnpj: "44.509.964/0002-16", tokenAcesso: "abib_uba_220", ordem: 2, ativo: true },
  { id: "u253", codigo: "253", grupo: "AC", loja: "JUIZ DE FORA II", unidade: "FILIAL 2", cnpj: "44.509.964/0003-05", tokenAcesso: "abib_juizdeforaii_253", ordem: 3, ativo: true },
  { id: "u206", codigo: "206", grupo: "AC", loja: "JUIZ DE FORA I", unidade: "FILIAL 3", cnpj: "44.509.964/0004-88", tokenAcesso: "abib_juizdeforai_206", ordem: 4, ativo: true },
  { id: "u230", codigo: "230", grupo: "AC", loja: "BARBACENA", unidade: "FILIAL 4", cnpj: "44.509.964/0005-69", tokenAcesso: "abib_barbacena_230", ordem: 5, ativo: true },
  { id: "u257", codigo: "257", grupo: "AC", loja: "CONGONHAS", unidade: "FILIAL 5", cnpj: "44.509.964/0006-40", tokenAcesso: "abib_congonhas_257", ordem: 6, ativo: true },
  { id: "u234", codigo: "234", grupo: "AC", loja: "CONSELHEIRO LAFAIETE", unidade: "FILIAL 6", cnpj: "44.509.964/0007-20", tokenAcesso: "abib_conselheirolafaiete_234", ordem: 7, ativo: true },
  { id: "u241", codigo: "241", grupo: "AC", loja: "SÃO JOÃO DEL REI", unidade: "FILIAL 7", cnpj: "44.509.964/0008-01", tokenAcesso: "abib_saojoaodelrei_241", ordem: 8, ativo: true },
  { id: "u217", codigo: "217", grupo: "ABIB", loja: "SANTANA DO PARAÍSO", unidade: "MATRIZ", cnpj: "25.191.364/0001-27", tokenAcesso: "abib_santanadoparaiso_217", ordem: 9, ativo: true },
  { id: "u244", codigo: "244", grupo: "ABIB", loja: "JOÃO MONLEVADE", unidade: "FILIAL 1", cnpj: "25.191.364/0002-08", tokenAcesso: "abib_joaomonlevade_244", ordem: 10, ativo: true },
  { id: "u255", codigo: "255", grupo: "ABIB", loja: "LEOPOLDINA", unidade: "FILIAL 2", cnpj: "25.191.364/0003-99", tokenAcesso: "abib_leopoldina_255", ordem: 11, ativo: true },
  { id: "u256", codigo: "256", grupo: "ABIB", loja: "CARATINGA", unidade: "FILIAL 3", cnpj: "25.191.364/0004-70", tokenAcesso: "abib_caratinga_256", ordem: 12, ativo: true },
  { id: "u224", codigo: "224", grupo: "ABIB", loja: "PARACATU", unidade: "FILIAL 4", cnpj: "25.191.364/0005-50", tokenAcesso: "abib_paracatu_224", ordem: 13, ativo: true },
  { id: "u240", codigo: "240", grupo: "ABIB", loja: "UNAÍ", unidade: "FILIAL 5", cnpj: "25.191.364/0006-31", tokenAcesso: "abib_unai_240", ordem: 14, ativo: true },
  { id: "u219", codigo: "219", grupo: "MOC", loja: "MONTES CLAROS I", unidade: "MATRIZ", cnpj: "50.940.370/0001-87", tokenAcesso: "abib_montesclarosi_219", ordem: 15, ativo: true },
  { id: "u259", codigo: "259", grupo: "MOC", loja: "MONTES CLAROS II", unidade: "FILIAL 1", cnpj: "50.940.370/0002-68", tokenAcesso: "abib_montesclarosii_259", ordem: 16, ativo: true },
  { id: "u260", codigo: "260", grupo: "MOC", loja: "MONTES CLAROS III", unidade: "FILIAL 2", cnpj: "50.940.370/0003-49", tokenAcesso: "abib_montesclarosiii_260", ordem: 17, ativo: true },
  { id: "u250", codigo: "250", grupo: "MOC", loja: "JANAÚBA", unidade: "FILIAL 3", cnpj: "50.940.370/0004-20", tokenAcesso: "abib_janauba_250", ordem: 18, ativo: true },
  { id: "u267", codigo: "267", grupo: "MOC", loja: "CURVELO", unidade: "FILIAL 4", cnpj: "50.940.370/0005-00", tokenAcesso: "abib_curvelo_267", ordem: 19, ativo: true },
  { id: "u272", codigo: "272", grupo: "MOC", loja: "PIRAPORA", unidade: "FILIAL 5", cnpj: "50.940.370/0006-91", tokenAcesso: "abib_pirapora_272", ordem: 20, ativo: true },
  { id: "u274", codigo: "274", grupo: "MOC", loja: "JANUÁRIA", unidade: "FILIAL 6", cnpj: "50.940.370/0007-72", tokenAcesso: "abib_januaria_274", ordem: 21, ativo: true }
];

// Perfis de Acesso Padrão e Permissões de Visibilidade de Campos por Perfil
export const PERFIS_SEED = [
  {
    id: "p_nutri_geral",
    nome: "Nutricionista Geral",
    descricao: "Responsável pelo lançamento de comensais, pedidos/cotações semanais e acompanhamento geral.",
    icone: "",
    modulos: ["comensais", "pedidos", "hortifruti"],
    permissoesCamposUnidade: ["loja"]
  },
  {
    id: "p_nutri_gestora",
    nome: "Nutricionista Gestora",
    descricao: "Acompanhamento regional das unidades sob sua gestão (pedidos, cotações e suporte).",
    icone: "",
    modulos: ["comensais", "pedidos", "hortifruti"],
    permissoesCamposUnidade: ["loja", "grupo", "unidade"]
  },
  {
    id: "p_diretoria",
    nome: "Gestão & Diretoria",
    descricao: "Acesso a relatórios consolidados, auditoria fiscal de NFs, cotações de compras e unidades.",
    icone: "",
    modulos: ["comensais", "pedidos", "hortifruti"],
    permissoesCamposUnidade: ["codigo", "grupo", "loja", "unidade", "cnpj"]
  }
];

// Módulos Padrão do Sistema
export const MODULOS_SEED = [
  {
    id: "comensais",
    chave: "comensais",
    nome: "Comensais Diários",
    descricao: "Registro rápido diário de refeições vendidas por unidade e público.",
    icone: "",
    ativo: true,
    ordem: 1
  },
  {
    id: "pedidos",
    chave: "pedidos",
    nome: "Pedidos (Hortifrúti & Açougue)",
    descricao: "Cotações semanais, apoio a pedidos e auditoria de compras (Hortifrúti e Açougue).",
    icone: "",
    ativo: true,
    ordem: 2
  }
];

// Catálogo Padrão de Produtos de Pedidos (21 Hortifrúti + 18 Açougue)
export const PRODUTOS_PEDIDOS_SEED = [
  // --- HORTIFRUTI (21 Produtos) ---
  { id: "hprod_abacaxi", nome: "Abacaxi", unidadeMedida: "un", categoria: "Hortifruti", ordem: 1, ativo: true },
  { id: "hprod_abobrinha", nome: "Abobrinha", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 2, ativo: true },
  { id: "hprod_batata_doce", nome: "Batata Doce", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 3, ativo: true },
  { id: "hprod_batata_inglesa", nome: "Batata Inglesa", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 4, ativo: true },
  { id: "hprod_beterraba", nome: "Beterraba", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 5, ativo: true },
  { id: "hprod_brocolis", nome: "Brócolis", unidadeMedida: "un", categoria: "Hortifruti", ordem: 6, ativo: true },
  { id: "hprod_cebola", nome: "Cebola", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 7, ativo: true },
  { id: "hprod_cenoura", nome: "Cenoura", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 8, ativo: true },
  { id: "hprod_chuchu", nome: "Chuchu", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 9, ativo: true },
  { id: "hprod_inhame", nome: "Inhame", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 10, ativo: true },
  { id: "hprod_laranja", nome: "Laranja", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 11, ativo: true },
  { id: "hprod_mamao_formoso", nome: "Mamão Formoso", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 12, ativo: true },
  { id: "hprod_mandioca", nome: "Mandioca", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 13, ativo: true },
  { id: "hprod_melao", nome: "Melão", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 14, ativo: true },
  { id: "hprod_moranga", nome: "Moranga / Abóbora", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 15, ativo: true },
  { id: "hprod_ovo", nome: "Ovo", unidadeMedida: "pente", categoria: "Hortifruti", ordem: 16, ativo: true },
  { id: "hprod_pepino", nome: "Pepino", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 17, ativo: true },
  { id: "hprod_pimentao_verde", nome: "Pimentão Verde", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 18, ativo: true },
  { id: "hprod_quiabo", nome: "Quiabo", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 19, ativo: true },
  { id: "hprod_repolho", nome: "Repolho", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 20, ativo: true },
  { id: "hprod_tomate", nome: "Tomate", unidadeMedida: "kg", categoria: "Hortifruti", ordem: 21, ativo: true },

  // --- AÇOUGUE / CARNES (18 Produtos) ---
  { id: "acougue_bacon_cubos", nome: "Bacon Cubos 200g", unidadeMedida: "pct", categoria: "Açougue", ordem: 22, ativo: true },
  { id: "acougue_carne_boi", nome: "Carne de Boi", unidadeMedida: "kg", categoria: "Açougue", ordem: 23, ativo: true },
  { id: "acougue_carne_sol", nome: "Carne de Sol", unidadeMedida: "kg", categoria: "Açougue", ordem: 24, ativo: true },
  { id: "acougue_carne_moida", nome: "Carne Moída", unidadeMedida: "kg", categoria: "Açougue", ordem: 25, ativo: true },
  { id: "acougue_costelinha", nome: "Costelinha", unidadeMedida: "kg", categoria: "Açougue", ordem: 26, ativo: true },
  { id: "acougue_coxa_sobrecoxa", nome: "Coxa e Sobrecoxa", unidadeMedida: "kg", categoria: "Açougue", ordem: 27, ativo: true },
  { id: "acougue_coxinha_asa", nome: "Coxinha da Asa", unidadeMedida: "kg", categoria: "Açougue", ordem: 28, ativo: true },
  { id: "acougue_file_peito_frango", nome: "Filé de Peito de Frango", unidadeMedida: "kg", categoria: "Açougue", ordem: 29, ativo: true },
  { id: "acougue_file_peixe", nome: "Filé de Peixe", unidadeMedida: "kg", categoria: "Açougue", ordem: 30, ativo: true },
  { id: "acougue_ingredientes_feijoada", nome: "Ingredientes Feijoada", unidadeMedida: "pct", categoria: "Açougue", ordem: 31, ativo: true },
  { id: "acougue_isca_bovina", nome: "Isca Bovina", unidadeMedida: "kg", categoria: "Açougue", ordem: 32, ativo: true },
  { id: "acougue_lanche_peca", nome: "Lanche Peça", unidadeMedida: "peça", categoria: "Açougue", ordem: 33, ativo: true },
  { id: "acougue_linguica_toscana", nome: "Linguiça Toscana 2,5kg", unidadeMedida: "pct", categoria: "Açougue", ordem: 34, ativo: true },
  { id: "acougue_lombo", nome: "Lombo", unidadeMedida: "kg", categoria: "Açougue", ordem: 35, ativo: true },
  { id: "acougue_pernil_peca", nome: "Pernil (Peça)", unidadeMedida: "peça", categoria: "Açougue", ordem: 36, ativo: true },
  { id: "acougue_pernil_bife", nome: "Pernil (Bife)", unidadeMedida: "kg", categoria: "Açougue", ordem: 37, ativo: true },
  { id: "acougue_pernil_isca", nome: "Pernil (Isca)", unidadeMedida: "kg", categoria: "Açougue", ordem: 38, ativo: true },
  { id: "acougue_salsicha", nome: "Salsicha", unidadeMedida: "kg", categoria: "Açougue", ordem: 39, ativo: true }
];

export const PRODUTOS_HORTIFRUTI_SEED = PRODUTOS_PEDIDOS_SEED;

// Feedback visual não-intrusivo (Toast Notification)
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#e11d48' : '#2563eb';
  toast.style.cssText = `background: ${bg}; color: #ffffff; padding: 10px 16px; border-radius: 8px; font-size: 0.86rem; font-weight: 600; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2); opacity: 0; transform: translateY(10px); transition: all 0.25s ease; pointer-events: auto;`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}



