#!/usr/bin/env node

// Script para testar a conexão com o Supabase

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testando conexão com o banco de dados...\n');
    
    // Teste simples de conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Teste de query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada:', result);
    
    console.log('\n🎉 Banco de dados configurado corretamente!');
    console.log('📋 Próximo passo: Execute "npm run prisma:migrate" para criar as tabelas\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error.message);
    console.error('\n💡 Possíveis soluções:');
    console.error('   1. Verifique se a região está correta no .env');
    console.error('   2. Verifique se a senha está correta');
    console.error('   3. Tente usar a connection string direta (porta 5432)');
    console.error('   4. Verifique no Supabase Dashboard > Settings > Database a connection string correta\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

