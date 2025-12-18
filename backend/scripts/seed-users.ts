import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

interface UserSeed {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationName?: string;
  organizationSlug?: string;
}

const usersToSeed: UserSeed[] = [
  {
    email: 'admin@teste.com',
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'Sistema',
    role: 'SUPER_ADMIN',
    organizationName: 'Empresa Teste',
    organizationSlug: 'empresa-teste',
  },
  {
    email: 'supervisor@teste.com',
    password: 'Supervisor@123',
    firstName: 'Supervisor',
    lastName: 'Teste',
    role: 'SUPERVISOR',
  },
  {
    email: 'agente@teste.com',
    password: 'Agente@123',
    firstName: 'Agente',
    lastName: 'Teste',
    role: 'AGENT',
  },
];

async function seedUsers() {
  console.log('🌱 Iniciando seed de usuários...\n');

  try {
    let organizationId: string | null = null;

    for (const userData of usersToSeed) {
      // Find or create organization
      if (userData.organizationName && userData.organizationSlug) {
        let organization = await prisma.organization.findUnique({
          where: { slug: userData.organizationSlug },
        });

        if (!organization) {
          organization = await prisma.organization.create({
            data: {
              name: userData.organizationName,
              slug: userData.organizationSlug,
            },
          });
          console.log(`✅ Organização criada: ${organization.name} (${organization.slug})`);
        } else {
          console.log(`ℹ️  Organização já existe: ${organization.name}`);
        }
        organizationId = organization.id;
      } else if (!organizationId) {
        // Se não especificou organização e ainda não temos uma, busca a primeira
        const existingOrg = await prisma.organization.findFirst();
        if (existingOrg) {
          organizationId = existingOrg.id;
          console.log(`ℹ️  Usando organização existente: ${existingOrg.name}`);
        } else {
          // Cria uma organização padrão
          const defaultOrg = await prisma.organization.create({
            data: {
              name: 'Organização Padrão',
              slug: 'organizacao-padrao',
            },
          });
          organizationId = defaultOrg.id;
          console.log(`✅ Organização padrão criada: ${defaultOrg.name}`);
        }
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email.toLowerCase() },
      });

      if (existingUser) {
        console.log(`⚠️  Usuário já existe: ${userData.email}`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email.toLowerCase(),
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          organizationId: organizationId!,
          role: userData.role,
          status: 'ACTIVE',
          emailVerified: true,
        },
      });

      console.log(`✅ Usuário criado: ${user.email} (${user.role})`);
      console.log(`   Nome: ${user.firstName} ${user.lastName}`);
      console.log(`   Senha: ${userData.password}\n`);
    }

    console.log('\n✨ Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    usersToSeed.forEach((user) => {
      console.log(`\n👤 ${user.role}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Senha: ${user.password}`);
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

