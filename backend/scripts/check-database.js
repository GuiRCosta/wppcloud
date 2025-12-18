#!/usr/bin/env node

// Script para verificar informações do banco de dados

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando informações do banco de dados...\n');
    
    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados!\n');
    
    // Verificar nome do banco atual
    const dbNameResult = await prisma.$queryRaw`SELECT current_database() as database_name`;
    console.log('📊 Nome do banco de dados:', dbNameResult[0].database_name);
    
    // Verificar schema atual
    const schemaResult = await prisma.$queryRaw`SELECT current_schema() as schema_name`;
    console.log('📋 Schema atual:', schemaResult[0].schema_name);
    
    // Listar todas as tabelas existentes
    const tablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n📑 Tabelas existentes no banco:');
    if (tablesResult.length === 0) {
      console.log('   (Nenhuma tabela encontrada - banco vazio)');
    } else {
      tablesResult.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    }
    
    // Verificar informações de conexão
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    console.log('\n🔧 Versão do PostgreSQL:');
    console.log('   ' + versionResult[0].version.split('\n')[0]);
    
    console.log('\n✅ Verificação concluída!\n');
    
    // Verificar se o nome do banco corresponde ao esperado
    const dbName = dbNameResult[0].database_name;
    if (dbName === 'banco_api_oficial_wpp') {
      console.log('🎯 O banco de dados está correto: banco_api_oficial_wpp');
    } else {
      console.log(`⚠️  O nome do banco é "${dbName}", não "banco_api_oficial_wpp"`);
      console.log('   Isso é normal - o Supabase usa "postgres" como nome padrão');
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao verificar banco:', error.message);
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 Erro de conexão. Verifique:');
      console.error('   1. A região está correta no .env?');
      console.error('   2. A senha está correta?');
      console.error('   3. Execute: bash scripts/update-env-region.sh');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();

