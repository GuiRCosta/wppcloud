# 📱 WhatsApp Chat - Plataforma de Atendimento

Plataforma completa para atendimento via WhatsApp Business Cloud API. Integração oficial com a API da Meta para receber e enviar mensagens de texto, imagens, vídeos, áudios, documentos e muito mais.

![WhatsApp Chat](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🚀 Features

### MVP Implementado
- ✅ **Autenticação** - Login/Registro com JWT + Refresh Token
- ✅ **Sistema de Usuários** - Roles (Admin, Supervisor, Agent)
- ✅ **Inbox de Conversas** - Lista com filtros e busca
- ✅ **Chat em Tempo Real** - WebSocket para mensagens instantâneas
- ✅ **Envio de Mensagens** - Texto, emojis
- ✅ **Recebimento via Webhook** - Integração com Meta Cloud API
- ✅ **Status de Mensagens** - Enviado, entregue, lido
- ✅ **Typing Indicator** - "Digitando..." em tempo real
- ✅ **Interface Responsiva** - Design moderno e intuitivo

### Em Desenvolvimento
- 🔄 Envio de mídias (imagens, vídeos, áudios, documentos)
- 🔄 Mensagens interativas (botões e listas)
- 🔄 Templates de mensagem
- 🔄 Dashboard com métricas
- 🔄 Atribuição de conversas
- 🔄 Respostas rápidas
- 🔄 Tags e notas

## 🛠️ Stack Tecnológica

### Backend
- **NestJS** - Framework Node.js
- **Prisma** - ORM
- **PostgreSQL** - Banco de dados
- **Redis** - Cache e Pub/Sub
- **Socket.io** - WebSocket
- **JWT** - Autenticação

### Frontend
- **Next.js 14** - React Framework
- **TailwindCSS** - Estilização
- **Zustand** - State Management
- **React Query** - Data Fetching
- **Socket.io Client** - WebSocket

## 📦 Instalação

### Pré-requisitos
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Conta Meta Business (para WhatsApp API)

### 1. Clone o repositório
```bash
git clone <repo-url>
cd "Chat API CLOUD META"
```

### 2. Configure as variáveis de ambiente

#### Backend (`backend/.env`)
```env
# Copie o arquivo de exemplo
cp backend/env.example backend/.env

# Edite com suas configurações
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whatsapp_chat"
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (gere chaves seguras em produção)
JWT_SECRET=sua-chave-secreta-jwt
JWT_REFRESH_SECRET=sua-chave-secreta-refresh

# WhatsApp Cloud API (obtenha em developers.facebook.com)
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_ACCESS_TOKEN=seu-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu-token-de-verificacao
META_APP_SECRET=seu-app-secret
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 3. Instale as dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Configure o banco de dados

```bash
cd backend

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate
```

### 5. Inicie os serviços

```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Acesse a aplicação
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api/v1
- **Docs (Swagger):** http://localhost:3001/docs

## 🐳 Docker

### Usando Docker Compose
```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Apenas banco de dados
```bash
# Subir apenas PostgreSQL e Redis
docker-compose up -d postgres redis
```

## 📡 Configuração do WhatsApp

### 1. Criar App no Meta for Developers
1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um novo App do tipo "Business"
3. Adicione o produto "WhatsApp Business"

### 2. Configurar Webhook
1. No painel do WhatsApp, vá em "Configuration"
2. Configure o Webhook URL: `https://seu-dominio.com/webhook/whatsapp`
3. Configure o Verify Token (mesmo do `.env`)
4. Inscreva-se nos eventos `messages`

### 3. Obter Access Token
1. Em "API Setup", gere um Access Token permanente
2. Copie o Phone Number ID
3. Configure no `.env`

## 📁 Estrutura do Projeto

```
Chat API CLOUD META/
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/        # Autenticação
│   │   │   ├── users/       # Usuários
│   │   │   ├── conversations/ # Conversas
│   │   │   ├── messages/    # Mensagens
│   │   │   ├── webhook/     # Webhook WhatsApp
│   │   │   ├── whatsapp/    # Serviço WhatsApp
│   │   │   └── websocket/   # WebSocket
│   │   ├── prisma/          # Prisma Service
│   │   └── redis/           # Redis Service
│   └── prisma/
│       └── schema.prisma    # Schema do banco
│
├── frontend/                 # Next.js
│   └── src/
│       ├── app/             # App Router
│       ├── components/      # Componentes React
│       ├── stores/          # Zustand Stores
│       └── lib/             # Utilitários
│
├── docker-compose.yml       # Docker Compose
└── README.md
```

## 🔒 Segurança

- Autenticação JWT com refresh tokens
- RBAC (Role-Based Access Control)
- Validação de assinatura do webhook
- Rate limiting
- CORS configurável
- Senhas hasheadas com bcrypt

## 📖 Documentação

- [Arquitetura Completa](./ARQUITETURA_WHATSAPP_CLOUD_API.md)
- [Sistema de Usuários e UX](./SISTEMA_USUARIOS_UX_DESIGN.md)
- [API Swagger](http://localhost:3001/docs) (após iniciar o backend)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com 💚 para integração com WhatsApp Business Cloud API

