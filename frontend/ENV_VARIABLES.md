# Variáveis de Ambiente

Configure estas variáveis no painel da Vercel (Settings > Environment Variables):

## Variáveis Obrigatórias

### `NEXT_PUBLIC_API_URL`
URL completa da API backend (incluindo `/api/v1`)

**Exemplo:**
```
https://seu-backend.railway.app/api/v1
```

### `NEXT_PUBLIC_SOCKET_URL`
URL do backend para WebSocket (sem `/api/v1`)

**Exemplo:**
```
https://seu-backend.railway.app
```

## Exemplo de Configuração na Vercel

1. Acesse: Settings > Environment Variables
2. Adicione:
   - `NEXT_PUBLIC_API_URL` = `https://seu-backend.railway.app/api/v1`
   - `NEXT_PUBLIC_SOCKET_URL` = `https://seu-backend.railway.app`
3. Faça redeploy após adicionar as variáveis

## Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

