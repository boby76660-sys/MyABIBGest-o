const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{200D}\u{FE0F}]/gu;

const removedEmojisMap = new Map();

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Encontrar todos os emojis
  const matches = content.match(emojiRegex);
  if (matches) {
    matches.forEach(e => {
      removedEmojisMap.set(e, (removedEmojisMap.get(e) || 0) + 1);
    });

    // Subtituições específicas de texto para ficar limpo
    content = content.replace(/🔒 Lançamento Exclusivo:?/gi, '');
    content = content.replace(/🚪 Sair da Gestão/gi, 'Sair da Gestão');
    content = content.replace(/🔑 Entrar com Senha/gi, 'Entrar com Senha');
    content = content.replace(/📱 Links das 21 Unidades/gi, 'Links das 21 Unidades');
    content = content.replace(/📱 Listas Formatadas/gi, 'Listas Formatadas');
    content = content.replace(/📱 Gerar Listas/gi, 'Gerar Listas');
    content = content.replace(/📱 Links de Acesso/gi, 'Links de Acesso');
    content = content.replace(/📱 /gi, '');
    content = content.replace(/📋 Copiar/gi, 'Copiar');
    content = content.replace(/📋 /gi, '');
    content = content.replace(/🔄 Regerar/gi, 'Regerar');
    content = content.replace(/🔗 /gi, '');
    content = content.replace(/✅ /gi, '');
    content = content.replace(/⚠️ /gi, '');
    content = content.replace(/❌ /gi, '');
    content = content.replace(/🚀 /gi, '');
    content = content.replace(/🥦 /gi, '');
    content = content.replace(/🏛️ /gi, '');
    content = content.replace(/🔍 /gi, '');
    content = content.replace(/💾 /gi, '');
    content = content.replace(/✏️ /gi, '');
    content = content.replace(/📥 /gi, '');
    content = content.replace(/📊 /gi, '');
    content = content.replace(/🛒 /gi, '');
    content = content.replace(/💰 /gi, '');
    content = content.replace(/📌 /gi, '');
    content = content.replace(/📅 /gi, '');
    content = content.replace(/📆 /gi, '');
    content = content.replace(/🔴 /gi, '');
    content = content.replace(/👋 /gi, '');
    content = content.replace(/👤 /gi, '');
    content = content.replace(/👥 /gi, '');
    content = content.replace(/⚙️ /gi, '');
    content = content.replace(/🔥 /gi, '');
    content = content.replace(/➕ /gi, '');
    content = content.replace(/🏆 /gi, '');
    content = content.replace(/📈 /gi, '');
    content = content.replace(/🍩 /gi, '');
    content = content.replace(/📄 /gi, '');

    // Remover qualquer outro emoji restante
    content = content.replace(emojiRegex, '');

    // Limpar espaços duplos resultantes de remoções
    content = content.replace(/<span>\s*<\/span>/gi, '');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Emojis removidos de: ${filePath}`);
    }
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item.startsWith('.') || item === 'node_modules' || item === 'scratch') continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith('.js') || item.endsWith('.html') || item.endsWith('.css')) {
      cleanFile(fullPath);
    }
  }
}

processDirectory('c:/Users/guilherme/Downloads/27.07.26/Gestão');

console.log("\n--- RESUMO DE EMOJIS REMOVIDOS ---");
console.log(JSON.stringify(Object.fromEntries(removedEmojisMap), null, 2));
