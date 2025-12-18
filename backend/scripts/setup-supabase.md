# 🔧 Configuração do Supabase - Guia Passo a Passo

## 1. Obter a Senha do Banco de Dados

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto: `sqyxolugveizbhbxsnou`
3. Vá em **Settings** > **Database**
4. Role até encontrar **Database Password**
5. Se não tiver uma senha definida, clique em **Reset Database Password**
6. **Copie a senha gerada** (você só verá uma vez!)

## 2. Configurar a Connection String

### Opção A: Usando Pooler (Recomendado para produção)
```env
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[SUA_SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### Opção B: Connection Direta (Para migrations)
```env
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[SUA_SENHA]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**⚠️ IMPORTANTE:** 
- Substitua `[SUA_SENHA]` pela senha que você copiou
- A região pode variar. Verifique em **Settings** > **Database** > **Connection string**

## 3. Verificar a Região

A região do seu projeto pode ser diferente. Para verificar:

1. No Dashboard do Supabase, vá em **Settings** > **Database**
2. Procure por **Connection string** ou **Connection pooling**
3. Copie a URL completa e use no `.env`

## 4. Executar as Migrations

Após configurar o `.env`:

```bash
cd backend

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# OU se já tiver migrations:
npx prisma migrate deploy
```

## 5. Verificar Conexão

```bash
# Testar conexão
npx prisma db pull

# Abrir Prisma Studio (opcional)
npm run prisma:studio
```

## 🔍 Troubleshooting

### Erro: "Connection refused"
- Verifique se a senha está correta
- Verifique se a região está correta
- Tente usar a connection string direta (porta 5432) ao invés do pooler

### Erro: "Too many connections"
- Use a connection string com pooler (porta 6543)
- Adicione `?connection_limit=1` na URL

### Erro: "SSL required"
- Adicione `?sslmode=require` na connection string

### Exemplo completo com SSL:
```env
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[SUA_SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
```

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Prisma + Supabase](https://supabase.com/docs/guides/integrations/prisma)

