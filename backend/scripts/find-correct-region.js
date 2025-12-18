#!/usr/bin/env node

// Script para encontrar a região correta do Supabase tentando diferentes opções

const { PrismaClient } = require('@prisma/client');

const regions = [
  'us-east-1',  // Estados Unidos (Leste)
  'us-west-1',  // Estados Unidos (Oeste)
  'sa-east-1',  // Brasil (São Paulo)
  'eu-west-1',  // Europa (Irlanda)
  'eu-central-1', // Europa (Frankfurt)
  'ap-southeast-1', // Singapura
  'ap-northeast-1', // Tóquio
];

const password = 'R%40padura%2114';
const projectRef = 'sqyxolugveizbhbxsnou';

async function testRegion(region, usePooler = false) {
  const port = usePooler ? 6543 : 5432;
  const poolerParams = usePooler ? '?pgbouncer=true&connection_limit=1' : '';
  
  const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:${port}/postgres${poolerParams}`;
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  try {
    await prisma.$connect();
    
    // Verificar nome do banco
    const dbResult = await prisma.$queryRaw`SELECT current_database() as db_name`;
    const dbName = dbResult[0].db_name;
    
    // Verificar se existe o schema public
    const schemaResult = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'public'
    `;
    
    console.log(`\n✅ SUCESSO! Região encontrada: ${region}`);
    console.log(`   Porta: ${port} ${usePooler ? '(Pooler)' : '(Direta)'}`);
    console.log(`   Nome do banco: ${dbName}`);
    console.log(`   Schema público: ${schemaResult.length > 0 ? 'Sim' : 'Não'}`);
    
    // Verificar se o banco é "banco_api_oficial_wpp"
    if (dbName === 'banco_api_oficial_wpp') {
      console.log(`\n🎯 CONFIRMADO: O banco é "banco_api_oficial_wpp"!`);
    } else {
      console.log(`\n⚠️  O nome do banco é "${dbName}", não "banco_api_oficial_wpp"`);
      console.log(`   (Isso é normal - Supabase usa "postgres" como padrão)`);
    }
    
    // Listar tabelas existentes
    const tablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tablesResult.length > 0) {
      console.log(`\n📑 Tabelas existentes (${tablesResult.length}):`);
      tablesResult.slice(0, 10).forEach((table, i) => {
        console.log(`   ${i + 1}. ${table.table_name}`);
      });
      if (tablesResult.length > 10) {
        console.log(`   ... e mais ${tablesResult.length - 10} tabelas`);
      }
    } else {
      console.log(`\n📑 Nenhuma tabela encontrada (banco vazio)`);
    }
    
    console.log(`\n📋 Connection String correta:`);
    console.log(`DATABASE_URL="${connectionString}"`);
    
    await prisma.$disconnect();
    return { success: true, region, port, connectionString, dbName };
    
  } catch (error) {
    await prisma.$disconnect();
    return { success: false, region, port, error: error.message };
  }
}

async function findCorrectRegion() {
  console.log('🔍 Procurando a região correta do Supabase...\n');
  console.log(`📋 Tentando ${regions.length} regiões diferentes...\n`);
  
  // Primeiro tenta com connection direta (porta 5432) - melhor para migrations
  for (const region of regions) {
    process.stdout.write(`Tentando ${region} (porta 5432)... `);
    const result = await testRegion(region, false);
    
    if (result.success) {
      console.log('\n\n🎉 REGIÃO ENCONTRADA!');
      console.log('='.repeat(60));
      console.log(`Região: ${result.region}`);
      console.log(`Connection String:`);
      console.log(result.connectionString);
      console.log('='.repeat(60));
      
      // Atualizar o .env automaticamente
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '..', '.env');
      
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Atualizar DATABASE_URL
        envContent = envContent.replace(
          /DATABASE_URL="[^"]*"/,
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
  
  // Se não encontrou com porta 5432, tenta com pooler (6543)
  console.log('\n🔄 Tentando com Connection Pooling (porta 6543)...\n');
  
  for (const region of regions) {
    process.stdout.write(`Tentando ${region} (porta 6543)... `);
    const result = await testRegion(region, true);
    
    if (result.success) {
      console.log('\n\n🎉 REGIÃO ENCONTRADA!');
      console.log('='.repeat(60));
      console.log(`Região: ${result.region}`);
      console.log(`Connection String:`);
      console.log(result.connectionString);
      console.log('='.repeat(60));
      return;
    } else {
      console.log('❌');
    }
  }
  
  console.log('\n❌ Nenhuma região funcionou. Verifique:');
  console.log('   1. A senha está correta?');
  console.log('   2. O projeto Supabase está ativo?');
  console.log('   3. Verifique manualmente no Dashboard do Supabase');
}

findCorrectRegion().catch(console.error);

