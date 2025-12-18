# 📱 Arquitetura - Aplicação de Chat WhatsApp Business Cloud API

> **Documento de Arquitetura e Requisitos**  
> Versão: 1.0 | Data: Dezembro 2024

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Análise da API do WhatsApp Business (Meta Cloud API)](#análise-da-api-do-whatsapp-business-meta-cloud-api)
3. [Arquitetura da Solução](#arquitetura-da-solução)
4. [Stack Tecnológica](#stack-tecnológica)
5. [Componentes do Sistema](#componentes-do-sistema)
6. [Fluxos de Dados](#fluxos-de-dados)
7. [Tipos de Mensagens Suportadas](#tipos-de-mensagens-suportadas)
8. [Modelo de Dados](#modelo-de-dados)
9. [Segurança](#segurança)
10. [Escalabilidade e Performance](#escalabilidade-e-performance)
11. [Custos e Precificação](#custos-e-precificação)
12. [Limitações e Considerações](#limitações-e-considerações)
13. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🎯 Visão Geral

### Objetivo
Desenvolver uma aplicação multiplataforma (Web + Mobile) que permita:
- ✅ Receber mensagens da API oficial do WhatsApp Business (Cloud API)
- ✅ Visualizar e gerenciar conversas em tempo real
- ✅ Responder com todos os tipos de mídia suportados pela Meta
- ✅ Interface unificada para atendimento ao cliente

### Escopo
| Funcionalidade | Web | Mobile |
|----------------|-----|--------|
| Receber mensagens | ✅ | ✅ |
| Enviar texto | ✅ | ✅ |
| Enviar imagens | ✅ | ✅ |
| Enviar vídeos | ✅ | ✅ |
| Enviar áudios | ✅ | ✅ |
| Enviar documentos | ✅ | ✅ |
| Enviar stickers | ✅ | ✅ |
| Enviar localização | ✅ | ✅ |
| Enviar contatos | ✅ | ✅ |
| Mensagens interativas | ✅ | ✅ |
| Templates | ✅ | ✅ |
| Reações (emojis) | ✅ | ✅ |
| Notificações push | ✅ | ✅ |

---

## 🔍 Análise da API do WhatsApp Business (Meta Cloud API)

### O que é a Cloud API?
A **WhatsApp Business Cloud API** é a solução oficial da Meta que permite empresas integrarem o WhatsApp em suas aplicações. Diferente de soluções não-oficiais, oferece:

- 🔒 **Criptografia de ponta a ponta**
- 📊 **Alta confiabilidade e SLA garantido**
- 🚀 **Escalabilidade nativa**
- ✅ **Compliance com políticas da Meta**

### Endpoints Principais

#### Base URL
```
https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
```

#### Endpoint de Envio de Mensagens
```http
POST /{phone-number-id}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

#### Endpoint de Upload de Mídia
```http
POST /{phone-number-id}/media
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: multipart/form-data
```

#### Endpoint de Download de Mídia
```http
GET /{media-id}
Authorization: Bearer {ACCESS_TOKEN}
```

### Tipos de Mensagens Suportados pela API

| Tipo | Descrição | Payload Type |
|------|-----------|--------------|
| `text` | Mensagens de texto simples | `text` |
| `image` | Imagens (JPEG, PNG) | `image` |
| `video` | Vídeos (MP4, 3GPP) | `video` |
| `audio` | Áudios (AAC, MP3, OGG, AMR) | `audio` |
| `document` | Documentos (PDF, DOC, etc.) | `document` |
| `sticker` | Figurinhas (WebP) | `sticker` |
| `location` | Localização geográfica | `location` |
| `contacts` | Compartilhamento de contatos | `contacts` |
| `interactive` | Botões e listas | `interactive` |
| `template` | Mensagens pré-aprovadas | `template` |
| `reaction` | Reações com emojis | `reaction` |

### Estrutura de Payload - Exemplos

#### Mensagem de Texto
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Olá! Como posso ajudá-lo?"
  }
}
```

#### Mensagem com Imagem
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "image",
  "image": {
    "id": "MEDIA_ID",
    "caption": "Descrição da imagem"
  }
}
```

#### Mensagem com Vídeo
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "video",
  "video": {
    "id": "MEDIA_ID",
    "caption": "Descrição do vídeo"
  }
}
```

#### Mensagem com Áudio
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "audio",
  "audio": {
    "id": "MEDIA_ID"
  }
}
```

#### Mensagem com Documento
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "document",
  "document": {
    "id": "MEDIA_ID",
    "caption": "Documento importante",
    "filename": "relatorio.pdf"
  }
}
```

#### Mensagem com Localização
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "location",
  "location": {
    "longitude": -46.6333,
    "latitude": -23.5505,
    "name": "Escritório Central",
    "address": "Av. Paulista, 1000, São Paulo"
  }
}
```

#### Mensagem com Botões (Interactive)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "Escolha uma opção"
    },
    "body": {
      "text": "Como podemos ajudá-lo hoje?"
    },
    "footer": {
      "text": "Atendimento 24h"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_suporte",
            "title": "Suporte"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_vendas",
            "title": "Vendas"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_financeiro",
            "title": "Financeiro"
          }
        }
      ]
    }
  }
}
```

#### Mensagem com Lista (Interactive)
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Menu de Serviços"
    },
    "body": {
      "text": "Selecione o serviço desejado:"
    },
    "footer": {
      "text": "Powered by Nossa Empresa"
    },
    "action": {
      "button": "Ver opções",
      "sections": [
        {
          "title": "Atendimento",
          "rows": [
            {
              "id": "suporte_tecnico",
              "title": "Suporte Técnico",
              "description": "Problemas técnicos"
            },
            {
              "id": "suporte_comercial",
              "title": "Suporte Comercial",
              "description": "Dúvidas sobre produtos"
            }
          ]
        }
      ]
    }
  }
}
```

#### Reação com Emoji
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "reaction",
  "reaction": {
    "message_id": "wamid.XXX",
    "emoji": "👍"
  }
}
```

#### Template de Mensagem
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "5511999999999",
  "type": "template",
  "template": {
    "name": "hello_world",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "João"
          }
        ]
      }
    ]
  }
}
```

### Webhook - Estrutura de Recebimento

#### Payload de Mensagem Recebida
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Nome do Contato"
                },
                "wa_id": "5511888888888"
              }
            ],
            "messages": [
              {
                "from": "5511888888888",
                "id": "wamid.XXX",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Olá, preciso de ajuda!"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

#### Status de Entrega
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "statuses": [
              {
                "id": "wamid.XXX",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "5511888888888"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

---

## 🏗 Arquitetura da Solução

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APLICAÇÃO DE CHAT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   Aplicação Web  │    │  Aplicação Mobile │    │   Admin Panel    │       │
│  │    (React/Next)  │    │  (React Native)   │    │    (React)       │       │
│  └────────┬─────────┘    └────────┬──────────┘    └────────┬─────────┘       │
│           │                       │                        │                 │
│           └───────────────────────┼────────────────────────┘                 │
│                                   │                                          │
│                          ┌────────▼────────┐                                 │
│                          │  API Gateway /   │                                │
│                          │  Load Balancer   │                                │
│                          └────────┬─────────┘                                │
│                                   │                                          │
├───────────────────────────────────┼──────────────────────────────────────────┤
│                                   │                                          │
│  ┌────────────────────────────────┼────────────────────────────────────────┐ │
│  │                         BACKEND SERVICES                                │ │
│  │                                │                                        │ │
│  │  ┌─────────────┐  ┌───────────▼───────────┐  ┌─────────────────┐       │ │
│  │  │   Auth      │  │    API REST /         │  │   Webhook       │       │ │
│  │  │   Service   │  │    GraphQL Server     │  │   Handler       │       │ │
│  │  └─────────────┘  └───────────┬───────────┘  └────────┬────────┘       │ │
│  │                               │                       │                │ │
│  │  ┌─────────────┐  ┌───────────▼───────────┐  ┌────────▼────────┐       │ │
│  │  │   Message   │  │    WebSocket Server   │  │   Media         │       │ │
│  │  │   Queue     │  │    (Real-time)        │  │   Processor     │       │ │
│  │  │  (Redis/RMQ)│  └───────────────────────┘  └─────────────────┘       │ │
│  │  └─────────────┘                                                       │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                          │
├───────────────────────────────────┼──────────────────────────────────────────┤
│                                   │                                          │
│  ┌────────────────────────────────┼────────────────────────────────────────┐ │
│  │                         DATA LAYER                                      │ │
│  │                                │                                        │ │
│  │  ┌─────────────┐  ┌───────────▼───────────┐  ┌─────────────────┐       │ │
│  │  │  PostgreSQL │  │       Redis           │  │   S3 / MinIO    │       │ │
│  │  │  (Dados)    │  │  (Cache/Sessions)     │  │   (Mídia)       │       │ │
│  │  └─────────────┘  └───────────────────────┘  └─────────────────┘       │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        META / WHATSAPP CLOUD API                            │
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │   Messages API   │    │    Media API     │    │   Webhooks       │       │
│  │   (Envio)        │    │   (Upload/DL)    │    │   (Recebimento)  │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Arquitetura de Comunicação Real-time

```
┌─────────────┐     WebSocket      ┌─────────────┐
│   Cliente   │◄──────────────────►│   Backend   │
│  (Web/App)  │                    │   Server    │
└─────────────┘                    └──────┬──────┘
                                          │
                                          │ Pub/Sub
                                          ▼
                                   ┌──────────────┐
                                   │    Redis     │
                                   │   Pub/Sub    │
                                   └──────┬───────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
              ┌─────▼─────┐         ┌─────▼─────┐         ┌─────▼─────┐
              │ Instance 1│         │ Instance 2│         │ Instance N│
              └───────────┘         └───────────┘         └───────────┘
```

---

## 💻 Stack Tecnológica

### Frontend Web
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 14.x | Framework React com SSR |
| **React** | 18.x | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática |
| **TailwindCSS** | 3.x | Estilização |
| **Socket.io Client** | 4.x | WebSocket |
| **Zustand** | 4.x | State Management |
| **React Query** | 5.x | Data Fetching |
| **Framer Motion** | 10.x | Animações |

### Frontend Mobile
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React Native** | 0.73.x | Framework Mobile |
| **Expo** | 50.x | Build e Deploy |
| **TypeScript** | 5.x | Tipagem estática |
| **NativeWind** | 4.x | TailwindCSS para RN |
| **Socket.io Client** | 4.x | WebSocket |
| **Zustand** | 4.x | State Management |
| **React Query** | 5.x | Data Fetching |

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20.x LTS | Runtime |
| **NestJS** | 10.x | Framework Backend |
| **TypeScript** | 5.x | Tipagem estática |
| **Prisma** | 5.x | ORM |
| **Socket.io** | 4.x | WebSocket Server |
| **Bull** | 4.x | Job Queue |
| **Passport.js** | 0.7.x | Autenticação |
| **Joi/Zod** | - | Validação |

### Banco de Dados & Cache
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **PostgreSQL** | 16.x | Banco principal |
| **Redis** | 7.x | Cache e Pub/Sub |
| **MinIO/S3** | - | Storage de mídia |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| **Docker** | Containerização |
| **Kubernetes** | Orquestração |
| **Nginx** | Reverse Proxy |
| **GitHub Actions** | CI/CD |
| **Prometheus** | Monitoramento |
| **Grafana** | Dashboards |
| **Sentry** | Error Tracking |

---

## 🧩 Componentes do Sistema

### 1. API Gateway / Load Balancer

**Responsabilidades:**
- Roteamento de requisições
- Rate limiting
- SSL termination
- Load balancing entre instâncias

**Configuração Nginx:**
```nginx
upstream backend {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}

server {
    listen 443 ssl http2;
    server_name api.seudominio.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /webhook {
        proxy_pass http://backend;
        proxy_read_timeout 60s;
    }
}
```

### 2. Webhook Handler

**Responsabilidades:**
- Receber notificações da Meta
- Validar assinatura (X-Hub-Signature-256)
- Processar mensagens recebidas
- Atualizar status de entrega

**Fluxo:**
```
Meta Webhook → Validação → Parse → Queue → Processamento → DB → WebSocket → Cliente
```

### 3. Message Service

**Responsabilidades:**
- Gerenciar envio de mensagens
- Processar diferentes tipos de mídia
- Gerenciar templates
- Controlar janela de 24h

### 4. Media Service

**Responsabilidades:**
- Upload de mídia para Meta
- Download de mídia recebida
- Conversão de formatos
- Compressão de arquivos
- Storage em S3/MinIO

### 5. WebSocket Server

**Responsabilidades:**
- Conexões real-time com clientes
- Broadcast de mensagens
- Notificações de status
- Typing indicators

### 6. Queue System

**Responsabilidades:**
- Processamento assíncrono
- Retry de mensagens falhas
- Rate limiting para API Meta
- Jobs agendados

---

## 🔄 Fluxos de Dados

### Fluxo de Recebimento de Mensagem

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│  │ WhatsApp│───►│   Meta    │───►│  Webhook  │───►│   Queue   │         │
│  │  User   │    │  Servers  │    │  Handler  │    │  (Bull)   │         │
│  └─────────┘    └───────────┘    └───────────┘    └─────┬─────┘         │
│                                                         │               │
│                                                         ▼               │
│  ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│  │ Frontend│◄───│ WebSocket │◄───│   Redis   │◄───│  Message  │         │
│  │  Client │    │  Server   │    │  Pub/Sub  │    │  Service  │         │
│  └─────────┘    └───────────┘    └───────────┘    └─────┬─────┘         │
│                                                         │               │
│                                                         ▼               │
│                                                    ┌───────────┐         │
│                                                    │ PostgreSQL│         │
│                                                    └───────────┘         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Envio de Mensagem

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│  │ Frontend│───►│   API     │───►│  Message  │───►│   Queue   │         │
│  │  Client │    │  Server   │    │  Service  │    │  (Bull)   │         │
│  └─────────┘    └───────────┘    └───────────┘    └─────┬─────┘         │
│                                                         │               │
│                                                         ▼               │
│  ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│  │ WhatsApp│◄───│   Meta    │◄───│  WhatsApp │◄───│  Worker   │         │
│  │  User   │    │  Servers  │    │  API Call │    │  Process  │         │
│  └─────────┘    └───────────┘    └───────────┘    └─────┬─────┘         │
│                                                         │               │
│                                                         ▼               │
│                                                    ┌───────────┐         │
│                                                    │ PostgreSQL│         │
│                                                    │  (Update) │         │
│                                                    └───────────┘         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Upload de Mídia

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐         │
│  │ Frontend│───►│   API     │───►│   Media   │───►│  S3/MinIO │         │
│  │  Client │    │  Server   │    │  Service  │    │  (Backup) │         │
│  └─────────┘    └───────────┘    └─────┬─────┘    └───────────┘         │
│                                        │                                 │
│                                        ▼                                 │
│                                  ┌───────────┐                           │
│                                  │   Meta    │                           │
│                                  │ Media API │                           │
│                                  └─────┬─────┘                           │
│                                        │                                 │
│                                        ▼                                 │
│                                  ┌───────────┐                           │
│                                  │ Media ID  │──► Usar no envio          │
│                                  └───────────┘                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📨 Tipos de Mensagens Suportadas

### Tabela de Suporte

| Tipo | Enviar | Receber | Formatos Suportados | Tamanho Máx |
|------|--------|---------|---------------------|-------------|
| **Texto** | ✅ | ✅ | UTF-8, emojis, links | 4096 chars |
| **Imagem** | ✅ | ✅ | JPEG, PNG | 5 MB |
| **Vídeo** | ✅ | ✅ | MP4, 3GPP | 16 MB |
| **Áudio** | ✅ | ✅ | AAC, MP3, OGG, AMR, OPUS | 16 MB |
| **Documento** | ✅ | ✅ | PDF, DOC, XLS, PPT, etc. | 100 MB |
| **Sticker** | ✅ | ✅ | WebP (estático/animado) | 500 KB |
| **Localização** | ✅ | ✅ | Lat/Long | - |
| **Contatos** | ✅ | ✅ | vCard | - |
| **Botões** | ✅ | ✅ | Até 3 botões | - |
| **Listas** | ✅ | ✅ | Até 10 itens | - |
| **Reações** | ✅ | ✅ | Qualquer emoji | - |
| **Templates** | ✅ | ❌ | Pré-aprovados | - |

### Limitações de Mensagens Interativas

| Componente | Limite |
|------------|--------|
| Botões por mensagem | 3 |
| Caracteres por botão | 20 |
| Seções por lista | 10 |
| Itens por seção | 10 |
| Caracteres título item | 24 |
| Caracteres descrição item | 72 |

---

## 🗄 Modelo de Dados

### Diagrama ER

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Users       │     │   Conversations │     │    Messages     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ email           │     │ wa_id           │     │ conversation_id │
│ password_hash   │     │ phone_number    │     │ wamid           │
│ name            │     │ profile_name    │     │ type            │
│ role            │     │ last_message_at │     │ content         │
│ created_at      │     │ status          │     │ media_id        │
│ updated_at      │     │ assigned_to     │◄────│ direction       │
└────────┬────────┘     │ created_at      │     │ status          │
         │              │ updated_at      │     │ timestamp       │
         │              └────────┬────────┘     │ created_at      │
         │                       │              └─────────────────┘
         │                       │
         │              ┌────────▼────────┐     ┌─────────────────┐
         │              │ ConversationUser│     │     Media       │
         │              ├─────────────────┤     ├─────────────────┤
         └──────────────│ conversation_id │     │ id (PK)         │
                        │ user_id         │     │ message_id      │
                        │ role            │     │ media_id        │
                        │ last_read_at    │     │ type            │
                        └─────────────────┘     │ mime_type       │
                                                │ url             │
                                                │ size            │
┌─────────────────┐     ┌─────────────────┐     │ created_at      │
│    Templates    │     │    Webhooks     │     └─────────────────┘
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ name            │     │ entry_id        │
│ language        │     │ wa_id           │
│ category        │     │ payload         │
│ status          │     │ processed       │
│ components      │     │ created_at      │
│ created_at      │     └─────────────────┘
└─────────────────┘
```

### Schema Prisma

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  AGENT
  SUPERVISOR
}

enum ConversationStatus {
  OPEN
  PENDING
  RESOLVED
  CLOSED
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  STICKER
  LOCATION
  CONTACTS
  INTERACTIVE
  TEMPLATE
  REACTION
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  role          UserRole @default(AGENT)
  avatar        String?
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  conversations ConversationUser[]
  assignedConversations Conversation[] @relation("AssignedAgent")

  @@map("users")
}

model Conversation {
  id              String             @id @default(uuid())
  waId            String             @unique @map("wa_id")
  phoneNumber     String             @map("phone_number")
  profileName     String?            @map("profile_name")
  profilePicture  String?            @map("profile_picture")
  status          ConversationStatus @default(OPEN)
  lastMessageAt   DateTime?          @map("last_message_at")
  lastMessagePreview String?         @map("last_message_preview")
  unreadCount     Int                @default(0) @map("unread_count")
  assignedToId    String?            @map("assigned_to_id")
  assignedTo      User?              @relation("AssignedAgent", fields: [assignedToId], references: [id])
  tags            String[]
  metadata        Json?
  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")

  messages        Message[]
  users           ConversationUser[]

  @@index([waId])
  @@index([status])
  @@index([lastMessageAt])
  @@map("conversations")
}

model ConversationUser {
  id              String       @id @default(uuid())
  conversationId  String       @map("conversation_id")
  userId          String       @map("user_id")
  lastReadAt      DateTime?    @map("last_read_at")
  conversation    Conversation @relation(fields: [conversationId], references: [id])
  user            User         @relation(fields: [userId], references: [id])

  @@unique([conversationId, userId])
  @@map("conversation_users")
}

model Message {
  id              String           @id @default(uuid())
  conversationId  String           @map("conversation_id")
  wamid           String?          @unique
  type            MessageType
  direction       MessageDirection
  status          MessageStatus    @default(PENDING)
  content         Json
  timestamp       DateTime
  contextMessageId String?         @map("context_message_id")
  reactions       Json?
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  conversation    Conversation     @relation(fields: [conversationId], references: [id])
  media           Media[]

  @@index([conversationId])
  @@index([wamid])
  @@index([timestamp])
  @@map("messages")
}

model Media {
  id          String   @id @default(uuid())
  messageId   String   @map("message_id")
  mediaId     String?  @map("media_id") // ID da Meta
  type        String
  mimeType    String   @map("mime_type")
  url         String?
  localPath   String?  @map("local_path")
  size        Int?
  sha256      String?
  createdAt   DateTime @default(now()) @map("created_at")

  message     Message  @relation(fields: [messageId], references: [id])

  @@map("media")
}

model Template {
  id          String   @id @default(uuid())
  templateId  String   @unique @map("template_id") // ID da Meta
  name        String
  language    String
  category    String
  status      String
  components  Json
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("templates")
}

model WebhookLog {
  id          String   @id @default(uuid())
  entryId     String   @map("entry_id")
  waId        String   @map("wa_id")
  payload     Json
  processed   Boolean  @default(false)
  error       String?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([entryId])
  @@index([processed])
  @@map("webhook_logs")
}

model Settings {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("settings")
}
```

---

## 🔐 Segurança

### 1. Autenticação e Autorização

#### JWT + Refresh Token
```typescript
// Token de acesso (curta duração)
{
  "sub": "user-uuid",
  "email": "user@email.com",
  "role": "AGENT",
  "iat": 1234567890,
  "exp": 1234571490 // 1 hora
}

// Refresh token (longa duração)
{
  "sub": "user-uuid",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1235172690 // 7 dias
}
```

#### RBAC (Role-Based Access Control)
| Role | Permissões |
|------|------------|
| **ADMIN** | Todas as operações |
| **SUPERVISOR** | Ver todas conversas, atribuir agentes, relatórios |
| **AGENT** | Gerenciar conversas atribuídas |

### 2. Validação de Webhook Meta

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

### 3. Proteção de Dados

- **Criptografia em trânsito**: TLS 1.3
- **Criptografia em repouso**: AES-256 para dados sensíveis
- **Sanitização**: Validação de todos os inputs
- **Rate Limiting**: Proteção contra abuse

### 4. Variáveis de Ambiente

```env
# .env.example

# App
NODE_ENV=production
PORT=3000
API_URL=https://api.seudominio.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/whatsapp_chat

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Meta/WhatsApp
META_APP_ID=seu-app-id
META_APP_SECRET=seu-app-secret
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=seu-waba-id
WHATSAPP_ACCESS_TOKEN=seu-access-token
WEBHOOK_VERIFY_TOKEN=seu-verify-token

# Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=whatsapp-media
S3_ACCESS_KEY=sua-access-key
S3_SECRET_KEY=sua-secret-key

# Sentry (Error Tracking)
SENTRY_DSN=sua-sentry-dsn
```

---

## 📈 Escalabilidade e Performance

### 1. Estratégias de Cache

```typescript
// Cache de conversas recentes
const CACHE_TTL = 300; // 5 minutos

// Redis keys pattern
const keys = {
  conversation: (id: string) => `conv:${id}`,
  userConversations: (userId: string) => `user:${userId}:convs`,
  unreadCount: (convId: string) => `conv:${convId}:unread`,
  mediaUrl: (mediaId: string) => `media:${mediaId}:url`,
};
```

### 2. Índices de Banco de Dados

```sql
-- Índices otimizados para queries frequentes
CREATE INDEX idx_messages_conversation_timestamp 
ON messages(conversation_id, timestamp DESC);

CREATE INDEX idx_conversations_status_last_message 
ON conversations(status, last_message_at DESC);

CREATE INDEX idx_conversations_assigned_status 
ON conversations(assigned_to_id, status);
```

### 3. Rate Limiting

| Endpoint | Limite |
|----------|--------|
| POST /messages | 100/min por usuário |
| POST /media | 50/min por usuário |
| GET /conversations | 200/min por usuário |
| Webhook (Meta) | Ilimitado |

### 4. Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  api:
    image: whatsapp-chat-api
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
```

### 5. Métricas e Monitoramento

| Métrica | Alerta |
|---------|--------|
| Response Time P95 | > 500ms |
| Error Rate | > 1% |
| CPU Usage | > 80% |
| Memory Usage | > 85% |
| Queue Size | > 1000 |
| WebSocket Connections | > 10000 |

---

## 💰 Custos e Precificação

### Modelo de Preços da Meta (Por Conversa)

A Meta cobra por **conversa** (janela de 24 horas), não por mensagem.

| Categoria | Brasil (USD) | Descrição |
|-----------|--------------|-----------|
| **Marketing** | ~$0.0625 | Promoções, ofertas |
| **Utility** | ~$0.0350 | Confirmações, atualizações |
| **Authentication** | ~$0.0315 | OTPs, verificação |
| **Service** | ~$0.0300 | Respostas dentro de 24h |

### Conversas Gratuitas
- **1.000 conversas de serviço/mês** são gratuitas
- Conversas iniciadas pelo usuário (dentro de 24h) não têm custo adicional após resposta

### Estimativa de Custos Mensais

| Volume | Custo Estimado |
|--------|----------------|
| 1.000 conversas | $30-60 |
| 10.000 conversas | $300-600 |
| 100.000 conversas | $3.000-6.000 |

### Custos de Infraestrutura (Estimativa)

| Serviço | Custo Mensal |
|---------|--------------|
| Servidor (3x t3.medium) | ~$100 |
| PostgreSQL (db.t3.medium) | ~$50 |
| Redis (cache.t3.micro) | ~$15 |
| S3 (100GB) | ~$5 |
| Load Balancer | ~$20 |
| **Total** | **~$190/mês** |

---

## ⚠️ Limitações e Considerações

### Limitações da API Oficial

| Limitação | Detalhes |
|-----------|----------|
| **Sem suporte a grupos** | API Business não gerencia grupos |
| **Janela de 24 horas** | Após 24h sem interação, só templates |
| **Templates precisam aprovação** | 24-48h para aprovação |
| **Sem foto do contato** | API não retorna foto de perfil |
| **Rate limits** | Varia conforme tier da conta |
| **Número dedicado** | Não pode usar WhatsApp pessoal |

### Tiers de Throughput

| Tier | Mensagens/segundo | Requisito |
|------|-------------------|-----------|
| Standard | 80 | Padrão |
| High | 1000 | Aprovação Meta |

### Janela de Atendimento (24h)

```
┌─────────────────────────────────────────────────────────────────┐
│                    JANELA DE 24 HORAS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cliente envia mensagem                                         │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                                                       │      │
│  │   JANELA ABERTA - 24 HORAS                           │      │
│  │   • Pode enviar qualquer tipo de mensagem            │      │
│  │   • Sem custo adicional (conversa de serviço)        │      │
│  │                                                       │      │
│  └──────────────────────────────────────────────────────┘      │
│         │                                                       │
│         ▼ (após 24h sem interação)                             │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                                                       │      │
│  │   JANELA FECHADA                                      │      │
│  │   • Apenas mensagens TEMPLATE permitidas              │      │
│  │   • Custo por conversa (marketing/utility)            │      │
│  │                                                       │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Boas Práticas

1. **Responda rápido**: Mantenha a janela de 24h aberta
2. **Use templates com sabedoria**: Pré-aprove templates essenciais
3. **Armazene mídia localmente**: URLs da Meta expiram em 30 dias
4. **Implemente retry**: API pode ter instabilidades
5. **Monitore webhooks**: Garanta processamento de todas notificações

---

## 🗓 Roadmap de Implementação

### Fase 1 - MVP (4-6 semanas)

| Semana | Entregáveis |
|--------|-------------|
| 1-2 | Setup projeto, banco de dados, autenticação |
| 3-4 | Webhook handler, envio/recebimento texto |
| 5-6 | Interface web básica, WebSocket |

**Funcionalidades MVP:**
- ✅ Receber mensagens de texto
- ✅ Enviar mensagens de texto
- ✅ Interface web responsiva
- ✅ Autenticação básica
- ✅ Lista de conversas

### Fase 2 - Core Features (4-6 semanas)

| Semana | Entregáveis |
|--------|-------------|
| 7-8 | Suporte a mídia (imagens, áudios, vídeos) |
| 9-10 | App mobile (React Native) |
| 11-12 | Templates, mensagens interativas |

**Funcionalidades:**
- ✅ Envio/recebimento de mídias
- ✅ App mobile iOS/Android
- ✅ Templates de mensagem
- ✅ Botões e listas interativas
- ✅ Reações com emoji

### Fase 3 - Advanced Features (4-6 semanas)

| Semana | Entregáveis |
|--------|-------------|
| 13-14 | Atribuição de conversas, múltiplos atendentes |
| 15-16 | Dashboard, relatórios, métricas |
| 17-18 | Notificações push, melhorias UX |

**Funcionalidades:**
- ✅ Sistema de atribuição
- ✅ Dashboard analítico
- ✅ Relatórios exportáveis
- ✅ Notificações push
- ✅ Tags e filtros

### Fase 4 - Enterprise (Ongoing)

- 🔄 Chatbots e automações
- 🔄 Integração CRM
- 🔄 API pública
- 🔄 Multi-tenant
- 🔄 Auditoria e compliance

---

## 📚 Referências

### Documentação Oficial
- [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- [Cloud API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Message Types](https://developers.facebook.com/docs/whatsapp/cloud-api/messages)
- [Pricing](https://developers.facebook.com/docs/whatsapp/pricing)

### Ferramentas Úteis
- [Meta Business Suite](https://business.facebook.com/)
- [WhatsApp Manager](https://business.facebook.com/wa/manage/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

## 📝 Checklist de Setup na Meta

- [ ] Criar conta no Meta for Developers
- [ ] Criar App do tipo Business
- [ ] Adicionar produto WhatsApp Business
- [ ] Verificar empresa no Business Manager
- [ ] Adicionar número de telefone
- [ ] Gerar token de acesso permanente
- [ ] Configurar webhook URL
- [ ] Assinar eventos de mensagens
- [ ] Criar templates de mensagem
- [ ] Testar envio/recebimento

---

> **Documento criado em:** Dezembro 2024  
> **Autor:** Arquitetura de Sistemas  
> **Versão:** 1.0


