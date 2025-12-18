#!/bin/bash

# Script para criar o arquivo .env.local

cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:3001
EOF

echo "✅ Arquivo .env.local criado com sucesso!"
echo ""
echo "Variáveis configuradas:"
echo "  NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1"
echo "  NEXT_PUBLIC_WS_URL=http://localhost:3001"
echo ""

