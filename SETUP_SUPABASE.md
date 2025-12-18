# 🗄️ Configuração do Supabase - Guia Completo

## 📋 Informações do Projeto

- **URL do Supabase:** https://sqyxolugveizbhbxsnou.supabase.co
- **Project ID:** sqyxolugveizbhbxsnou
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXhvbHVndmVpemJoYnhzbm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODgxMDAsImV4cCI6MjA4MTQ2NDEwMH0.a-DSSE8Yp2Iv_6krS2w3p8k4DuetuKS8jEU7iCJbnHM`

## 🚀 Passo a Passo

### 1. Obter a Senha do Banco de Dados

1. Acesse: https://supabase.com/dashboard/project/sqyxolugveizbhbxsnou
2. Vá em **Settings** (⚙️) no menu lateral
3. Clique em **Database**
4. Role até encontrar **Database Password**
5. Se não tiver senha definida:
   - Clique em **Reset Database Password**
   - **COPIE A SENHA** (você só verá uma vez!)
6. Se já tiver senha:
   - Clique em **Show** para revelar
   - **COPIE A SENHA**

### 2. Obter a Connection String

No mesmo lugar (Settings > Database), você encontrará:

#### Opção A: Connection Pooling (Recomendado)
```
postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### Opção B: Direct Connection (Para migrations)
```
postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**⚠️ IMPORTANTE:** 
- Substitua `[YOUR-PASSWORD]` pela senha que você copiou
- Substitua `[REGION]` pela região do seu projeto (ex: `us-east-1`, `sa-east-1`)

### 3. Configurar o arquivo `.env`

No arquivo `backend/.env`, configure:

```env
# Substitua [YOUR-PASSWORD] pela senha do banco
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Para migrations, use a connection direta (porta 5432):**
```env
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### 4. Instalar Dependências

```bash
cd backend
npm install
```

### 5. Gerar Prisma Client

```bash
npm run prisma:generate
```

### 6. Executar Migrations

```bash
# Criar e aplicar migrations
npm run prisma:migrate

# OU se já tiver migrations criadas:
npx prisma migrate deploy
```

### 7. Verificar Conexão

```bash
# Abrir Prisma Studio (opcional)
npm run prisma:studio

# Ou testar a conexão
npx prisma db pull
```

## 🔧 Script Automatizado

Execute o script de setup:

```bash
cd backend
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

## ✅ Verificação

Após configurar, teste a conexão:

```bash
cd backend
npm run start:dev
```

Se tudo estiver correto, você verá:
```
🚀 WhatsApp Chat API is running!
📍 Server:    http://localhost:3001
📍 API:       http://localhost:3001/api/v1
📍 Docs:      http://localhost:3001/docs
```

## 🐛 Troubleshooting

### Erro: "Connection refused" ou "timeout"

1. **Verifique a senha:** Certifique-se de que copiou corretamente
2. **Verifique a região:** A região pode ser diferente (ex: `sa-east-1` para Brasil)
3. **Use connection direta:** Tente a porta `5432` ao invés de `6543`
4. **Adicione SSL:** Adicione `?sslmode=require` na URL

### Erro: "Too many connections"

- Use a connection string com pooler (porta 6543)
- Adicione `?connection_limit=1` na URL

### Erro: "SSL required"

Adicione `?sslmode=require` na connection string:

```env
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
```

### Erro: "schema does not exist"

Execute as migrations primeiro:

```bash
npm run prisma:migrate
```

## 📚 Recursos Úteis

- [Dashboard Supabase](https://supabase.com/dashboard/project/sqyxolugveizbhbxsnou)
- [Documentação Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)

## 🎯 Próximos Passos

Após configurar o banco:

1. ✅ Teste a conexão
2. ✅ Execute as migrations
3. ✅ Inicie o backend: `npm run start:dev`
4. ✅ Teste o registro de usuário via API
5. ✅ Configure o WhatsApp Business API

---

**Dúvidas?** Consulte o arquivo `backend/scripts/setup-supabase.md` para mais detalhes.

