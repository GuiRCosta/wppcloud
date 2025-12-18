import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do Prisma...\n');

  try {
    // Create or find organization
    let organization = await prisma.organization.findUnique({
      where: { slug: 'empresa-teste' },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Empresa Teste',
          slug: 'empresa-teste',
        },
      });
      console.log(`✅ Organização criada: ${organization.name}`);
    } else {
      console.log(`ℹ️  Organização já existe: ${organization.name}`);
    }

    // Seed users
    const users = [
      {
        email: 'admin@teste.com',
        password: 'Admin@123',
        firstName: 'Admin',
        lastName: 'Sistema',
        role: 'SUPER_ADMIN' as UserRole,
      },
      {
        email: 'supervisor@teste.com',
        password: 'Supervisor@123',
        firstName: 'Supervisor',
        lastName: 'Teste',
        role: 'SUPERVISOR' as UserRole,
      },
      {
        email: 'agente@teste.com',
        password: 'Agente@123',
        firstName: 'Agente',
        lastName: 'Teste',
        role: 'AGENT' as UserRole,
      },
    ];

    for (const userData of users) {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() },
      });

      if (existingUser) {
        console.log(`⚠️  Usuário já existe: ${userData.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          organizationId: organization.id,
          role: userData.role,
          status: 'ACTIVE' as UserStatus,
          emailVerified: true,
        },
      });

      console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
    }

    console.log('\n✨ Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach((user) => {
      console.log(`\n👤 ${user.role}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Senha: ${user.password}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

