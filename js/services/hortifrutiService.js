/**
 * Hortifrúti Service - Gerenciamento de Cotações Semanas, Regras de Menor Preço e Auditoria
 */

import { getCollection, saveDoc, STORAGE_KEYS } from './storageService.js';
import { PRODUTOS_PEDIDOS_SEED } from '../config.js';

export const PRODUTOS_HORTIFRUTI_SEED = PRODUTOS_PEDIDOS_SEED;

// Busca todos os produtos cadastrados de Pedidos (Hortifrúti e Açougue)
export async function getProdutosHortifruti() {
  const produtos = await getCollection(STORAGE_KEYS.HORTIFRUTI_PRODUTOS);
  if (!produtos || !produtos.length) {
    return PRODUTOS_PEDIDOS_SEED;
  }
  const map = new Map(produtos.map(p => [p.id, p]));
  PRODUTOS_PEDIDOS_SEED.forEach(pSeed => {
    if (!map.has(pSeed.id)) {
      map.set(pSeed.id, pSeed);
    }
  });
  return Array.from(map.values()).filter(p => p.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
}

export const getProdutosPedidos = getProdutosHortifruti;

// Gera ID único determinístico para o pedido semanal
export function generatePedidoId(unidadeId, mesAno, semana) {
  const cleanUid = String(unidadeId).toLowerCase().startsWith('u') ? unidadeId : `u${unidadeId}`;
  return `horti_${cleanUid}_${mesAno}_w${semana}`;
}

// Busca o pedido de uma semana específica de uma unidade
export async function getPedidoSemanal(unidadeId, mesAno, semana) {
  const pedidos = await getCollection(STORAGE_KEYS.HORTIFRUTI_PEDIDOS);
  if (!pedidos || !pedidos.length) return null;

  const targetUid = String(unidadeId).toLowerCase();
  const targetClean = targetUid.replace(/^u/, '');

  const pedido = pedidos.find(p => {
    if (!p) return false;
    const matchSemana = parseInt(p.semana) === parseInt(semana);
    const matchMes = p.mesAno === mesAno;
    if (!matchMes || !matchSemana) return false;

    const pUid = String(p.unidadeId || '').toLowerCase();
    const pClean = pUid.replace(/^u/, '');

    return pUid === targetUid || pClean === targetClean;
  });

  return pedido || null;
}

// Copiar preços da semana anterior
export async function copiarPrecosSemanaAnterior(unidadeId, mesAnoAtual, semanaAtual) {
  const sAtual = parseInt(semanaAtual);
  let mesAnoBusca = mesAnoAtual;
  let semanaBusca = sAtual - 1;

  if (sAtual === 1) {
    const [ano, mes] = mesAnoAtual.split('-').map(Number);
    let anoAnt = ano;
    let mesAnt = mes - 1;
    if (mesAnt < 1) {
      mesAnt = 12;
      anoAnt = ano - 1;
    }
    mesAnoBusca = `${anoAnt}-${String(mesAnt).padStart(2, '0')}`;
    semanaBusca = 4;
  }

  const pedidoAnterior = await getPedidoSemanal(unidadeId, mesAnoBusca, semanaBusca);
  if (!pedidoAnterior || !pedidoAnterior.itens || !pedidoAnterior.itens.length) {
    return { sucesso: false, mensagem: `Nenhum pedido encontrado na Semana ${semanaBusca} (${mesAnoBusca}) para copiar.` };
  }

  const mapaPrecos = {};
  pedidoAnterior.itens.forEach(item => {
    mapaPrecos[item.produtoId] = {
      precoSacolao: item.precoSacolao || 0,
      precoMartMinas: item.precoMartMinas || 0
    };
  });

  return { sucesso: true, mapaPrecos, semanaOrigem: semanaBusca, mesAnoOrigem: mesAnoBusca };
}

// Algoritmo de decisão de Fornecedor Vencedor e Totais
export function calcularTotaisPedido(itensState, produtosMeta) {
  let totalSacolao = 0;
  let totalMartMinas = 0;
  let economiaEstimada = 0;

  const itensCalculados = itensState.map(item => {
    const rawSac = item.precoSacolao;
    const rawMart = item.precoMartMinas;
    const rawQtd = item.quantidade;
    const rawEst = item.estoque;

    const numSac = rawSac !== "" && rawSac !== null && rawSac !== undefined ? (parseFloat(rawSac) || 0) : 0;
    const numMart = rawMart !== "" && rawMart !== null && rawMart !== undefined ? (parseFloat(rawMart) || 0) : 0;
    const numQtd = rawQtd !== "" && rawQtd !== null && rawQtd !== undefined ? (parseFloat(rawQtd) || 0) : 0;

    let vencAuto = '';
    if (numSac > 0 && numMart > 0) {
      vencAuto = numSac <= numMart ? 'Sacolão' : 'Mart Minas';
    } else if (numMart > 0) {
      vencAuto = 'Mart Minas';
    } else if (numSac > 0) {
      vencAuto = 'Sacolão';
    }

    const fornecedorFinal = item.isManual && item.fornecedorEscolhido ? item.fornecedorEscolhido : vencAuto;
    const precoVencedor = fornecedorFinal === 'Mart Minas' ? numMart : (fornecedorFinal === 'Sacolão' ? numSac : 0);
    const subtotal = Math.round((numQtd * precoVencedor) * 100) / 100;

    if (numSac > 0 && numQtd > 0) totalSacolao += (numQtd * numSac);
    if (numMart > 0 && numQtd > 0) totalMartMinas += (numQtd * numMart);

    if (numSac > 0 && numMart > 0 && numQtd > 0) {
      const precoMaior = Math.max(numSac, numMart);
      const economiaItem = (precoMaior - precoVencedor) * numQtd;
      if (economiaItem > 0) economiaEstimada += economiaItem;
    }

    return {
      produtoId: item.produtoId,
      nome: item.nome,
      categoria: item.categoria,
      unidadeMedida: item.unidadeMedida,
      estoque: rawEst !== undefined && rawEst !== null ? rawEst : '',
      precoSacolao: numSac > 0 ? numSac : (rawSac === '' ? '' : (parseFloat(rawSac) || '')),
      precoMartMinas: numMart > 0 ? numMart : (rawMart === '' ? '' : (parseFloat(rawMart) || '')),
      quantidade: numQtd > 0 ? numQtd : (rawQtd === '' ? '' : (parseFloat(rawQtd) || '')),
      fornecedorEscolhido: fornecedorFinal,
      subtotal,
      isManual: !!item.isManual
    };
  });

  return {
    totalSacolao: Math.round(totalSacolao * 100) / 100,
    totalMartMinas: Math.round(totalMartMinas * 100) / 100,
    economiaEstimada: Math.round(economiaEstimada * 100) / 100,
    itensCalculados
  };
}

// Salva um pedido semanal no banco de dados
export async function savePedidoSemanal(pedidoRaw) {
  const produtos = await getProdutosHortifruti();
  const calculados = calcularTotaisPedido(pedidoRaw.itens, produtos);
  const uId = String(pedidoRaw.unidadeId).toLowerCase().startsWith('u') ? pedidoRaw.unidadeId : `u${pedidoRaw.unidadeId}`;

  const doc = {
    id: generatePedidoId(uId, pedidoRaw.mesAno, pedidoRaw.semana),
    unidadeId: uId,
    nutricionistaId: pedidoRaw.nutricionistaId || 'nutri_geral',
    mesAno: pedidoRaw.mesAno,
    semana: parseInt(pedidoRaw.semana),
    dataCriacao: pedidoRaw.dataCriacao || new Date().toISOString(),
    atualizadoEm: pedidoRaw.atualizadoEm || new Date().toISOString(),
    lastUpdatedBy: pedidoRaw.lastUpdatedBy || '',
    itens: calculados.itensCalculados,
    totalSacolao: calculados.totalSacolao,
    totalMartMinas: calculados.totalMartMinas,
    economiaEstimada: calculados.economiaEstimada,
    observacoes: pedidoRaw.observacoes || ''
  };

  await saveDoc(STORAGE_KEYS.HORTIFRUTI_PEDIDOS, doc);
  return doc;
}

// Retorna pedidos de um determinado mês e unidade (ou todas)
export async function getPedidosPorMes(mesAno, unidadeId = 'todas') {
  const pedidos = await getCollection(STORAGE_KEYS.HORTIFRUTI_PEDIDOS);
  return pedidos.filter(p => {
    const matchMes = p.mesAno === mesAno;
    if (unidadeId === 'todas') return matchMes;
    
    const targetClean = String(unidadeId).replace(/^u/, '').toLowerCase();
    const pClean = String(p.unidadeId || '').replace(/^u/, '').toLowerCase();
    return matchMes && pClean === targetClean;
  });
}

// Relatório Consolidado de Auditoria Mensal
export async function getConsolidadoMensal(mesAno, unidadeIdFilter = 'todas') {
  const pedidosMes = await getPedidosPorMes(mesAno, unidadeIdFilter);
  const unidades = await getCollection(STORAGE_KEYS.UNIDADES);
  const produtos = await getProdutosHortifruti();

  let totalGeralSacolao = 0;
  let totalGeralMartMinas = 0;
  let totalGeralEconomia = 0;

  const resumoUnidadesMap = new Map();
  unidades.forEach(u => {
    resumoUnidadesMap.set(u.id, {
      unidadeId: u.id,
      nomeLoja: u.loja,
      grupo: u.grupo,
      totalSacolao: 0,
      totalMartMinas: 0,
      economia: 0,
      totalGeral: 0
    });
  });

  const consumoProdutosMap = new Map();
  produtos.forEach(p => {
    consumoProdutosMap.set(p.id, {
      produtoId: p.id,
      nome: p.nome,
      categoria: p.categoria,
      unidadeMedida: p.unidadeMedida,
      qtdTotalSacolao: 0,
      qtdTotalMartMinas: 0,
      qtdTotal: 0,
      valorTotal: 0
    });
  });

  pedidosMes.forEach(ped => {
    const uRes = resumoUnidadesMap.get(ped.unidadeId);
    if (uRes) {
      uRes.totalSacolao += (ped.totalSacolao || 0);
      uRes.totalMartMinas += (ped.totalMartMinas || 0);
      uRes.economia += (ped.economiaEstimada || 0);
      uRes.totalGeral += ((ped.totalSacolao || 0) + (ped.totalMartMinas || 0));
    }

    totalGeralSacolao += (ped.totalSacolao || 0);
    totalGeralMartMinas += (ped.totalMartMinas || 0);
    totalGeralEconomia += (ped.economiaEstimada || 0);

    if (ped.itens && Array.isArray(ped.itens)) {
      ped.itens.forEach(it => {
        const prodRes = consumoProdutosMap.get(it.produtoId);
        if (prodRes && it.quantidade > 0) {
          prodRes.qtdTotal += it.quantidade;
          prodRes.valorTotal += (it.subtotal || 0);
          if (it.fornecedorEscolhido === 'Sacolão') prodRes.qtdTotalSacolao += it.quantidade;
          if (it.fornecedorEscolhido === 'Mart Minas') prodRes.qtdTotalMartMinas += it.quantidade;
        }
      });
    }
  });

  return {
    mesAno,
    totalGeralSacolao: Math.round(totalGeralSacolao * 100) / 100,
    totalGeralMartMinas: Math.round(totalGeralMartMinas * 100) / 100,
    totalGeralEconomia: Math.round(totalGeralEconomia * 100) / 100,
    unidades: Array.from(resumoUnidadesMap.values()).filter(u => u.totalGeral > 0 || unidadeIdFilter === u.unidadeId),
    produtosConsumidos: Array.from(consumoProdutosMap.values()).filter(p => p.qtdTotal > 0)
  };
}

// Gerador de Texto Formatado para WhatsApp (Lista Fornecedor 1 / Sacolão / Local)
export function generateWhatsAppTextSacolao(pedidoDoc, nomeLoja) {
  if (!pedidoDoc || !pedidoDoc.itens) return '';
  const itensSac = pedidoDoc.itens.filter(i => i.fornecedorEscolhido === 'Sacolão' && i.quantidade > 0);

  let msg = `*PEDIDO DE COMPRAS - FORNECEDOR LOCAL*\n`;
  msg += `Unidade: *${nomeLoja}*\n`;
  msg += `Referencia: Mes ${pedidoDoc.mesAno} (Semana ${pedidoDoc.semana})\n`;
  msg += `------------------------------------\n\n`;

  if (itensSac.length === 0) {
    msg += `Nenhum produto cotado para este fornecedor nesta semana.\n`;
  } else {
    const hortiItens = itensSac.filter(i => i.categoria === 'Hortifruti');
    const acougueItens = itensSac.filter(i => i.categoria === 'Açougue');

    if (hortiItens.length > 0) {
      msg += `*[HORTIFRUTI]*\n`;
      hortiItens.forEach(i => {
        msg += `• *${i.nome}*: ${i.quantidade} ${i.unidadeMedida} (R$ ${i.precoSacolao.toFixed(2).replace('.', ',')} / ${i.unidadeMedida}) = *R$ ${i.subtotal.toFixed(2).replace('.', ',')}*\n`;
      });
      msg += `\n`;
    }

    if (acougueItens.length > 0) {
      msg += `*[ACOUGUE / CARNES]*\n`;
      acougueItens.forEach(i => {
        msg += `• *${i.nome}*: ${i.quantidade} ${i.unidadeMedida} (R$ ${i.precoSacolao.toFixed(2).replace('.', ',')} / ${i.unidadeMedida}) = *R$ ${i.subtotal.toFixed(2).replace('.', ',')}*\n`;
      });
      msg += `\n`;
    }

    msg += `------------------------------------\n`;
    msg += `*TOTAL FORNECEDOR LOCAL: R$ ${pedidoDoc.totalSacolao.toFixed(2).replace('.', ',')}*\n`;
  }

  msg += `\n_ABIB Refeicoes Coletivas_`;
  return msg;
}

// Gerador de Texto Formatado para WhatsApp (Lista Fornecedor 2 / Mart Minas)
export function generateWhatsAppTextMartMinas(pedidoDoc, nomeLoja) {
  if (!pedidoDoc || !pedidoDoc.itens) return '';
  const itensMart = pedidoDoc.itens.filter(i => i.fornecedorEscolhido === 'Mart Minas' && i.quantidade > 0);

  let msg = `*PEDIDO DE COMPRAS - MART MINAS*\n`;
  msg += `Unidade: *${nomeLoja}*\n`;
  msg += `Referencia: Mes ${pedidoDoc.mesAno} (Semana ${pedidoDoc.semana})\n`;
  msg += `------------------------------------\n\n`;

  if (itensMart.length === 0) {
    msg += `Nenhum produto cotado para o Mart Minas nesta semana.\n`;
  } else {
    const hortiItens = itensMart.filter(i => i.categoria === 'Hortifruti');
    const acougueItens = itensMart.filter(i => i.categoria === 'Açougue');

    if (hortiItens.length > 0) {
      msg += `*[HORTIFRUTI]*\n`;
      hortiItens.forEach(i => {
        msg += `• *${i.nome}*: ${i.quantidade} ${i.unidadeMedida} (R$ ${i.precoMartMinas.toFixed(2).replace('.', ',')} / ${i.unidadeMedida}) = *R$ ${i.subtotal.toFixed(2).replace('.', ',')}*\n`;
      });
      msg += `\n`;
    }

    if (acougueItens.length > 0) {
      msg += `*[ACOUGUE / CARNES]*\n`;
      acougueItens.forEach(i => {
        msg += `• *${i.nome}*: ${i.quantidade} ${i.unidadeMedida} (R$ ${i.precoMartMinas.toFixed(2).replace('.', ',')} / ${i.unidadeMedida}) = *R$ ${i.subtotal.toFixed(2).replace('.', ',')}*\n`;
      });
      msg += `\n`;
    }

    msg += `------------------------------------\n`;
    msg += `*TOTAL MART MINAS: R$ ${pedidoDoc.totalMartMinas.toFixed(2).replace('.', ',')}*\n`;
  }

  msg += `\n_ABIB Refeicoes Coletivas_`;
  return msg;
}
