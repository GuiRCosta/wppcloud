# 🚂 Deploy do Backend na Railway

## Por que Railway?

- ✅ Suporta WebSockets (Socket.io)
- ✅ Suporta conexões persistentes (Redis, PostgreSQL)
- ✅ Upload de arquivos
- ✅ Deploy automático via GitHub
- ✅ Variáveis de ambiente fáceis
- ✅ Plano gratuito generoso

## Passo a Passo

### 1. Criar Conta e Projeto

1. Acesse [Railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório `GuiRCosta/wppcloud`

### 2. Configurar o Serviço ⚠️ IMPORTANTE

**CRÍTICO:** O Railway precisa saber que o backend está na pasta `backend/`

1. Após criar o projeto, clique no serviço criado
2. Vá em **Settings** (ícone de engrenagem)
3. Role até **Root Directory**
4. **Digite:** `backend` (sem barra no final)
5. Clique em **Save**

Agora configure os comandos:

1. Vá em **Settings** > **Deploy**
2. **Build Command:** `npm install && npm run build`
3. **Start Command:** `npm run start:migrate`
4. Salve as alterações

**OU** configure via interface:
- **Settings** > **Deploy** > **Deploy Command**
- Deixe vazio (Railway detectará automaticamente do `package.json`)

### 3. Adicionar Banco de Dados PostgreSQL

1. No projeto Railway, clique em "+ New"
2. Selecione "Database" > "PostgreSQL"
3. Railway criará automaticamente:
   - `DATABASE_URL` (connection string)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

### 4. Adicionar Redis (Opcional mas Recomendado)

1. No projeto Railway, clique em "+ New"
2. Selecione "Database" > "Redis"
3. Railway criará automaticamente:
   - `REDIS_HOST`
   - `REDIS_PORT`
   - `REDIS_PASSWORD`

### 5. Configurar Variáveis de Ambiente

No painel do serviço, vá em "Variables" e adicione:

```bash
# JWT
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PREFIX=api/v1
PORT=3001
NODE_ENV=production

# CORS (use a URL do seu frontend na Vercel)
CORS_ORIGIN=https://seu-app.vercel.app

# WhatsApp (configure depois)
WABA_ID=
PHONE_NUMBER_ID=
PHONE_NUMBER=
ACCESS_TOKEN=
WEBHOOK_SECRET=
```

### 6. Executar Migrações do Prisma

1. No painel do serviço, vá em "Settings"
2. Role até "Deploy Command"
3. Configure como:
   ```bash
   npx prisma migrate deploy && npm run start:prod
   ```

   Ou adicione um script no `package.json`:
   ```json
   "start:migrate": "prisma migrate deploy && npm run start:prod"
   ```

### 7. Configurar Webhook do WhatsApp

1. Após o deploy, copie a URL do seu serviço (ex: `https://seu-backend.railway.app`)
2. Configure o webhook no Meta for Developers:
   - URL: `https://seu-backend.railway.app/webhook/whatsapp`
   - Verify Token: (o mesmo que você configurou em `WEBHOOK_SECRET`)

### 8. Atualizar Frontend

No frontend (Vercel), configure as variáveis:

```
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app/api/v1
NEXT_PUBLIC_SOCKET_URL=https://seu-backend.railway.app
```

## Estrutura do Projeto Railway

```
Railway Project
├── PostgreSQL Database (automático)
├── Redis Database (opcional)
└── Backend Service
    ├── Root: backend/
    ├── Build: npm install && npm run build
    └── Start: npm run start:prod
```

## Troubleshooting

### Erro de Conexão com Banco
- Verifique se o `DATABASE_URL` está correto
- Certifique-se de que as migrações foram executadas
- Verifique os logs do Railway

### WebSocket não funciona
- Verifique se o `CORS_ORIGIN` está configurado
- Verifique se o frontend está usando `wss://` (não `ws://`)
- Verifique os logs do Railway

### Build falha
- Verifique os logs de build
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o Node.js version está correto (Railway detecta automaticamente)

## Comandos Úteis

```bash
# Ver logs
railway logs

# Conectar ao banco localmente
railway connect

# Executar comandos no ambiente Railway
railway run npm run prisma:studio
```

## Custos

- **Plano Gratuito:** $5 de crédito/mês (suficiente para desenvolvimento)
- **Hobby:** $20/mês (recomendado para produção)
- **Pro:** $100/mês (para equipes)

## Próximos Passos

1. ✅ Deploy do backend na Railway
2. ✅ Configurar variáveis de ambiente
3. ✅ Executar migrações
4. ✅ Testar API
5. ✅ Configurar webhook do WhatsApp
6. ✅ Atualizar frontend com URLs corretas

