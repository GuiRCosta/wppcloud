# 🔧 Configurar Connection String do Supabase

## ⚠️ Erro: "Tenant or user not found"

Este erro geralmente significa que a **região** ou o **formato da connection string** está incorreto.

## 📋 Como Obter a Connection String Correta

### Passo 1: Acesse o Dashboard do Supabase

1. Vá em: https://supabase.com/dashboard/project/sqyxolugveizbhbxsnou
2. Clique em **Settings** (⚙️) no menu lateral
3. Clique em **Database**

### Passo 2: Copie a Connection String

No painel Database, você verá duas opções:

#### Opção A: Connection Pooling (Recomendado para produção)
```
postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### Opção B: Direct Connection (Para migrations)
```
postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

**⚠️ IMPORTANTE:**
- Substitua `[YOUR-PASSWORD]` por: `R%40padura%2114` (senha já codificada)
- A **REGION** pode ser diferente! Exemplos:
  - `us-east-1` (Estados Unidos)
  - `sa-east-1` (Brasil - São Paulo)
  - `eu-west-1` (Europa)
  - Outras regiões...

### Passo 3: Atualizar o arquivo `.env`

Edite o arquivo `backend/.env` e atualize a `DATABASE_URL`:

```env
# Para migrations (use esta primeiro):
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-[SUA_REGIAO].pooler.supabase.com:5432/postgres"

# Exemplo para Brasil (São Paulo):
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

### Passo 4: Testar a Conexão

```bash
cd backend
node scripts/test-connection.js
```

Se funcionar, você verá:
```
✅ Conexão estabelecida com sucesso!
```

### Passo 5: Executar Migrations

```bash
npm run prisma:migrate
```

## 🔍 Como Descobrir a Região

1. No Dashboard do Supabase, vá em **Settings** > **Database**
2. Procure por **Connection string** ou **Connection pooling**
3. A URL mostrará a região, por exemplo:
   - `aws-0-us-east-1` = Região: `us-east-1`
   - `aws-0-sa-east-1` = Região: `sa-east-1`
   - `aws-0-eu-west-1` = Região: `eu-west-1`

## 📝 Exemplo Completo

Se sua região for `sa-east-1` (Brasil), use:

```env
# Para migrations:
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"

# Para produção (com pooler):
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

## 🐛 Troubleshooting

### Erro persiste mesmo com a região correta?

1. **Verifique a senha:** Certifique-se de que está usando `R%40padura%2114` (codificada)
2. **Use connection direta:** Tente a porta `5432` ao invés de `6543`
3. **Verifique SSL:** Adicione `?sslmode=require` se necessário
4. **Teste no Supabase Studio:** Acesse o SQL Editor no dashboard e teste uma query simples

### Ainda não funciona?

Copie a connection string **EXATA** do dashboard do Supabase e substitua apenas a senha por `R%40padura%2114`.

---

**Dica:** Após configurar corretamente, execute:
```bash
npm run prisma:migrate
```

Isso criará todas as tabelas necessárias no banco de dados!

