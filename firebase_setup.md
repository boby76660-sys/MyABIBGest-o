# 📊 Guia Passo a Passo: Configuração do Firebase Realtime Database

O sistema já funciona 100% nativamente via **LocalStorage** sem nenhuma configuração prévia. Para sincronizar os dados em tempo real na nuvem do Google entre todos os celulares e computadores, siga este passo a passo simples de 2 minutos para ativar o **Firebase Realtime Database**.

---

## 1. Criar o Projeto Gratuito no Firebase
1. Acesse o console do Google Firebase: [console.firebase.google.com](https://console.firebase.google.com/)
2. Faça login com qualquer conta do Google (Gmail).
3. Clique em **"Adicionar projeto"** (ou **"Criar um projeto"**).
4. Digite o nome do projeto (exemplo: `abib-gestao`) e clique em **Continuar**.
5. O Google Analytics é opcional (pode desativar) e clique em **Criar projeto**.

---

## 2. Ativar o Realtime Database
1. No menu lateral esquerdo do Firebase, clique em **Criação** (ou *Build*) -> **Realtime Database**.
2. Clique no botão **"Criar banco de dados"**.
3. Em localização, selecione `United States (us-central1)` ou a mais próxima e clique em **Avançar**.
4. Em Regras de Segurança, selecione **"Iniciar no modo de teste"** (isso define `".read": true, ".write": true` para liberar o acesso inicial) e clique em **Ativar**.

---

## 3. Copiar a URL do Banco e as Credenciais
1. No topo da tela do **Realtime Database**, você verá a URL do seu banco, parecida com:
   `https://abib-gestao-default-rtdb.firebaseio.com/`
2. No menu lateral esquerdo, clique no ícone de engrenagem ⚙️ -> **Configurações do projeto**.
3. Em *Seus aplicativos*, clique no ícone **Web (`</>`)** para registrar a aplicação.
4. O Firebase exibirá um trecho de código com o objeto `firebaseConfig`. Exemplo:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-xxxxx...",
  databaseURL: "https://abib-gestao-default-rtdb.firebaseio.com",
  projectId: "abib-gestao"
};
```

---

## 4. Colar as Credenciais no Sistema
1. Abra o sistema no navegador (`index.html`).
2. Clique no botão **"Admin"** (no canto superior direito).
3. Digite a Senha Máster padrão: `admin123`.
4. Vá para a aba **"🔥 Configurar Firebase"**.
5. Cole os valores de `apiKey` e `databaseURL` nos campos e clique em **Salvar Credenciais**.
6. Pronto! Todas as 21 unidades e relatórios ficarão sincronizados instantaneamente em nuvem no Realtime Database!
