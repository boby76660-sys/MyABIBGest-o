/**
 * Comensais Service - Negócio de Registro de Refeições Diárias
 * Salva lançamentos, calcula status 🔴/🟢, gera texto WhatsApp, calcula discrepâncias e exporta relatórios.
 */

import { getCollection, saveDoc } from './storageService.js';
import { getUnidades, getPublicos } from './adminService.js';

// Salvar lançamento de comensais para uma unidade em determinada data
export async function saveComensaisRegistro(registroData) {
  // registroData: { data: 'YYYY-MM-DD', unidadeId: 'u239', publicos: { pub_ticket: 50, ... }, observacao: '...' }
  const id = `reg_${registroData.data}_${registroData.unidadeId}`;
  return await saveDoc('abib_gestao_comensais', {
    id,
    ...registroData,
    atualizadoEm: new Date().toISOString()
  });
}

// Buscar todos os registros de uma data específica
export async function getRegistrosPorData(dataISO) {
  const todos = await getCollection('abib_gestao_comensais');
  return todos.filter(r => r.data === dataISO);
}

// Obter status de preenchimento (🔴 Pendente / 🟢 Concluído) para cada unidade no dia
export async function getStatusUnidadesNoDia(dataISO) {
  const unidades = await getUnidades();
  const registros = await getRegistrosPorData(dataISO);
  const registrosMap = new Map();
  registros.forEach(r => registrosMap.set(r.unidadeId, r));

  return unidades.filter(u => u.ativo !== false).map(u => {
    const reg = registrosMap.get(u.id);
    const hasData = reg && reg.publicos && Object.values(reg.publicos).some(val => val !== null && val !== undefined && val !== '');
    
    // Calcula o total de comensais da unidade no dia
    let totalComensais = 0;
    if (hasData) {
      Object.values(reg.publicos).forEach(v => {
        totalComensais += parseInt(v || 0, 10);
      });
    }

    return {
      unidade: u,
      registro: reg || null,
      status: hasData ? 'concluido' : 'pendente',
      totalComensais,
      observacao: reg ? reg.observacao : ''
    };
  });
}

// Gerar Texto Formatado do Consolidado do Dia para envio no WhatsApp
export async function generateWhatsAppSummary(dataISO) {
  const statusLista = await getStatusUnidadesNoDia(dataISO);
  const publicos = await getPublicos();
  const publicosAtivos = publicos.filter(p => p.ativo !== false);

  const dataFormatada = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
  
  let totalGeralEmpresa = 0;
  let concluidasCount = 0;

  let texto = `📊 *RESUMO DE COMENSAIS - ${dataFormatada}*\n`;
  texto += `🏢 *ABIB Refeições Coletivas*\n\n`;

  statusLista.forEach(item => {
    if (item.status === 'concluido') {
      concluidasCount++;
      totalGeralEmpresa += item.totalComensais;
      texto += `🟢 *${item.unidade.loja}*: ${item.totalComensais} comensais\n`;
      
      // Detalhes por público se houver
      const partes = [];
      publicosAtivos.forEach(p => {
        const qtd = item.registro && item.registro.publicos ? (item.registro.publicos[p.id] || 0) : 0;
        if (qtd > 0) partes.push(`${p.nome}: ${qtd}`);
      });
      if (partes.length > 0) {
        texto += `   └ _${partes.join(' | ')}_\n`;
      }
      if (item.observacao) {
        texto += `   └ 📝 Obs: ${item.observacao}\n`;
      }
    } else {
      texto += `🔴 *${item.unidade.loja}*: _Pendente_\n`;
    }
  });

  texto += `\n📌 *TOTAL DA EMPRESA:* ${totalGeralEmpresa} refeições`;
  texto += `\n✅ *Status:* ${concluidasCount}/${statusLista.length} unidades preenchidas.`;

  return texto;
}

// Calcular Alertas de Discrepância baseados na média histórica
export async function checkDiscrepanciaAlert(unidadeId, totalDia, sensibilidadePct = 30) {
  const todos = await getCollection('abib_gestao_comensais');
  const historicoUnidade = todos.filter(r => r.unidadeId === unidadeId && r.publicos);

  if (historicoUnidade.length < 3) return null; // Poucos dados para comparar

  let soma = 0;
  historicoUnidade.forEach(r => {
    let t = 0;
    Object.values(r.publicos).forEach(v => t += parseInt(v || 0, 10));
    soma += t;
  });

  const media = soma / historicoUnidade.length;
  const difPct = ((totalDia - media) / media) * 100;

  if (Math.abs(difPct) >= sensibilidadePct) {
    return {
      media: Math.round(media),
      difPct: Math.round(difPct),
      tipo: difPct > 0 ? 'alta' : 'baixa'
    };
  }
  return null;
}

// Exportar lançamentos de um período em formato CSV
export async function exportComensaisCSV(inicioISO, fimISO) {
  const todos = await getCollection('abib_gestao_comensais');
  const unidades = await getUnidades();
  const publicos = await getPublicos();
  const unidadesMap = new Map(unidades.map(u => [u.id, u]));

  const filtrados = todos.filter(r => r.data >= inicioISO && r.data <= fimISO);

  let csv = 'Data;Grupo;Codigo;Loja;Unidade;CNPJ;Total Comensais;';
  publicos.forEach(p => csv += `${p.nome};`);
  csv += 'Observações\n';

  filtrados.forEach(r => {
    const u = unidadesMap.get(r.unidadeId) || {};
    let total = 0;
    if (r.publicos) Object.values(r.publicos).forEach(v => total += parseInt(v || 0, 10));

    csv += `${r.data};"${u.grupo || ''}";"${u.codigo || ''}";"${u.loja || ''}";"${u.unidade || ''}";"${u.cnpj || ''}";${total};`;
    publicos.forEach(p => {
      csv += `${(r.publicos && r.publicos[p.id]) || 0};`;
    });
    csv += `"${(r.observacao || '').replace(/"/g, '""')}"\n`;
  });

  return csv;
}
