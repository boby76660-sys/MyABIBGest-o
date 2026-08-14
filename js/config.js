/**
 * Configurações Gerais e Dados Iniciais (Seeds) do Sistema de Gestão ABIB
 */

export const DEFAULT_ADMIN_PASSWORD = "Gestao@5170";
export const DEFAULT_COMENSAIS_PASSWORD = "Comensais@3928";
export const DEFAULT_HORTIFRUTI_PASSWORD = "Hortifruti@6481";

// Configurações do Firebase Realtime Database
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCLrj5WzSgu-wGU5bBAMeom-P3vH8hZHHQ",
  databaseURL: "https://myabib-gestao-default-rtdb.firebaseio.com/",
  projectId: "myabib-gestao",
  authDomain: "myabib-gestao.firebaseapp.com",
  storageBucket: "myabib-gestao.appspot.com"
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
  { id: "u239", codigo: "239", grupo: "AC", loja: "ITABIRA", unidade: "MATRIZ", cnpj: "44.509.964/0001-35", ordem: 1, ativo: true },
  { id: "u220", codigo: "220", grupo: "AC", loja: "UBÁ", unidade: "FILIAL 1", cnpj: "44.509.964/0002-16", ordem: 2, ativo: true },
  { id: "u253", codigo: "253", grupo: "AC", loja: "JUIZ DE FORA II", unidade: "FILIAL 2", cnpj: "44.509.964/0003-05", ordem: 3, ativo: true },
  { id: "u206", codigo: "206", grupo: "AC", loja: "JUIZ DE FORA I", unidade: "FILIAL 3", cnpj: "44.509.964/0004-88", ordem: 4, ativo: true },
  { id: "u230", codigo: "230", grupo: "AC", loja: "BARBACENA", unidade: "FILIAL 4", cnpj: "44.509.964/0005-69", ordem: 5, ativo: true },
  { id: "u257", codigo: "257", grupo: "AC", loja: "CONGONHAS", unidade: "FILIAL 5", cnpj: "44.509.964/0006-40", ordem: 6, ativo: true },
  { id: "u234", codigo: "234", grupo: "AC", loja: "CONSELHEIRO LAFAIETE", unidade: "FILIAL 6", cnpj: "44.509.964/0007-20", ordem: 7, ativo: true },
  { id: "u241", codigo: "241", grupo: "AC", loja: "SÃO JOÃO DEL REI", unidade: "FILIAL 7", cnpj: "44.509.964/0008-01", ordem: 8, ativo: true },
  { id: "u217", codigo: "217", grupo: "ABIB", loja: "SANTANA DO PARAÍSO", unidade: "MATRIZ", cnpj: "25.191.364/0001-27", ordem: 9, ativo: true },
  { id: "u244", codigo: "244", grupo: "ABIB", loja: "JOÃO MONLEVADE", unidade: "FILIAL 1", cnpj: "25.191.364/0002-08", ordem: 10, ativo: true },
  { id: "u255", codigo: "255", grupo: "ABIB", loja: "LEOPOLDINA", unidade: "FILIAL 2", cnpj: "25.191.364/0003-99", ordem: 11, ativo: true },
  { id: "u256", codigo: "256", grupo: "ABIB", loja: "CARATINGA", unidade: "FILIAL 3", cnpj: "25.191.364/0004-70", ordem: 12, ativo: true },
  { id: "u224", codigo: "224", grupo: "ABIB", loja: "PARACATU", unidade: "FILIAL 4", cnpj: "25.191.364/0005-50", ordem: 13, ativo: true },
  { id: "u240", codigo: "240", grupo: "ABIB", loja: "UNAÍ", unidade: "FILIAL 5", cnpj: "25.191.364/0006-31", ordem: 14, ativo: true },
  { id: "u219", codigo: "219", grupo: "MOC", loja: "MONTES CLAROS I", unidade: "MATRIZ", cnpj: "50.940.370/0001-87", ordem: 15, ativo: true },
  { id: "u259", codigo: "259", grupo: "MOC", loja: "MONTES CLAROS II", unidade: "FILIAL 1", cnpj: "50.940.370/0002-68", ordem: 16, ativo: true },
  { id: "u260", codigo: "260", grupo: "MOC", loja: "MONTES CLAROS III", unidade: "FILIAL 2", cnpj: "50.940.370/0003-49", ordem: 17, ativo: true },
  { id: "u250", codigo: "250", grupo: "MOC", loja: "JANAÚBA", unidade: "FILIAL 3", cnpj: "50.940.370/0004-20", ordem: 18, ativo: true },
  { id: "u267", codigo: "267", grupo: "MOC", loja: "CURVELO", unidade: "FILIAL 4", cnpj: "50.940.370/0005-00", ordem: 19, ativo: true },
  { id: "u272", codigo: "272", grupo: "MOC", loja: "PIRAPORA", unidade: "FILIAL 5", cnpj: "50.940.370/0006-91", ordem: 20, ativo: true },
  { id: "u274", codigo: "274", grupo: "MOC", loja: "JANUÁRIA", unidade: "FILIAL 6", cnpj: "50.940.370/0007-72", ordem: 21, ativo: true }
];

// Perfis de Acesso Padrão e Permissões de Visibilidade de Campos por Perfil
export const PERFIS_SEED = [
  {
    id: "p_nutri_geral",
    nome: "Nutricionista Geral",
    descricao: "Responsável pelo lançamento de comensais, cotação semanal de hortifrúti e acompanhamento geral.",
    icone: "",
    modulos: ["comensais", "hortifruti"],
    permissoesCamposUnidade: ["loja"]
  },
  {
    id: "p_nutri_gestora",
    nome: "Nutricionista Gestora",
    descricao: "Acompanhamento regional das unidades sob sua gestão (compras, cotações e suporte).",
    icone: "",
    modulos: ["comensais", "hortifruti"],
    permissoesCamposUnidade: ["loja", "grupo", "unidade"]
  },
  {
    id: "p_diretoria",
    nome: "Gestão & Diretoria",
    descricao: "Acesso a relatórios consolidados, auditoria fiscal de NFs, cotações de hortifrúti e unidades.",
    icone: "",
    modulos: ["comensais", "hortifruti"],
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
    id: "hortifruti",
    chave: "hortifruti",
    nome: "Hortifrúti Semanal",
    descricao: "Cotação Sacolão x Mart Minas, apoio a pedidos e auditoria mensal de NFs.",
    icone: "",
    ativo: true,
    ordem: 2
  }
];

// Produtos Padrão de Hortifrúti (Extraídos do Sistema de Compras / ERP ABIB)
export const PRODUTOS_HORTIFRUTI_SEED = [
  // --- VERDURAS & FOLHOSAS ---
  { id: "hprod_alface_crespa", nome: "Alface Crespa", unidadeMedida: "un", categoria: "Verduras", ordem: 1, ativo: true },
  { id: "hprod_alface_lisa", nome: "Alface Lisa", unidadeMedida: "un", categoria: "Verduras", ordem: 2, ativo: true },
  { id: "hprod_alface_roxa", nome: "Alface Roxa / Hidropônica", unidadeMedida: "un", categoria: "Verduras", ordem: 3, ativo: true },
  { id: "hprod_acelga", nome: "Acelga", unidadeMedida: "un", categoria: "Verduras", ordem: 4, ativo: true },
  { id: "hprod_agriao", nome: "Agrião", unidadeMedida: "un", categoria: "Verduras", ordem: 5, ativo: true },
  { id: "hprod_almeirao", nome: "Almeirão / Chicória", unidadeMedida: "un", categoria: "Verduras", ordem: 6, ativo: true },
  { id: "hprod_brocolis", nome: "Brócolis Ninja", unidadeMedida: "un", categoria: "Verduras", ordem: 7, ativo: true },
  { id: "hprod_cebolinha", nome: "Cebolinha Verde", unidadeMedida: "un", categoria: "Verduras", ordem: 8, ativo: true },
  { id: "hprod_cheiro_verde", nome: "Cheiro Verde / Coentro", unidadeMedida: "un", categoria: "Verduras", ordem: 9, ativo: true },
  { id: "hprod_couve", nome: "Couve Manteiga", unidadeMedida: "un", categoria: "Verduras", ordem: 10, ativo: true },
  { id: "hprod_couve_flor", nome: "Couve-Flor", unidadeMedida: "un", categoria: "Verduras", ordem: 11, ativo: true },
  { id: "hprod_mostarda", nome: "Mostarda", unidadeMedida: "un", categoria: "Verduras", ordem: 12, ativo: true },
  { id: "hprod_repolho_verde", nome: "Repolho Verde", unidadeMedida: "kg", categoria: "Verduras", ordem: 13, ativo: true },
  { id: "hprod_rucula", nome: "Rúcula", unidadeMedida: "un", categoria: "Verduras", ordem: 14, ativo: true },

  // --- LEGUMES, RAÍZES & TUBÉRCULOS ---
  { id: "hprod_abobora_japonesa", nome: "Abóbora Moranga Japonesa", unidadeMedida: "kg", categoria: "Legumes", ordem: 15, ativo: true },
  { id: "hprod_abobrinha", nome: "Abobrinha Italiana", unidadeMedida: "kg", categoria: "Legumes", ordem: 16, ativo: true },
  { id: "hprod_alho", nome: "Alho", unidadeMedida: "kg", categoria: "Legumes", ordem: 17, ativo: true },
  { id: "hprod_alho_descascado", nome: "Alho Descascado / Congelado", unidadeMedida: "kg", categoria: "Legumes", ordem: 18, ativo: true },
  { id: "hprod_batata_extra", nome: "Batata Inglesa Extra", unidadeMedida: "kg", categoria: "Legumes", ordem: 19, ativo: true },
  { id: "hprod_batata_doce", nome: "Batata Doce Roxa", unidadeMedida: "kg", categoria: "Legumes", ordem: 20, ativo: true },
  { id: "hprod_batata_bolinha", nome: "Batata Bolinha", unidadeMedida: "kg", categoria: "Legumes", ordem: 21, ativo: true },
  { id: "hprod_berinjela", nome: "Berinjela", unidadeMedida: "kg", categoria: "Legumes", ordem: 22, ativo: true },
  { id: "hprod_beterraba", nome: "Beterraba", unidadeMedida: "kg", categoria: "Legumes", ordem: 23, ativo: true },
  { id: "hprod_cebola", nome: "Cebola Amarela", unidadeMedida: "kg", categoria: "Legumes", ordem: 24, ativo: true },
  { id: "hprod_cenoura", nome: "Cenoura", unidadeMedida: "kg", categoria: "Legumes", ordem: 25, ativo: true },
  { id: "hprod_chuchu", nome: "Chuchu", unidadeMedida: "kg", categoria: "Legumes", ordem: 26, ativo: true },
  { id: "hprod_inhame", nome: "Inhame", unidadeMedida: "kg", categoria: "Legumes", ordem: 27, ativo: true },
  { id: "hprod_jilo", nome: "Jiló", unidadeMedida: "kg", categoria: "Legumes", ordem: 28, ativo: true },
  { id: "hprod_mandioca", nome: "Mandioca", unidadeMedida: "kg", categoria: "Legumes", ordem: 29, ativo: true },
  { id: "hprod_pepino", nome: "Pepino Japonês / Caipira", unidadeMedida: "kg", categoria: "Legumes", ordem: 30, ativo: true },
  { id: "hprod_pimentao_verde", nome: "Pimentão Verde", unidadeMedida: "kg", categoria: "Legumes", ordem: 31, ativo: true },
  { id: "hprod_quiabo", nome: "Quiabo", unidadeMedida: "kg", categoria: "Legumes", ordem: 32, ativo: true },
  { id: "hprod_tomate", nome: "Tomate Longa Vida", unidadeMedida: "kg", categoria: "Legumes", ordem: 33, ativo: true },
  { id: "hprod_vagem", nome: "Vagem", unidadeMedida: "kg", categoria: "Legumes", ordem: 34, ativo: true },

  // --- FRUTAS ---
  { id: "hprod_abacate", nome: "Abacate", unidadeMedida: "kg", categoria: "Frutas", ordem: 35, ativo: true },
  { id: "hprod_abacaxi", nome: "Abacaxi Pérola", unidadeMedida: "un", categoria: "Frutas", ordem: 36, ativo: true },
  { id: "hprod_banana_prata", nome: "Banana Prata", unidadeMedida: "kg", categoria: "Frutas", ordem: 37, ativo: true },
  { id: "hprod_banana_caturra", nome: "Banana Caturra / Nanica", unidadeMedida: "kg", categoria: "Frutas", ordem: 38, ativo: true },
  { id: "hprod_laranja_pera", nome: "Laranja Pera Rio", unidadeMedida: "kg", categoria: "Frutas", ordem: 39, ativo: true },
  { id: "hprod_maca", nome: "Maçã Gala", unidadeMedida: "kg", categoria: "Frutas", ordem: 40, ativo: true },
  { id: "hprod_mamao_formosa", nome: "Mamão Formosa", unidadeMedida: "kg", categoria: "Frutas", ordem: 41, ativo: true },
  { id: "hprod_manga_tommy", nome: "Manga Tommy / Palmer", unidadeMedida: "kg", categoria: "Frutas", ordem: 42, ativo: true },
  { id: "hprod_melancia", nome: "Melancia", unidadeMedida: "kg", categoria: "Frutas", ordem: 43, ativo: true },
  { id: "hprod_melao_amarelo", nome: "Melão Amarelo", unidadeMedida: "kg", categoria: "Frutas", ordem: 44, ativo: true },
  { id: "hprod_pera", nome: "Pera Importada", unidadeMedida: "kg", categoria: "Frutas", ordem: 45, ativo: true },
  { id: "hprod_uva_thompson", nome: "Uva Thompson Sem Semente", unidadeMedida: "kg", categoria: "Frutas", ordem: 46, ativo: true },

  // --- OVOS ---
  { id: "hprod_ovo_pente", nome: "Ovo Branco (Pente c/ 30)", unidadeMedida: "pente", categoria: "Ovos", ordem: 47, ativo: true }
];

