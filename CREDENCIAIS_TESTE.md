# 🔐 Credenciais de Acesso - Ambiente de Teste

## 📋 Usuários Criados

### 👤 SUPER_ADMIN
- **Email:** `admin@teste.com`
- **Senha:** `Admin@123`
- **Nome:** Admin Sistema
- **Permissões:** Acesso total ao sistema

### 👤 SUPERVISOR
- **Email:** `supervisor@teste.com`
- **Senha:** `Supervisor@123`
- **Nome:** Supervisor Teste
- **Permissões:** Gerenciamento de equipes e relatórios

### 👤 AGENT
- **Email:** `agente@teste.com`
- **Senha:** `Agente@123`
- **Nome:** Agente Teste
- **Permissões:** Atendimento de conversas

## 🏢 Organização

- **Nome:** Empresa Teste
- **Slug:** empresa-teste

## 🚀 Como Usar

1. Acesse o frontend: `http://localhost:3000`
2. Faça login com qualquer uma das credenciais acima
3. O primeiro login pode redirecionar para `/chat` ou `/settings`

## 🔄 Recriar Usuários

Se precisar recriar os usuários, execute:

```bash
cd backend
npm run seed:users
```

Ou usando o seed do Prisma:

```bash
cd backend
npm run prisma:seed
```

## ⚠️ Importante

- Estas credenciais são apenas para **desenvolvimento e testes**
- **NÃO** use estas senhas em produção
- Altere as senhas após o primeiro login em ambiente de produção
- As senhas seguem o padrão: `[Role]@123`

