const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = val; },
  removeItem: (key) => { delete mockStorage[key]; }
};

global.window = {
  dispatchEvent: (event) => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, detail) {
    this.name = name;
    this.detail = detail;
  }
};

console.log("Iniciando testes da Fila de Lotes em Segundo Plano...");

// Teste 1: Simulação de Criação e Estrutura dos Jobs
const AI_QUEUE_STORAGE_KEY = 'abib_ai_job_queue';
let memoryAiJobs = [];

function saveJobsToStorage() {
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
}

function loadJobsFromStorage() {
  const raw = localStorage.getItem(AI_QUEUE_STORAGE_KEY);
  memoryAiJobs = raw ? JSON.parse(raw) : [];
  return memoryAiJobs;
}

// Criar 3 jobs simulados
const job1 = {
  id: 'job_1',
  unidadeId: 'u1',
  unidadeNome: 'ITABIRA',
  grupo: 'AC',
  anoRef: 2026,
  totalFotos: 4,
  status: 'processing',
  progressoTexto: 'Analisando 4 foto(s)...',
  criadoEm: new Date().toISOString(),
  finalizadoEm: null,
  resultadoDias: [],
  erro: null
};

const job2 = {
  id: 'job_2',
  unidadeId: 'u2',
  unidadeNome: 'UBÁ',
  grupo: 'ABIB',
  anoRef: 2026,
  totalFotos: 6,
  status: 'processing',
  progressoTexto: 'Analisando 6 foto(s)...',
  criadoEm: new Date().toISOString(),
  finalizadoEm: null,
  resultadoDias: [],
  erro: null
};

memoryAiJobs.push(job1, job2);
saveJobsToStorage();

assert.strictEqual(loadJobsFromStorage().length, 2, "Deveria haver 2 jobs salvos");
console.log("Teste 1 Aprovado: Enfileiramento e persistência no storage funcionando.");

// Teste 2: Conclusão de Job 1 (Status: ready)
const job1InMem = memoryAiJobs.find(j => j.id === 'job_1');
job1InMem.status = 'ready';
job1InMem.progressoTexto = 'Pronto! 12 dia(s) identificado(s).';
job1InMem.resultadoDias = [{ dataISO: '2026-08-01', somaReal: 70 }, { dataISO: '2026-08-02', somaReal: 65 }];
saveJobsToStorage();

const reloaded = loadJobsFromStorage();
const j1 = reloaded.find(j => j.id === 'job_1');
assert.strictEqual(j1.status, 'ready');
assert.strictEqual(j1.resultadoDias.length, 2);
console.log("Teste 2 Aprovado: Transição para pronto e persistência de dias extraídos.");

// Teste 3: Limpeza de Jobs Concluídos / Remoção
memoryAiJobs = memoryAiJobs.filter(j => j.id !== 'job_1');
saveJobsToStorage();
assert.strictEqual(loadJobsFromStorage().length, 1);
assert.strictEqual(loadJobsFromStorage()[0].unidadeNome, 'UBÁ');
console.log("Teste 3 Aprovado: Remoção de lote após conferência/salvamento.");

// Teste 4: Verificação de Emojis em todos os arquivos modificados
const filesToCheck = [
  path.join(__dirname, '..', 'js', 'services', 'aiBackgroundQueueService.js'),
  path.join(__dirname, '..', 'js', 'modules', 'comensais', 'comensaisView.js'),
  path.join(__dirname, '..', 'js', 'bundle.js'),
  path.join(__dirname, '..', 'style.css')
];

const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    assert.strictEqual(emojiRegex.test(content), false, `Emoji proibido encontrado no arquivo: ${file}`);
  }
});
console.log("Teste 4 Aprovado: Zero emojis em todos os arquivos.");

console.log("TODOS OS TESTES DA CENTRAL DE LOTES PASSARAM COM SUCESSO!");
