#!/bin/bash

# Script para atualizar a região na connection string

echo "🔧 Atualizar região da connection string do Supabase"
echo ""
read -p "Digite a região do seu Supabase (ex: sa-east-1, us-east-1): " REGION

if [ -z "$REGION" ]; then
    echo "❌ Região não informada!"
    exit 1
fi

# Backup do .env atual
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Backup criado: .env.backup"
fi

# Atualizar DATABASE_URL para migrations (porta 5432)
sed -i '' "s|@aws-0-[^.]*\.pooler\.supabase\.com:5432|@aws-0-${REGION}.pooler.supabase.com:5432|g" .env
sed -i '' "s|@aws-0-[^.]*\.pooler\.supabase\.com:6543|@aws-0-${REGION}.pooler.supabase.com:6543|g" .env

echo ""
echo "✅ Connection string atualizada para região: ${REGION}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Teste a conexão: node scripts/test-connection.js"
echo "   2. Se funcionar, execute: npm run prisma:migrate"
echo ""

