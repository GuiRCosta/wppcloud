#!/usr/bin/env node

// Script para testar connection string direta sem pooler
// O MCP funciona, então vamos tentar descobrir o formato correto

const { PrismaClient } = require('@prisma/client');

// Formatos alternativos de connection string do Supabase
const connectionStrings = [
  // Formato direto com db.[project-ref]
  `postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@db.sqyxolugveizbhbxsnou.supabase.co:5432/postgres`,
  
  // Formato com pooler direto
  `postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@pooler.supabase.com:5432/postgres?pgbouncer=true`,
  
  // Formato com project ref no hostname
  `postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@sqyxolugveizbhbxsnou.supabase.co:5432/postgres`,
  
  // Formato com connection pooling
  `postgresql://postgres.sqyxolugveizbhbxsnou:R%40padura%2114@sqyxolugveizbhbxsnou.pooler.supabase.com:5432/postgres`,
];

async function testConnection(connectionString, description) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT current_database() as db, current_user as user`;
    
    console.log(`\n✅ SUCESSO! ${description}`);
    console.log(`   Database: ${result[0].db}`);
    console.log(`   User: ${result[0].user}`);
    console.log(`   Connection String:`);
    console.log(`   ${connectionString}`);
    
    await prisma.$disconnect();
    return { success: true, connectionString, description };
    
  } catch (error) {
    await prisma.$disconnect();
    // Não mostrar erro para não poluir o output
    return { success: false };
  }
}

async function testAll() {
  console.log('🔍 Testando formatos alternativos de connection string...\n');
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const desc = `Formato ${i + 1}`;
    process.stdout.write(`Testando ${desc}... `);
    
    const result = await testConnection(connectionStrings[i], desc);
    
    if (result.success) {
      console.log('\n\n🎉 CONNECTION STRING ENCONTRADA!');
      console.log('='.repeat(70));
      console.log(result.connectionString);
      console.log('='.repeat(70));
      
      // Atualizar .env
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
        console.log('\n✅ Arquivo .env atualizado!');
      }
      
      return;
    } else {
      console.log('❌');
    }
  }
  
  console.log('\n❌ Nenhum formato funcionou.');
  console.log('\n💡 O MCP funciona porque usa uma conexão interna diferente.');
  console.log('   Você precisa obter a connection string do Dashboard do Supabase.\n');
}

testAll().catch(console.error);

