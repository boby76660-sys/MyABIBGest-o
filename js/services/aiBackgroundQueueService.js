/**
 * ABIB Gestão - Serviço de Fila e Processamento em Segundo Plano da IA
 * Gerenciador de Lotes Assíncronos para Múltiplas Unidades
 */

const AI_QUEUE_STORAGE_KEY = 'abib_ai_job_queue';

let memoryAiJobs = [];

function loadJobsFromStorage() {
  try {
    const raw = localStorage.getItem(AI_QUEUE_STORAGE_KEY);
    if (raw) {
      memoryAiJobs = JSON.parse(raw);
      // Se algum job ficou em 'processing' ao fechar a aba, marcar como interrompido
      memoryAiJobs.forEach(job => {
        if (job.status === 'processing') {
          job.status = 'error';
          job.erro = 'Processamento interrompido ao fechar/recarregar a página.';
        }
      });
    } else {
      memoryAiJobs = [];
    }
  } catch (e) {
    memoryAiJobs = [];
  }
  return memoryAiJobs;
}

function saveJobsToStorage() {
  try {
    // Salva sem os arquivos de imagem binários (apenas os dados processados e metadados)
    const serializable = memoryAiJobs.map(j => ({
      id: j.id,
      unidadeId: j.unidadeId,
      unidadeNome: j.unidadeNome,
      grupo: j.grupo,
      anoRef: j.anoRef,
      totalFotos: j.totalFotos,
      status: j.status,
      progressoTexto: j.progressoTexto,
      criadoEm: j.criadoEm,
      finalizadoEm: j.finalizadoEm,
      resultadoDias: j.resultadoDias || [],
      erro: j.erro || null
    }));
    localStorage.setItem(AI_QUEUE_STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.error("Erro ao salvar fila de jobs no storage:", e);
  }
}

function emitQueueChangeEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('abib_ai_queue_change', {
      detail: { jobs: [...memoryAiJobs] }
    }));
  }
}

// Inicializar na carga
loadJobsFromStorage();

export function getAiJobs() {
  return [...memoryAiJobs];
}

export function getAiJob(jobId) {
  return memoryAiJobs.find(j => j.id === jobId) || null;
}

export function removeAiJob(jobId) {
  memoryAiJobs = memoryAiJobs.filter(j => j.id !== jobId);
  saveJobsToStorage();
  emitQueueChangeEvent();
  return memoryAiJobs;
}

export function clearCompletedAiJobs() {
  memoryAiJobs = memoryAiJobs.filter(j => j.status === 'processing');
  saveJobsToStorage();
  emitQueueChangeEvent();
  return memoryAiJobs;
}

/**
 * Cria e dispara um novo lote de processamento em segundo plano
 */
export async function enqueueAiJob({ unidadeId, unidadeNome, grupo, anoRef, files }) {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const novoJob = {
    id: jobId,
    unidadeId,
    unidadeNome: unidadeNome || 'Unidade',
    grupo: grupo || '-',
    anoRef: anoRef || new Date().getFullYear(),
    totalFotos: files ? files.length : 0,
    status: 'processing',
    progressoTexto: 'Preparando e comprimindo fotos...',
    criadoEm: new Date().toISOString(),
    finalizadoEm: null,
    resultadoDias: [],
    erro: null
  };

  memoryAiJobs.unshift(novoJob);
  saveJobsToStorage();
  emitQueueChangeEvent();

  // Iniciar execução assíncrona não-bloqueante nos bastidores
  executeJobInBackground(novoJob, files).catch(err => {
    console.error(`Erro inesperado no job ${jobId}:`, err);
  });

  return novoJob;
}

async function executeJobInBackground(job, files) {
  try {
    job.progressoTexto = `Comprimindo ${files.length} foto(s)...`;
    saveJobsToStorage();
    emitQueueChangeEvent();

    // Importar dinamicamente os métodos de visão para evitar dependências circulares
    const { extractComensaisFromImages } = await import('./aiVisionService.js');

    job.progressoTexto = `Analisando ${files.length} foto(s) com IA (OpenRouter)...`;
    saveJobsToStorage();
    emitQueueChangeEvent();

    const resultado = await extractComensaisFromImages(files, { referenciaAno: job.anoRef });

    if (!resultado || !resultado.dias || resultado.dias.length === 0) {
      throw new Error("Nenhum dia ou tabela de contagem foi identificada nas fotos.");
    }

    job.status = 'ready';
    job.progressoTexto = `Pronto! ${resultado.dias.length} dia(s) identificado(s).`;
    job.resultadoDias = resultado.dias;
    job.finalizadoEm = new Date().toISOString();
    job.erro = null;

    saveJobsToStorage();
    emitQueueChangeEvent();

    if (typeof showToast === 'function') {
      showToast(`Lote da unidade ${job.unidadeNome} concluído! ${resultado.dias.length} dia(s) prontos para conferência.`, 'success');
    }
  } catch (err) {
    console.error(`Falha no processamento do lote ${job.unidadeNome}:`, err);
    job.status = 'error';
    job.erro = err.message || 'Erro ao comunicar com a IA do OpenRouter.';
    job.progressoTexto = 'Falha na leitura.';
    job.finalizadoEm = new Date().toISOString();

    saveJobsToStorage();
    emitQueueChangeEvent();

    if (typeof showToast === 'function') {
      showToast(`Erro no lote da unidade ${job.unidadeNome}: ${job.erro}`, 'error');
    }
  }
}
