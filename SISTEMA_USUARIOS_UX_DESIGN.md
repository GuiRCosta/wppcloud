# 👥 Sistema de Usuários, Funcionalidades Essenciais & UX/Design

> **Documento Complementar de Arquitetura**  
> Versão: 1.0 | Data: Dezembro 2024

---

## 📋 Índice

1. [Sistema de Usuários](#sistema-de-usuários)
2. [Funcionalidades Essenciais](#funcionalidades-essenciais)
3. [Inspiração de Design - Apps Similares](#inspiração-de-design---apps-similares)
4. [Design System & UI Components](#design-system--ui-components)
5. [Wireframes & Layouts](#wireframes--layouts)
6. [Padrões de UX](#padrões-de-ux)
7. [Fluxos de Usuário](#fluxos-de-usuário)

---

## 👥 Sistema de Usuários

### Visão Geral do Sistema de Acesso

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE AUTENTICAÇÃO                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │     Login       │    │    Registro     │    │  Recuperação    │         │
│  │   Email/Senha   │    │    de Conta     │    │    de Senha     │         │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│           │                      │                      │                   │
│           └──────────────────────┼──────────────────────┘                   │
│                                  │                                          │
│                          ┌───────▼───────┐                                  │
│                          │  2FA / MFA    │                                  │
│                          │  (Opcional)   │                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│                          ┌───────▼───────┐                                  │
│                          │  JWT Token    │                                  │
│                          │  Generation   │                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│           ┌──────────────────────┼──────────────────────┐                   │
│           │                      │                      │                   │
│  ┌────────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐         │
│  │     ADMIN       │    │   SUPERVISOR    │    │     AGENT       │         │
│  │   Full Access   │    │  Team Manager   │    │   Atendimento   │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hierarquia de Roles (RBAC)

#### 1. Super Admin (Proprietário)
```typescript
permissions: {
  // Configurações Globais
  manageOrganization: true,
  manageBilling: true,
  manageIntegrations: true,
  manageWhatsAppSettings: true,
  
  // Usuários
  createUsers: true,
  editUsers: true,
  deleteUsers: true,
  assignRoles: true,
  
  // Conversas
  viewAllConversations: true,
  deleteConversations: true,
  exportData: true,
  
  // Relatórios
  viewAllReports: true,
  viewFinancialReports: true,
  
  // Templates
  createTemplates: true,
  editTemplates: true,
  deleteTemplates: true,
}
```

#### 2. Admin
```typescript
permissions: {
  // Usuários
  createUsers: true,
  editUsers: true,
  deleteUsers: false, // Não pode deletar
  assignRoles: true, // Apenas roles inferiores
  
  // Conversas
  viewAllConversations: true,
  deleteConversations: false,
  exportData: true,
  
  // Relatórios
  viewAllReports: true,
  viewFinancialReports: false,
  
  // Templates
  createTemplates: true,
  editTemplates: true,
  deleteTemplates: false,
}
```

#### 3. Supervisor
```typescript
permissions: {
  // Usuários
  createUsers: false,
  editUsers: false,
  viewTeamMembers: true,
  
  // Conversas
  viewTeamConversations: true,
  assignConversations: true,
  transferConversations: true,
  
  // Relatórios
  viewTeamReports: true,
  viewAgentPerformance: true,
  
  // Templates
  useTemplates: true,
  createTemplates: false,
}
```

#### 4. Agent (Atendente)
```typescript
permissions: {
  // Conversas
  viewAssignedConversations: true,
  viewUnassignedConversations: true, // Pool
  claimConversation: true,
  sendMessages: true,
  addNotes: true,
  addTags: true,
  
  // Templates
  useTemplates: true,
  
  // Perfil
  editOwnProfile: true,
  viewOwnStats: true,
}
```

### Modelo de Dados - Usuários

```prisma
// schema.prisma - Extensão para Usuários

enum UserRole {
  SUPER_ADMIN
  ADMIN
  SUPERVISOR
  AGENT
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  PENDING_VERIFICATION
}

enum OnlineStatus {
  ONLINE
  AWAY
  BUSY
  OFFLINE
}

model Organization {
  id              String   @id @default(uuid())
  name            String
  slug            String   @unique
  logo            String?
  timezone        String   @default("America/Sao_Paulo")
  
  // WhatsApp Config
  wabaId          String?  @map("waba_id")
  phoneNumberId   String?  @map("phone_number_id")
  accessToken     String?  @map("access_token")
  webhookSecret   String?  @map("webhook_secret")
  
  // Billing
  plan            String   @default("free")
  billingEmail    String?  @map("billing_email")
  
  // Settings
  settings        Json     @default("{}")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  users           User[]
  teams           Team[]
  invitations     Invitation[]

  @@map("organizations")
}

model Team {
  id              String       @id @default(uuid())
  organizationId  String       @map("organization_id")
  name            String
  description     String?
  color           String       @default("#3B82F6")
  
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  organization    Organization @relation(fields: [organizationId], references: [id])
  members         TeamMember[]

  @@map("teams")
}

model TeamMember {
  id        String   @id @default(uuid())
  teamId    String   @map("team_id")
  userId    String   @map("user_id")
  role      String   @default("member") // leader, member
  
  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([teamId, userId])
  @@map("team_members")
}

model User {
  id              String       @id @default(uuid())
  organizationId  String       @map("organization_id")
  
  // Auth
  email           String       @unique
  passwordHash    String?      @map("password_hash")
  emailVerified   Boolean      @default(false) @map("email_verified")
  emailVerifiedAt DateTime?    @map("email_verified_at")
  
  // Profile
  firstName       String       @map("first_name")
  lastName        String       @map("last_name")
  displayName     String?      @map("display_name")
  avatar          String?
  phone           String?
  
  // Status
  role            UserRole     @default(AGENT)
  status          UserStatus   @default(PENDING_VERIFICATION)
  onlineStatus    OnlineStatus @default(OFFLINE) @map("online_status")
  lastSeenAt      DateTime?    @map("last_seen_at")
  
  // 2FA
  twoFactorEnabled Boolean     @default(false) @map("two_factor_enabled")
  twoFactorSecret  String?     @map("two_factor_secret")
  
  // Settings
  settings        Json         @default("{}")
  notificationPrefs Json       @default("{}") @map("notification_prefs")
  
  // Timestamps
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  lastLoginAt     DateTime?    @map("last_login_at")
  lastLoginIp     String?      @map("last_login_ip")

  organization    Organization @relation(fields: [organizationId], references: [id])
  teams           TeamMember[]
  sessions        Session[]
  assignedConversations Conversation[]
  activityLogs    ActivityLog[]

  @@index([organizationId])
  @@index([email])
  @@map("users")
}

model Session {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  
  // Token
  token        String   @unique
  refreshToken String   @unique @map("refresh_token")
  
  // Device Info
  userAgent    String?  @map("user_agent")
  ipAddress    String?  @map("ip_address")
  deviceType   String?  @map("device_type") // web, mobile, tablet
  
  // Validity
  expiresAt    DateTime @map("expires_at")
  lastActivity DateTime @default(now()) @map("last_activity")
  
  createdAt    DateTime @default(now()) @map("created_at")
  
  user         User     @relation(fields: [userId], references: [id])

  @@index([token])
  @@index([userId])
  @@map("sessions")
}

model Invitation {
  id             String       @id @default(uuid())
  organizationId String       @map("organization_id")
  email          String
  role           UserRole     @default(AGENT)
  teamId         String?      @map("team_id")
  
  token          String       @unique
  expiresAt      DateTime     @map("expires_at")
  
  invitedById    String       @map("invited_by_id")
  acceptedAt     DateTime?    @map("accepted_at")
  
  createdAt      DateTime     @default(now()) @map("created_at")

  organization   Organization @relation(fields: [organizationId], references: [id])

  @@index([token])
  @@index([email])
  @@map("invitations")
}

model ActivityLog {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  
  action      String   // login, logout, message_sent, conversation_claimed, etc.
  resource    String?  // conversation, user, template, etc.
  resourceId  String?  @map("resource_id")
  details     Json?
  
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @map("user_agent")
  
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("activity_logs")
}

model PasswordReset {
  id        String   @id @default(uuid())
  email     String
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  usedAt    DateTime? @map("used_at")
  
  createdAt DateTime @default(now()) @map("created_at")

  @@index([token])
  @@index([email])
  @@map("password_resets")
}
```

### Fluxos de Autenticação

#### Login com Email/Senha
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────►│   API    │────►│ Validate │────►│ Generate │
│  Login   │     │  /login  │     │ Password │     │   JWT    │
└──────────┘     └──────────┘     └────┬─────┘     └────┬─────┘
                                       │                │
                                       ▼                ▼
                                 ┌──────────┐    ┌──────────────┐
                                 │   2FA?   │───►│ Return Token │
                                 │   Yes    │    │ + Refresh    │
                                 └────┬─────┘    └──────────────┘
                                      │
                                      ▼
                                ┌───────────┐
                                │ Verify 2FA│
                                │   Code    │
                                └───────────┘
```

#### Refresh Token Flow
```typescript
// Endpoint: POST /auth/refresh
interface RefreshTokenRequest {
  refreshToken: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDTO;
}
```

### Configurações de Segurança

```typescript
// security.config.ts

export const securityConfig = {
  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfoInPassword: true,
    expirationDays: 90, // opcional
    historyCount: 5, // não repetir últimas 5 senhas
  },

  // Session
  session: {
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    maxConcurrentSessions: 5,
    inactivityTimeout: '30m',
  },

  // Rate Limiting
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxAttempts: 5,
      blockDuration: 30 * 60 * 1000, // 30 minutos
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxAttempts: 3,
    },
  },

  // 2FA
  twoFactor: {
    issuer: 'WhatsApp Chat',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    backupCodesCount: 10,
  },

  // Lockout
  accountLockout: {
    maxFailedAttempts: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutos
    resetAttemptsAfter: 15 * 60 * 1000, // 15 minutos
  },
};
```

### API Endpoints - Autenticação

```typescript
// Auth Routes

// POST /auth/register
// Registro de novo usuário (via convite)
{
  "invitationToken": "xxx",
  "firstName": "João",
  "lastName": "Silva",
  "password": "SecurePass123!",
  "phone": "+5511999999999"
}

// POST /auth/login
// Login com email/senha
{
  "email": "joao@empresa.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "type": "web",
    "userAgent": "Mozilla/5.0...",
    "platform": "macOS"
  }
}

// POST /auth/login/2fa
// Verificação 2FA
{
  "tempToken": "xxx",
  "code": "123456"
}

// POST /auth/refresh
// Renovar tokens
{
  "refreshToken": "xxx"
}

// POST /auth/logout
// Encerrar sessão atual

// POST /auth/logout-all
// Encerrar todas as sessões

// POST /auth/forgot-password
{
  "email": "joao@empresa.com"
}

// POST /auth/reset-password
{
  "token": "xxx",
  "newPassword": "NewSecurePass123!"
}

// POST /auth/2fa/enable
// Habilitar 2FA - retorna QR Code

// POST /auth/2fa/verify
// Verificar código e ativar 2FA
{
  "code": "123456"
}

// DELETE /auth/2fa/disable
// Desabilitar 2FA
{
  "password": "CurrentPass123!"
}
```

### API Endpoints - Usuários

```typescript
// User Routes

// GET /users
// Listar usuários (Admin+)
// Query: ?page=1&limit=20&role=AGENT&status=ACTIVE&search=joao

// GET /users/:id
// Detalhes do usuário

// POST /users/invite
// Convidar novo usuário (Admin+)
{
  "email": "novo@empresa.com",
  "role": "AGENT",
  "teamId": "uuid"
}

// PATCH /users/:id
// Atualizar usuário

// DELETE /users/:id
// Desativar usuário (não deleta)

// PATCH /users/:id/role
// Alterar role (Admin+)
{
  "role": "SUPERVISOR"
}

// GET /users/me
// Perfil do usuário atual

// PATCH /users/me
// Atualizar próprio perfil
{
  "firstName": "João",
  "lastName": "Silva",
  "avatar": "https://...",
  "phone": "+5511999999999"
}

// PATCH /users/me/password
// Alterar própria senha
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

// PATCH /users/me/status
// Alterar status online
{
  "onlineStatus": "AWAY"
}

// GET /users/me/sessions
// Listar sessões ativas

// DELETE /users/me/sessions/:sessionId
// Encerrar sessão específica
```

---

## 🔧 Funcionalidades Essenciais

### Prioridade CRÍTICA (Must Have)

| Funcionalidade | Descrição | Complexidade |
|----------------|-----------|--------------|
| **Inbox Unificado** | Lista de todas as conversas com filtros | Alta |
| **Chat em Tempo Real** | Envio/recebimento instantâneo via WebSocket | Alta |
| **Upload de Mídia** | Suporte a imagens, vídeos, áudios, docs | Média |
| **Notificações** | Push notifications e sons | Média |
| **Busca de Conversas** | Busca por nome, número, conteúdo | Média |
| **Status de Mensagens** | Enviado, entregue, lido | Baixa |
| **Typing Indicator** | "Digitando..." em tempo real | Baixa |

### Prioridade ALTA (Should Have)

| Funcionalidade | Descrição | Complexidade |
|----------------|-----------|--------------|
| **Atribuição de Conversas** | Distribuir conversas entre agentes | Média |
| **Tags e Etiquetas** | Categorização de conversas | Baixa |
| **Notas Internas** | Anotações não visíveis ao cliente | Baixa |
| **Respostas Rápidas** | Templates de resposta salvos | Média |
| **Transferência** | Transferir conversa para outro agente | Média |
| **Histórico de Conversa** | Scroll infinito, busca no histórico | Média |
| **Perfil do Contato** | Informações do cliente, histórico | Média |

### Prioridade MÉDIA (Could Have)

| Funcionalidade | Descrição | Complexidade |
|----------------|-----------|--------------|
| **Dashboard Analytics** | Métricas, gráficos, KPIs | Alta |
| **Relatórios** | Exportação de dados, relatórios | Alta |
| **Automações Básicas** | Auto-resposta, boas-vindas | Média |
| **Horário de Atendimento** | Mensagem fora do expediente | Baixa |
| **Fila de Espera** | Posição na fila, tempo estimado | Média |
| **Avaliação (NPS/CSAT)** | Pesquisa de satisfação | Média |

### Prioridade BAIXA (Nice to Have)

| Funcionalidade | Descrição | Complexidade |
|----------------|-----------|--------------|
| **Chatbot Builder** | Construtor visual de fluxos | Muito Alta |
| **Integração CRM** | HubSpot, Salesforce, etc. | Alta |
| **API Pública** | Webhooks, API para terceiros | Alta |
| **Multi-número** | Múltiplos números WhatsApp | Alta |
| **IA/GPT Integration** | Sugestões de resposta | Média |

### Detalhamento de Funcionalidades Core

#### 1. Inbox Unificado

```typescript
// Estrutura da Inbox

interface InboxFilters {
  status: 'all' | 'open' | 'pending' | 'resolved' | 'closed';
  assignee: 'all' | 'me' | 'unassigned' | string; // userId
  team: string | null;
  tags: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  search: string;
  sortBy: 'lastMessage' | 'created' | 'waiting';
  sortOrder: 'asc' | 'desc';
}

interface ConversationListItem {
  id: string;
  contact: {
    waId: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    type: MessageType;
    timestamp: Date;
    direction: 'inbound' | 'outbound';
  };
  unreadCount: number;
  status: ConversationStatus;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  waitingTime?: number; // minutos desde última mensagem do cliente
}
```

#### 2. Sistema de Atribuição

```
┌─────────────────────────────────────────────────────────────┐
│                   SISTEMA DE ATRIBUIÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐                                        │
│  │  Nova Mensagem  │                                        │
│  │   (Inbound)     │                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ Já tem Agente?  │───►│ Notificar Agent │                │
│  │      SIM        │    │   Atribuído     │                │
│  └────────┬────────┘    └─────────────────┘                │
│           │ NÃO                                             │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Modo de Atrib.  │                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│     ┌─────┼─────────────────────┐                          │
│     │     │                     │                          │
│     ▼     ▼                     ▼                          │
│  ┌──────┐ ┌──────────┐   ┌───────────┐                     │
│  │Manual│ │Round-Robin│   │Least Busy │                     │
│  │(Pool)│ │(Rotativo) │   │(Menos Ocp)│                     │
│  └──────┘ └──────────┘   └───────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Respostas Rápidas (Quick Replies)

```typescript
interface QuickReply {
  id: string;
  shortcut: string; // /ola, /preco, etc.
  title: string;
  content: string;
  category: string;
  variables: string[]; // {{nome}}, {{produto}}
  mediaUrl?: string;
  mediaType?: 'image' | 'document';
  isGlobal: boolean; // compartilhado ou pessoal
  createdBy: string;
  usageCount: number;
}

// Uso no chat:
// Usuário digita "/" → Autocomplete com respostas
// Usuário digita "/ola" → Insere: "Olá {{nome}}! Como posso ajudar?"
```

#### 4. Dashboard Analytics

```typescript
interface DashboardMetrics {
  // Overview
  totalConversations: number;
  openConversations: number;
  resolvedToday: number;
  avgResponseTime: number; // minutos
  avgResolutionTime: number; // minutos
  
  // Performance
  messagesSent: number;
  messagesReceived: number;
  
  // Agent Metrics
  agentPerformance: AgentMetric[];
  
  // Time-based
  conversationsByHour: { hour: number; count: number }[];
  conversationsByDay: { date: string; count: number }[];
  
  // Satisfaction
  csatScore?: number;
  npsScore?: number;
}

interface AgentMetric {
  agentId: string;
  agentName: string;
  conversationsHandled: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  messagesCount: number;
  satisfaction?: number;
}
```

---

## 🎨 Inspiração de Design - Apps Similares

### 1. Intercom
**Pontos Fortes:**
- Inbox limpa e organizada
- Sidebar com filtros intuitivos
- Preview de conversa na lista
- Sistema de tags coloridas
- Keyboard shortcuts

**Screenshot Reference:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🏠 Inbox    📊 Reports    👥 Contacts    ⚙️ Settings               │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌────────────────────────────────────────────────┐│
│ │ Filtros       │ │ João Silva                         🟢 Online   ││
│ │ ─────────────│ │ ────────────────────────────────────────────────││
│ │ ○ All        │ │                                                 ││
│ │ ● Open (12)  │ │  [Cliente]                                      ││
│ │ ○ Pending    │ │  Olá, preciso de ajuda com meu pedido           ││
│ │ ○ Resolved   │ │                                    14:32        ││
│ │               │ │                                                 ││
│ │ Assignee:    │ │                              [Você]             ││
│ │ [Me ▼]       │ │              Claro! Qual o número do pedido?    ││
│ │               │ │                                    14:33        ││
│ │ Tags:        │ │                                                 ││
│ │ [🏷️ Vendas] │ │  [Cliente]                                      ││
│ │ [🏷️ Suporte]│ │  #12345                                         ││
│ │               │ │                                    14:34        ││
│ ├───────────────┤ │                                                 ││
│ │ Conversas    │ │─────────────────────────────────────────────────││
│ │              │ │ 💬 Digite sua mensagem...          📎 😊 📤    ││
│ │ ● João Silva │ └────────────────────────────────────────────────┘│
│ │   Olá, prec..│ ┌────────────────────────────────────────────────┐│
│ │   14:34 🏷️   │ │ 👤 Perfil do Contato                           ││
│ │              │ │ ─────────────────────────────────────────────── ││
│ │ ○ Maria San..│ │ João Silva                                      ││
│ │   Quando che.│ │ +55 11 99999-9999                              ││
│ │   14:20      │ │                                                 ││
│ │              │ │ 📝 Notas                                        ││
│ │ ○ Pedro Cos..│ │ Cliente VIP, sempre priorizar                   ││
│ │   Obrigado!  │ │                                                 ││
│ │   13:45 ✓    │ │ 🏷️ Tags                                         ││
│ │              │ │ [VIP] [São Paulo] [Premium]                     ││
│ └───────────────┘ └────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Zendesk Chat
**Pontos Fortes:**
- Layout em 3 colunas eficiente
- Status do agente proeminente
- Métricas em tempo real no header
- Histórico de conversa acessível

### 3. Crisp
**Pontos Fortes:**
- Interface moderna e limpa
- Animações suaves
- Dark mode nativo
- Integração com chatbot visual

### 4. Freshdesk
**Pontos Fortes:**
- Gamificação para agentes
- SLA tracking visual
- Workflow automations
- Knowledge base integrado

### 5. Chatwoot (Open Source)
**Pontos Fortes:**
- Código aberto (referência técnica)
- Multi-canal
- Canned responses
- Agent collision detection

### 6. WhatsApp Web (Referência Nativa)
**Pontos Fortes:**
- UX familiar para usuários
- Emojis e stickers nativos
- Voice message recording
- Media preview

---

## 🎯 Design System & UI Components

### Paleta de Cores

```css
:root {
  /* Primary - Brand */
  --primary-50: #E8F5E9;
  --primary-100: #C8E6C9;
  --primary-200: #A5D6A7;
  --primary-300: #81C784;
  --primary-400: #66BB6A;
  --primary-500: #25D366; /* WhatsApp Green */
  --primary-600: #43A047;
  --primary-700: #388E3C;
  --primary-800: #2E7D32;
  --primary-900: #1B5E20;

  /* Neutral */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* Status */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;

  /* Message Bubbles */
  --bubble-outgoing: #DCF8C6;
  --bubble-incoming: #FFFFFF;
  --bubble-outgoing-dark: #005C4B;
  --bubble-incoming-dark: #202C33;

  /* Backgrounds */
  --bg-chat: #E5DDD5;
  --bg-chat-dark: #0B141A;
  --bg-sidebar: #FFFFFF;
  --bg-sidebar-dark: #111B21;
}
```

### Tipografia

```css
:root {
  /* Font Family */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Componentes Principais

#### 1. Conversation List Item

```tsx
// ConversationItem.tsx

interface ConversationItemProps {
  conversation: ConversationListItem;
  isActive: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        isActive && "bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500"
      )}
    >
      {/* Avatar */}
      <Avatar
        src={conversation.contact.avatar}
        name={conversation.contact.name}
        size="md"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900 dark:text-white truncate">
            {conversation.contact.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatTime(conversation.lastMessage.timestamp)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500 truncate">
            {conversation.lastMessage.direction === 'outbound' && (
              <MessageStatus status={conversation.lastMessage.status} />
            )}
            {getMessagePreview(conversation.lastMessage)}
          </p>
          
          {conversation.unreadCount > 0 && (
            <Badge variant="primary" size="sm">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
```

#### 2. Message Bubble

```tsx
// MessageBubble.tsx

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showAvatar = true,
  showTimestamp = true,
}) => {
  const isOutgoing = message.direction === 'outbound';

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        isOutgoing ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {showAvatar && !isOutgoing && (
        <Avatar
          src={message.contact?.avatar}
          name={message.contact?.name}
          size="sm"
        />
      )}

      <div
        className={cn(
          "rounded-2xl px-4 py-2 shadow-sm",
          isOutgoing
            ? "bg-bubble-outgoing dark:bg-bubble-outgoing-dark text-gray-900 dark:text-white rounded-br-md"
            : "bg-white dark:bg-bubble-incoming-dark text-gray-900 dark:text-white rounded-bl-md"
        )}
      >
        {/* Content based on type */}
        <MessageContent message={message} />

        {/* Footer */}
        <div className="flex items-center justify-end gap-1 mt-1">
          {showTimestamp && (
            <span className="text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </span>
          )}
          {isOutgoing && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
};
```

#### 3. Chat Input

```tsx
// ChatInput.tsx

interface ChatInputProps {
  onSend: (message: MessagePayload) => void;
  onTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onTyping,
  disabled,
  placeholder = "Digite uma mensagem...",
}) => {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="border-t bg-white dark:bg-gray-900 p-4">
      {/* Quick Replies Dropdown */}
      {showQuickReplies && (
        <QuickRepliesDropdown
          onSelect={(reply) => {
            setText(reply.content);
            setShowQuickReplies(false);
          }}
        />
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelect={(emoji) => setText((prev) => prev + emoji)}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <IconButton
          icon={<PaperclipIcon />}
          onClick={() => {/* open file picker */}}
          tooltip="Anexar arquivo"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              onTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              if (e.key === "/" && text === "") {
                setShowQuickReplies(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border px-4 py-3",
              "focus:outline-none focus:ring-2 focus:ring-primary-500",
              "dark:bg-gray-800 dark:border-gray-700"
            )}
          />
        </div>

        {/* Emoji Button */}
        <IconButton
          icon={<SmileIcon />}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          tooltip="Emojis"
        />

        {/* Send / Voice Button */}
        {text.trim() ? (
          <IconButton
            icon={<SendIcon />}
            onClick={handleSend}
            variant="primary"
            tooltip="Enviar"
          />
        ) : (
          <IconButton
            icon={isRecording ? <StopIcon /> : <MicIcon />}
            onClick={toggleRecording}
            variant={isRecording ? "danger" : "default"}
            tooltip={isRecording ? "Parar" : "Gravar áudio"}
          />
        )}
      </div>
    </div>
  );
};
```

---

## 📐 Wireframes & Layouts

### Layout Principal (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─────┐  WhatsApp Chat                    🔔 2  👤 João Silva ▼  [🌙]     │
│ │ 🟢 │  Empresa XYZ                                                        │
│ └─────┘                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────┬───────────────────────────────┬────────────────────────┐ │
│ │               │                               │                        │ │
│ │   SIDEBAR     │         CHAT AREA             │    DETAILS PANEL       │ │
│ │   (280px)     │         (flex-1)              │      (320px)           │ │
│ │               │                               │                        │ │
│ │ ┌───────────┐ │ ┌───────────────────────────┐ │ ┌────────────────────┐ │ │
│ │ │ 🔍 Buscar │ │ │ ◀ João Silva      🟢      │ │ │     👤             │ │ │
│ │ └───────────┘ │ │   +55 11 99999-9999       │ │ │   João Silva       │ │ │
│ │               │ ├───────────────────────────┤ │ │   Cliente desde    │ │ │
│ │ Filtros:      │ │                           │ │ │   Jan 2024         │ │ │
│ │ [Todos ▼]     │ │                           │ │ └────────────────────┘ │ │
│ │               │ │   Mensagens do chat       │ │                        │ │
│ │ ─────────────│ │   aparecem aqui           │ │ 📞 +55 11 99999-9999  │ │
│ │               │ │                           │ │ 📧 joao@email.com     │ │
│ │ ● João Silva │ │                           │ │                        │ │
│ │   Olá, pre... │ │                           │ │ ─────────────────────│ │
│ │   14:34  🏷️   │ │                           │ │                        │ │
│ │               │ │                           │ │ 📝 Notas Internas     │ │
│ │ ○ Maria San..│ │                           │ │ ┌────────────────────┐ │ │
│ │   Quando c... │ │                           │ │ │ Cliente VIP        │ │ │
│ │   14:20       │ │                           │ │ │ Sempre priorizar   │ │ │
│ │               │ │                           │ │ └────────────────────┘ │ │
│ │ ○ Pedro Cos..│ │                           │ │ [+ Adicionar nota]    │ │
│ │   Obrigado!  │ │                           │ │                        │ │
│ │   13:45 ✓    │ ├───────────────────────────┤ │ ─────────────────────│ │
│ │               │ │ 💬 Digite uma mensagem... │ │                        │ │
│ │               │ │               📎 😊 [➤]  │ │ 🏷️ Tags               │ │
│ │               │ └───────────────────────────┘ │ [VIP] [SP] [Premium]  │ │
│ │               │                               │ [+ Adicionar]         │ │
│ └───────────────┴───────────────────────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layout Mobile

```
┌─────────────────────────┐     ┌─────────────────────────┐
│ ← Conversas    🔔  ⚙️  │     │ ← João Silva      ⋮    │
├─────────────────────────┤     ├─────────────────────────┤
│                         │     │                         │
│ 🔍 Buscar conversas     │     │ ┌─────────────────────┐ │
│                         │     │ │  Olá, preciso de    │ │
│ ┌─────────────────────┐ │     │ │  ajuda com pedido   │ │
│ │ 👤 João Silva       │ │     │ └─────────────────────┘ │
│ │    Olá, preciso...  │ │     │                   14:32 │
│ │    14:34        🔵 2│ │     │                         │
│ └─────────────────────┘ │     │        ┌──────────────┐ │
│                         │     │        │ Qual número? │ │
│ ┌─────────────────────┐ │     │        └──────────────┘ │
│ │ 👤 Maria Santos     │ │     │                   14:33 │
│ │    Quando chega?    │ │     │                         │
│ │    14:20            │ │     │ ┌─────────────────────┐ │
│ └─────────────────────┘ │     │ │  #12345             │ │
│                         │     │ └─────────────────────┘ │
│ ┌─────────────────────┐ │     │                   14:34 │
│ │ 👤 Pedro Costa      │ │     │                         │
│ │    Obrigado! ✓✓     │ │     │                         │
│ │    13:45            │ │     │                         │
│ └─────────────────────┘ │     │                         │
│                         │     ├─────────────────────────┤
│                         │     │ 💬 Mensagem...  📎 😊 ➤│
│                         │     └─────────────────────────┘
├─────────────────────────┤
│ 💬      📊      👤     │
│ Chat  Dashboard Perfil  │
└─────────────────────────┘
```

### Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                          Hoje ▼   Exportar 📥    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │    124      │ │     42      │ │    2.5min   │ │    15min    │           │
│ │  Conversas  │ │   Abertas   │ │  Tempo Resp │ │ Tempo Resol │           │
│ │   Hoje      │ │   Agora     │ │    Médio    │ │    Médio    │           │
│ │   ↑ 12%     │ │   ↓ 5%      │ │   ↓ 30s     │ │   ↑ 2min    │           │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ 📈 Conversas por Hora          │ │ 🥇 Performance dos Agentes          ││
│ │                                 │ │                                     ││
│ │     ▄                           │ │ Agente         Conv   Tempo   CSAT ││
│ │   ▄ █ ▄                         │ │ ───────────────────────────────────││
│ │  ▄█ █ █▄                        │ │ 👤 João Silva   45    1.2min  4.8  ││
│ │ ▄██ █ ██▄                       │ │ 👤 Maria S.     38    2.1min  4.5  ││
│ │ ███ █ ███                       │ │ 👤 Pedro C.     32    1.8min  4.7  ││
│ │ ───────────                     │ │                                     ││
│ │ 8h  12h  18h                    │ │                                     ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
│                                                                             │
│ ┌─────────────────────────────────┐ ┌─────────────────────────────────────┐│
│ │ 📊 Status das Conversas        │ │ 🏷️ Tags mais usadas                 ││
│ │                                 │ │                                     ││
│ │  ████████████░░░░░  Abertas 60%│ │  Vendas          ███████████  45   ││
│ │  ██████░░░░░░░░░░░  Pending 25%│ │  Suporte         ████████     32   ││
│ │  ████░░░░░░░░░░░░░  Resolved15%│ │  Financeiro      █████        18   ││
│ └─────────────────────────────────┘ └─────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Padrões de UX

### 1. Notificações

```typescript
// Tipos de Notificação

interface NotificationConfig {
  // In-App
  toast: {
    newMessage: boolean;
    conversationAssigned: boolean;
    mentionInNote: boolean;
  };
  
  // Push (Browser/Mobile)
  push: {
    enabled: boolean;
    newMessage: boolean;
    conversationAssigned: boolean;
    afterMinutesInactive: number;
  };
  
  // Sound
  sound: {
    enabled: boolean;
    newMessage: 'ding' | 'pop' | 'chime' | 'none';
    volume: number; // 0-100
  };
  
  // Desktop
  desktop: {
    enabled: boolean;
    showPreview: boolean;
  };
}
```

### 2. Keyboard Shortcuts

| Shortcut | Ação |
|----------|------|
| `Ctrl/Cmd + K` | Busca global |
| `Ctrl/Cmd + /` | Respostas rápidas |
| `Ctrl/Cmd + Enter` | Enviar mensagem |
| `Ctrl/Cmd + N` | Nova conversa |
| `Ctrl/Cmd + E` | Emoji picker |
| `Ctrl/Cmd + U` | Upload arquivo |
| `Ctrl/Cmd + Shift + A` | Atribuir conversa |
| `Esc` | Fechar modais |
| `↑ / ↓` | Navegar conversas |
| `Enter` | Abrir conversa selecionada |

### 3. Estados de Loading

```tsx
// Skeleton Loading para Lista de Conversas
const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
    <div className="w-12 h-12 bg-gray-200 rounded-full" />
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

// Loading State para Mensagens
const MessageLoading = () => (
  <div className="flex items-center gap-2 text-gray-500">
    <Spinner size="sm" />
    <span>Enviando...</span>
  </div>
);
```

### 4. Estados Vazios

```tsx
// Empty State - Sem Conversas
const EmptyInbox = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <InboxIcon className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Nenhuma conversa ainda
    </h3>
    <p className="text-gray-500 mb-4">
      Quando clientes enviarem mensagens, elas aparecerão aqui.
    </p>
  </div>
);

// Empty State - Nenhum Resultado
const NoResults = ({ query }: { query: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <SearchIcon className="w-16 h-16 text-gray-300 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Nenhum resultado para "{query}"
    </h3>
    <p className="text-gray-500">
      Tente buscar por outro termo ou remova os filtros.
    </p>
  </div>
);
```

### 5. Feedback Visual

```tsx
// Message Status Icons
const MessageStatus = ({ status }: { status: MessageStatus }) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="w-4 h-4 text-gray-400" />;
    case 'sent':
      return <CheckIcon className="w-4 h-4 text-gray-400" />;
    case 'delivered':
      return <CheckCheckIcon className="w-4 h-4 text-gray-400" />;
    case 'read':
      return <CheckCheckIcon className="w-4 h-4 text-blue-500" />;
    case 'failed':
      return <XCircleIcon className="w-4 h-4 text-red-500" />;
  }
};

// Online Status Indicator
const OnlineIndicator = ({ status }: { status: OnlineStatus }) => {
  const colors = {
    ONLINE: 'bg-green-500',
    AWAY: 'bg-yellow-500',
    BUSY: 'bg-red-500',
    OFFLINE: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        "w-3 h-3 rounded-full border-2 border-white",
        colors[status]
      )}
    />
  );
};
```

---

## 🚀 Fluxos de Usuário

### Fluxo de Onboarding

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ONBOARDING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Convite                                                     │
│     ↓                                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📧 Email de convite                                      │  │
│  │  "Você foi convidado para a equipe da Empresa XYZ"       │  │
│  │                                                           │  │
│  │  [Aceitar Convite]                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│     ↓                                                           │
│  2. Cadastro                                                    │
│     ↓                                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Criar sua conta                                          │  │
│  │                                                           │  │
│  │  Nome: [__________________]                               │  │
│  │  Senha: [________________]                                │  │
│  │  Confirmar: [____________]                                │  │
│  │                                                           │  │
│  │  [Criar Conta]                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│     ↓                                                           │
│  3. Tour Guiado                                                 │
│     ↓                                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  👋 Bem-vindo ao WhatsApp Chat!                          │  │
│  │                                                           │  │
│  │  Vamos fazer um tour rápido?                              │  │
│  │                                                           │  │
│  │  [Começar Tour]    [Pular]                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│     ↓                                                           │
│  4. Configurações Iniciais                                      │
│     ↓                                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Configure suas notificações                              │  │
│  │                                                           │  │
│  │  ☑ Notificações no navegador                             │  │
│  │  ☑ Sons para novas mensagens                             │  │
│  │  ☑ Notificações por email                                │  │
│  │                                                           │  │
│  │  [Concluir Setup]                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│     ↓                                                           │
│  5. Pronto! 🎉                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Atendimento

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE ATENDIMENTO                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                           │
│  │ Nova Mensagem   │                                           │
│  │ do Cliente      │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ Conversa existe?│───►│ Notificar Agent │                    │
│  │      SIM        │    │   Atribuído     │                    │
│  └────────┬────────┘    └─────────────────┘                    │
│           │ NÃO                                                 │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Criar Nova      │                                           │
│  │ Conversa        │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Adicionar ao    │                                           │
│  │ Pool (Inbox)    │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ Agent Claim     │───►│ Iniciar         │                    │
│  │ (Assumir)       │    │ Atendimento     │                    │
│  └─────────────────┘    └────────┬────────┘                    │
│                                  │                              │
│                                  ▼                              │
│                         ┌─────────────────┐                    │
│                         │ Chat / Troca de │                    │
│                         │    Mensagens    │                    │
│                         └────────┬────────┘                    │
│                                  │                              │
│                    ┌─────────────┼─────────────┐               │
│                    │             │             │               │
│                    ▼             ▼             ▼               │
│           ┌──────────────┐ ┌──────────┐ ┌──────────────┐       │
│           │  Transferir  │ │ Resolver │ │  Adicionar   │       │
│           │  para outro  │ │ Conversa │ │ Tags/Notas   │       │
│           │    Agent     │ │          │ │              │       │
│           └──────────────┘ └────┬─────┘ └──────────────┘       │
│                                 │                              │
│                                 ▼                              │
│                         ┌─────────────────┐                    │
│                         │ Enviar Pesquisa │                    │
│                         │  Satisfação?    │                    │
│                         └────────┬────────┘                    │
│                                  │                              │
│                                  ▼                              │
│                         ┌─────────────────┐                    │
│                         │ Conversa        │                    │
│                         │ Encerrada       │                    │
│                         └─────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Referências de Design

### Sites para Inspiração

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Mobbin** | mobbin.com | Biblioteca de UI patterns |
| **Dribbble** | dribbble.com/tags/chat | Designs de chat |
| **Behance** | behance.net | Projetos completos |
| **Land-book** | land-book.com | Landing pages |
| **Refero** | refero.design | Design system references |

### Apps para Estudar

| App | Pontos de Atenção |
|-----|-------------------|
| **Intercom** | Inbox, filtros, keyboard shortcuts |
| **Zendesk** | Dashboard, métricas, SLA |
| **Crisp** | UI moderna, animações, dark mode |
| **Freshdesk** | Gamificação, workflows |
| **Chatwoot** | Open source, código para referência |
| **WhatsApp Web** | UX nativa, familiaridade |
| **Slack** | Threads, mentions, search |
| **Discord** | Servers, channels, status |

### Bibliotecas de Componentes

| Biblioteca | Stack | URL |
|------------|-------|-----|
| **shadcn/ui** | React/Next | ui.shadcn.com |
| **Radix UI** | React | radix-ui.com |
| **Headless UI** | React | headlessui.com |
| **NativeBase** | React Native | nativebase.io |
| **Tamagui** | React Native | tamagui.dev |

---

## ✅ Checklist de Implementação

### Sistema de Usuários
- [ ] Registro/Login com email/senha
- [ ] Recuperação de senha
- [ ] 2FA (opcional)
- [ ] Gestão de sessões
- [ ] RBAC (roles e permissões)
- [ ] Convite de usuários
- [ ] Perfil do usuário
- [ ] Status online

### Funcionalidades Core
- [ ] Inbox com filtros
- [ ] Chat em tempo real
- [ ] Envio de mídias
- [ ] Status de mensagens
- [ ] Typing indicator
- [ ] Notificações push
- [ ] Respostas rápidas
- [ ] Tags e notas

### UX/UI
- [ ] Design responsivo
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Loading states
- [ ] Empty states
- [ ] Error handling
- [ ] Onboarding flow
- [ ] Acessibilidade (a11y)

---

> **Documento criado em:** Dezembro 2024  
> **Versão:** 1.0

