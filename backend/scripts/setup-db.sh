#!/bin/bash

# Script para configurar o banco de dados Supabase
# Uso: ./scripts/setup-db.sh

echo "🚀 Configurando banco de dados Supabase..."
echo ""

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Copiando env.example para .env..."
    cp env.example .env
    echo "✅ Arquivo .env criado. Configure a DATABASE_URL antes de continuar."
    exit 1
fi

# Verificar se DATABASE_URL está configurada
if grep -q "\[YOUR_DB_PASSWORD\]" .env; then
    echo "⚠️  ATENÇÃO: Você precisa configurar a senha do banco no arquivo .env"
    echo ""
    echo "📋 Passos:"
    echo "1. Acesse: https://supabase.com/dashboard"
    echo "2. Vá em Settings > Database"
    echo "3. Copie a Database Password"
    echo "4. Substitua [YOUR_DB_PASSWORD] no arquivo .env"
    echo ""
    read -p "Pressione Enter após configurar a senha..."
fi

echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔧 Gerando Prisma Client..."
npm run prisma:generate

echo ""
echo "🗄️  Executando migrations..."
npm run prisma:migrate

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "🧪 Para testar a conexão:"
echo "   npm run prisma:studio"
echo ""

