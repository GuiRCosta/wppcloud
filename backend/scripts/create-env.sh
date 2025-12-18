#!/bin/bash

# Script para criar o arquivo .env com as configurações do Supabase

cat > .env << 'EOF'
# ============================================
# APP CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# ============================================
# DATABASE - SUPABASE
# ============================================
# Connection String com Pooler (Recomendado para produção)
# Senha codificada: R@padura!14 -> R%40padura%2114
DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Se a região for diferente, descomente e ajuste:
# DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Connection String Direta (Para migrations - use esta se a pooler não funcionar)
# DATABASE_URL="postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# ============================================
# REDIS
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=whatsapp-chat-super-secret-jwt-key-change-in-production-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=whatsapp-chat-super-secret-refresh-key-change-in-production-2024
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# WHATSAPP CLOUD API (META)
# ============================================
META_API_VERSION=v18.0
META_API_URL=https://graph.facebook.com

# Your WhatsApp Business Account ID
WHATSAPP_BUSINESS_ACCOUNT_ID=your-waba-id

# Your Phone Number ID (from Meta Business)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Permanent Access Token (from Meta Business)
WHATSAPP_ACCESS_TOKEN=your-access-token

# Webhook Verify Token (you create this)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=whatsapp-webhook-verify-token-2024

# App Secret (for signature validation)
META_APP_SECRET=your-app-secret

# ============================================
# CORS
# ============================================
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# ============================================
# RATE LIMITING
# ============================================
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# ============================================
# FILE UPLOAD
# ============================================
MAX_FILE_SIZE=16777216
UPLOAD_DEST=./uploads

# ============================================
# FRONTEND URL (for emails, redirects)
# ============================================
FRONTEND_URL=http://localhost:3000

# ============================================
# SUPABASE (opcional - para futuras integrações)
# ============================================
SUPABASE_URL=https://sqyxolugveizbhbxsnou.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxeXhvbHVndmVpemJoYnhzbm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODgxMDAsImV4cCI6MjA4MTQ2NDEwMH0.a-DSSE8Yp2Iv_6krS2w3p8k4DuetuKS8jEU7iCJbnHM
EOF

echo "✅ Arquivo .env criado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. cd backend"
echo "   2. npm install"
echo "   3. npm run prisma:generate"
echo "   4. npm run prisma:migrate"
echo "   5. npm run start:dev"
echo ""

