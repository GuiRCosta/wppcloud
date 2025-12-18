#!/usr/bin/env node

// Script para descobrir automaticamente a região correta do Supabase
// Testa diferentes regiões até encontrar a que funciona

const { PrismaClient } = require('@prisma/client');

const regions = [
  'sa-east-1',    // Brasil (São Paulo) - mais provável para usuário brasileiro
  'us-east-1',    // Estados Unidos (Leste)
  'us-west-1',    // Estados Unidos (Oeste)
  'eu-west-1',    // Europa (Irlanda)
  'eu-central-1', // Europa (Frankfurt)
  'ap-southeast-1', // Singapura
  'ap-northeast-1', // Tóquio
];

const password = 'R%40padura%2114';
const projectRef = 'sqyxolugveizbhbxsnou';

async function testConnection(connectionString, region, port) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  try {
    await prisma.$connect();
    
    // Teste simples de query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log(`\n✅ SUCESSO! Região encontrada: ${region}`);
    console.log(`   Porta: ${port}`);
    console.log(`   Connection String:`);
    console.log(`   ${connectionString}`);
    
    await prisma.$disconnect();
    return { success: true, region, port, connectionString };
    
  } catch (error) {
    await prisma.$disconnect();
    return { success: false, region, port, error: error.message };
  }
}

async function findRegion() {
  console.log('🔍 Procurando a região correta do Supabase...\n');
  console.log(`📋 Testando ${regions.length} regiões diferentes...\n`);
  
  // Primeiro tenta connection direta (porta 5432) - melhor para migrations
  for (const region of regions) {
    const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
    process.stdout.write(`Testando ${region} (porta 5432)... `);
    
    const result = await testConnection(connectionString, region, 5432);
    
    if (result.success) {
      console.log('\n\n🎉 REGIÃO ENCONTRADA!');
      console.log('='.repeat(70));
      console.log(`Região: ${result.region}`);
      console.log(`Porta: ${result.port}`);
      console.log(`\nConnection String:`);
      console.log(result.connectionString);
      console.log('='.repeat(70));
      
      // Atualizar o .env automaticamente
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Substituir todas as ocorrências de DATABASE_URL
        envContent = envContent.replace(
          /DATABASE_URL="[^"]*"/g,
          `DATABASE_URL="${result.connectionString}"`
        );
        
        // Se não encontrou, adicionar no início
        if (!envContent.includes('DATABASE_URL')) {
          envContent = `DATABASE_URL="${result.connectionString}"\n\n${envContent}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Arquivo .env atualizado automaticamente!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Teste a conexão: node scripts/test-connection.js');
        console.log('   2. Execute migrations: npm run prisma:migrate');
        console.log('   3. Inicie o servidor: npm run start:dev\n');
      }
      
      return;
    } else {
      console.log('❌');
    }
  }
  
  // Se não encontrou com porta 5432, tenta com pooler (6543)
  console.log('\n🔄 Tentando com Connection Pooling (porta 6543)...\n');
  
  for (const region of regions) {
    const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
    process.stdout.write(`Testando ${region} (porta 6543)... `);
    
    const result = await testConnection(connectionString, region, 6543);
    
    if (result.success) {
      console.log('\n\n🎉 REGIÃO ENCONTRADA!');
      console.log('='.repeat(70));
      console.log(`Região: ${result.region}`);
      console.log(`Porta: ${result.port} (Connection Pooling)`);
      console.log(`\nConnection String:`);
      console.log(result.connectionString);
      console.log('='.repeat(70));
      
      // Atualizar o .env
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(
          /DATABASE_URL="[^"]*"/g,
          `DATABASE_URL="${result.connectionString}"`
        );
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Arquivo .env atualizado automaticamente!');
      }
      
      return;
    } else {
      console.log('❌');
    }
  }
  
  console.log('\n❌ Nenhuma região funcionou.');
  console.log('\n💡 Possíveis causas:');
  console.log('   1. A senha pode estar incorreta');
  console.log('   2. O projeto pode estar pausado');
  console.log('   3. A região pode não estar na lista testada');
  console.log('\n📋 Verifique manualmente no Dashboard do Supabase:');
  console.log('   https://supabase.com/dashboard/project/sqyxolugveizbhbxsnou/settings/database\n');
}

findRegion().catch(console.error);

