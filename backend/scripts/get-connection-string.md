# 🔗 Como Obter a Connection String Correta

O MCP do Supabase está funcionando perfeitamente, mas o Prisma precisa da connection string correta no arquivo `.env`.

## 📋 Passos para Obter a Connection String

1. **Acesse o Dashboard do Supabase:**
   - URL: https://supabase.com/dashboard/project/sqyxolugveizbhbxsnou
   - Vá em **Settings** > **Database**

2. **Copie a Connection String:**
   - Procure por **Connection string** ou **Connection pooling**
   - Você verá algo como:
     ```
     postgresql://postgres.sqyxolugveizbhbxsnou:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
     ```

3. **Substitua a senha:**
   - A senha é: `R@padura!14`
   - Na URL, precisa ser codificada: `R%40padura%2114`

4. **Atualize o `.env`:**
   ```env
   DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-[SUA_REGIAO].pooler.supabase.com:5432/postgres"
   ```

## 🔍 Regiões Comuns

- **Brasil:** `sa-east-1` (São Paulo)
- **EUA Leste:** `us-east-1`
- **EUA Oeste:** `us-west-1`
- **Europa:** `eu-west-1` ou `eu-central-1`

## ✅ Teste Após Configurar

```bash
cd backend
node scripts/test-connection.js
```

Se funcionar, você verá:
```
✅ Conexão estabelecida com sucesso!
```

## 🎯 Status Atual

- ✅ **MCP Supabase:** Funcionando perfeitamente
- ✅ **Tabelas:** 16 tabelas criadas com sucesso
- ✅ **Banco:** Pronto para uso
- ⚠️ **Prisma:** Aguardando connection string correta no `.env`

---

**Dica:** Se você souber a região do seu projeto Supabase, posso atualizar o `.env` automaticamente!

