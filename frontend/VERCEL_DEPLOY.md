# Deploy na Vercel

## Configuração Inicial

1. **Conectar Repositório:**
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique em "Add New Project"
   - Conecte o repositório `GuiRCosta/wppcloud`

2. **Configurações do Projeto:**
   - **Framework Preset:** Next.js (detectado automaticamente)
   - **Root Directory:** `frontend` ⚠️ **IMPORTANTE**
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)
   - **Install Command:** `npm install` (padrão)

3. **Variáveis de Ambiente:**
   Configure as seguintes variáveis no painel da Vercel (Settings > Environment Variables):

   ```
   NEXT_PUBLIC_API_URL=https://seu-backend.railway.app/api/v1
   NEXT_PUBLIC_SOCKET_URL=https://seu-backend.railway.app
   ```

   ⚠️ **Substitua `seu-backend.railway.app` pela URL real do seu backend**

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Acesse a URL fornecida pela Vercel

## Troubleshooting

### Erro 404
- Verifique se o **Root Directory** está configurado como `frontend`
- Verifique se o build foi concluído com sucesso
- Verifique os logs de build na Vercel

### Erro de API
- Verifique se as variáveis de ambiente estão configuradas
- Verifique se o backend está rodando e acessível
- Verifique CORS no backend

### Build Falha
- Verifique os logs de build
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se não há erros de TypeScript

