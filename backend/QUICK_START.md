# ⚡ Quick Start - Configuração Rápida

## 🎯 Para Começar AGORA

### 1. Configure o Banco Supabase

```bash
cd backend

# 1. Copie o arquivo de exemplo
cp env.example .env

# 2. Edite o .env e configure a DATABASE_URL
# Você precisa da senha do banco do Supabase Dashboard
# Veja: SETUP_SUPABASE.md para instruções detalhadas
```

**Connection String exemplo:**
```env
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:[SUA_SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### 2. Instale e Configure

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations (cria todas as tabelas)
npm run prisma:migrate
```

### 3. Inicie o Servidor

```bash
npm run start:dev
```

### 4. Teste a API

Acesse: http://localhost:3001/docs

**Teste rápido - Criar usuário:**
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "Senha123!",
    "firstName": "João",
    "lastName": "Silva",
    "organizationName": "Minha Empresa"
  }'
```

## ✅ Checklist

- [ ] Configurei a `DATABASE_URL` no `.env`
- [ ] Executei `npm install`
- [ ] Executei `npm run prisma:generate`
- [ ] Executei `npm run prisma:migrate`
- [ ] Servidor iniciou sem erros
- [ ] Consigo acessar http://localhost:3001/docs

## 🐛 Problemas Comuns

### "Cannot connect to database"
- Verifique se a senha está correta no `.env`
- Verifique se a região está correta (pode ser `sa-east-1` para Brasil)
- Tente usar porta `5432` ao invés de `6543`

### "Migration failed"
- Certifique-se de que o banco está vazio ou use `prisma migrate reset`
- Verifique se a connection string está correta

### "Module not found"
- Execute `npm install` novamente
- Delete `node_modules` e `package-lock.json` e reinstale

## 📚 Próximos Passos

1. Configure o WhatsApp Business API (veja README.md)
2. Configure o frontend (veja frontend/README.md)
3. Teste o fluxo completo de chat

---

**Precisa de ajuda?** Veja `SETUP_SUPABASE.md` para configuração detalhada do banco.

