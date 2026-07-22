/**
 * Configurações Gerais e Dados Iniciais (Seeds) do Sistema de Gestão ABIB
 */

export const DEFAULT_ADMIN_PASSWORD = "admin123";

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
  { id: "pub_ticket", nome: "Ticket", ordem: 1, ativo: true },
  { id: "pub_garra", nome: "Garra / Estrela D'Alva", ordem: 2, ativo: true },
  { id: "pub_promotores", nome: "Promotores ou Motorista (Pix/Cartão)", ordem: 3, ativo: true }
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
    descricao: "Responsável pelo lançamento diário de comensais e acompanhamento geral das 21 unidades.",
    icone: "📋",
    modulos: ["comensais"],
    permissoesCamposUnidade: ["loja"]
  },
  {
    id: "p_nutri_gestora",
    nome: "Nutricionista Gestora",
    descricao: "Acompanhamento regional das unidades sob sua gestão (compras e suporte).",
    icone: "👩‍💼",
    modulos: ["comensais"],
    permissoesCamposUnidade: ["loja", "grupo", "unidade"]
  },
  {
    id: "p_diretoria",
    nome: "Gestão & Diretoria",
    descricao: "Acesso a relatórios consolidados, visão fiscal, CNPJs e detalhamento de unidades.",
    icone: "🏛️",
    modulos: ["comensais"],
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
    icone: "🍽️",
    ativo: true,
    ordem: 1
  }
];
