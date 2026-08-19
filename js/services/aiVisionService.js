/**
 * AI Vision Service - OCR Inteligente de Folhas de Comensais via OpenRouter
 * Comunicação com LLMs multimodais, compressão Canvas e cálculo de soma real.
 */

import { getConfig, saveConfig } from './storageService.js';
import { DEFAULT_OPENROUTER_CONFIG } from '../config.js';

// Obter configurações ativas da IA (Chave e Modelo)
export async function getAiConfig() {
  const config = await getConfig();
  return {
    apiKey: config.openRouterApiKey || DEFAULT_OPENROUTER_CONFIG.apiKey || '',
    model: config.openRouterModel || DEFAULT_OPENROUTER_CONFIG.model || 'google/gemini-2.5-flash'
  };
}

// Salvar configurações da IA
export async function saveAiConfig({ apiKey, model }) {
  const current = await getConfig();
  const updated = {
    ...current,
    openRouterApiKey: (apiKey || '').trim(),
    openRouterModel: (model || '').trim() || 'google/gemini-2.5-flash'
  };
  return await saveConfig(updated);
}

// Comprimir e converter imagem File para Base64 Data URL via HTML5 Canvas
export function compressImageFile(file, maxDimension = 1800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('O arquivo fornecido não é uma imagem válida.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao carregar a imagem na memória.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Extrair dados estruturados das folhas usando OpenRouter Vision
export async function extractComensaisFromImages(imageFiles, options = {}) {
  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Nenhuma imagem foi selecionada para processamento.');
  }

  const aiConfig = await getAiConfig();
  if (!aiConfig.apiKey) {
    throw new Error('A Chave API do OpenRouter não foi informada. Por favor, configure sua chave API nas configurações da IA.');
  }

  // 1. Comprimir todas as imagens em paralelo para agilizar
  const base64Images = await Promise.all(
    imageFiles.map(file => compressImageFile(file, 1800, 0.85))
  );

  // 2. Construir Prompt especializado nas folhas da ABIB
  const systemInstruction = `Você é um especialista em OCR e extração estruturada de dados de folhas de contagem de refeições da empresa ABIB Refeições Coletivas.
Analise a(s) imagem(ns) com extrema atenção aos números manuscritos.

ESTRUTURA DAS FOLHAS DA ABIB:
A folha é dividida em blocos/células diárias organizadas em colunas e linhas:
- DIA: [data manuscrita no formato DD/MM, ex: 05/08, 06/08, 10/08, 15/08]
- TICKET: [número manuscrito ou traço -]
- GARRA/DALVA: [número manuscrito ou traço -]
- CARTÃO R$ 19,50: [número manuscrito ou traço -]
- PIX R$ 19,50: [número manuscrito ou traço -]
- ASSINATURAS: [número manuscrito ou traço -]
- TOTAL GERAL: [número total manuscrito na folha]

REGRAS CRÍTICAS DE EXTRAÇÃO:
1. Extraia TODOS os blocos de dias visíveis na imagem. Uma foto pode ter 1 único dia ou vários dias (5, 8, 10 ou mais dias).
2. Traços ('-', '—') ou campos em branco significam 0 (zero).
3. Para cada dia identificado, extraia exatamente o número escrito em cada linha.
4. Extraia também o número escrito no campo "TOTAL GERAL" exatamente como a nutricionista escreveu (para conferência posterior).
5. Se houver rasuras ou números corrigidos, considere o valor final corrigido.
6. Retorne EXCLUSIVAMENTE um objeto JSON no seguinte formato:

{
  "dias": [
    {
      "dia": "05/08",
      "ticket": 50,
      "garra": 0,
      "cartao": 1,
      "pix": 2,
      "assinaturas": 15,
      "totalEscritoFolha": 68,
      "observacao": ""
    }
  ]
}`;

  // 3. Montar payload no formato OpenRouter / OpenAI Vision
  const contentArray = [
    {
      type: "text",
      text: "Extraia todos os dias e contagens de refeições presentes nestas fotos das folhas de comensais, seguindo rigorosamente a estrutura JSON especificada."
    }
  ];

  base64Images.forEach((dataUrl) => {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: dataUrl
      }
    });
  });

  const modelName = aiConfig.model || 'google/gemini-2.5-flash';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aiConfig.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin || 'https://gestao-abib.local',
      'X-Title': 'Gestao ABIB - OCR Comensais'
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: contentArray
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    let errMsg = `Erro na API OpenRouter (Status ${response.status})`;
    try {
      const errData = await response.json();
      if (errData && errData.error && errData.error.message) {
        errMsg = `Erro OpenRouter: ${errData.error.message}`;
      }
    } catch (e) {}
    throw new Error(errMsg);
  }

  const resultData = await response.json();
  const rawText = resultData.choices?.[0]?.message?.content || '';

  if (!rawText) {
    throw new Error('A IA não retornou nenhum dado legível para as imagens enviadas.');
  }

  // 4. Limpar e parsear JSON
  let parsedJson = null;
  try {
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsedJson = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Falha ao parsear resposta da IA:", rawText);
    throw new Error("Não foi possível interpretar a resposta estruturada da IA. Tente novamente.");
  }

  const rawDias = parsedJson.dias || (Array.isArray(parsedJson) ? parsedJson : []);
  if (rawDias.length === 0) {
    throw new Error('Nenhum dia ou tabela de contagem foi identificada com nitidez nas imagens enviadas.');
  }

  // 5. Normalizar datas, calcular soma real estrita e verificar divergências na folha
  const currentYear = options.referenciaAno || new Date().getFullYear();
  const processedDias = [];

  rawDias.forEach((item, index) => {
    const diaRaw = (item.dia || '').trim();
    if (!diaRaw) return;

    // Normalizar dia/mês
    let day = 1;
    let month = 1;
    let year = currentYear;

    const parts = diaRaw.split(/[\/\-\.]/);
    if (parts.length >= 2) {
      day = parseInt(parts[0], 10) || 1;
      month = parseInt(parts[1], 10) || 1;
      if (parts[2]) {
        const yr = parseInt(parts[2], 10);
        if (yr > 2000) year = yr;
        else if (yr < 100) year = 2000 + yr;
      }
    }

    const dayPad = String(day).padStart(2, '0');
    const monthPad = String(month).padStart(2, '0');
    const dataISO = `${year}-${monthPad}-${dayPad}`;
    const dataDisplay = `${dayPad}/${monthPad}/${year}`;

    const ticket = parseInt(item.ticket || 0, 10) || 0;
    const garra = parseInt(item.garra || 0, 10) || 0;
    const cartao = parseInt(item.cartao || 0, 10) || 0;
    const pix = parseInt(item.pix || 0, 10) || 0;
    const assinaturas = parseInt(item.assinaturas || 0, 10) || 0;

    // SOMA REAL OBRIGATÓRIA (Soma aritmética estrita dos itens)
    const somaReal = ticket + garra + cartao + pix + assinaturas;

    // Verificar se o valor manuscrito na folha difere da soma real
    const totalEscrito = (item.totalEscritoFolha !== undefined && item.totalEscritoFolha !== null && item.totalEscritoFolha !== '')
      ? parseInt(item.totalEscritoFolha, 10)
      : null;

    const temDivergencia = totalEscrito !== null && !isNaN(totalEscrito) && totalEscrito !== somaReal;

    processedDias.push({
      idTemp: `temp_${Date.now()}_${index}`,
      diaTexto: diaRaw,
      dataISO,
      dataDisplay,
      publicos: {
        pub_ticket: ticket,
        pub_garra: garra,
        pub_promotores_cartao: cartao,
        pub_promotores_pix: pix,
        pub_assinaturas: assinaturas
      },
      somaReal,
      totalComensais: somaReal, // Total definitivo é SEMPRE a soma real!
      totalEscritoFolha: totalEscrito,
      temDivergencia,
      observacao: item.observacao || ''
    });
  });

  // Ordenar cronologicamente por dataISO
  processedDias.sort((a, b) => a.dataISO.localeCompare(b.dataISO));

  return {
    success: true,
    totalDias: processedDias.length,
    dias: processedDias
  };
}

// Testar conexão com a API do OpenRouter
export async function testOpenRouterConnection(apiKey, modelName) {
  if (!apiKey) {
    throw new Error('Chave API não informada.');
  }

  const model = modelName || 'google/gemini-2.5-flash';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin || 'https://gestao-abib.local',
      'X-Title': 'Gestao ABIB'
    },
    body: JSON.stringify({
      model: model.trim(),
      messages: [
        { role: "user", content: "Responda apenas 'OK' em texto simples." }
      ],
      max_tokens: 10
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Erro de autenticação (Status ${response.status})`);
  }

  return true;
}
