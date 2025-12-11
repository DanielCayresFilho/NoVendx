import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar segmento padrão
  const segment = await prisma.segment.upsert({
    where: { name: 'Padrão' },
    update: {},
    create: {
      name: 'Padrão',
    },
  });

  console.log('✅ Segmento criado:', segment.name);

  // Criar tabulações
  const tabulations = await Promise.all([
    prisma.tabulation.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Atendido',
        isCPC: true,
      },
    }),
    prisma.tabulation.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Não Atendido',
        isCPC: false,
      },
    }),
    prisma.tabulation.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Retornar Depois',
        isCPC: false,
      },
    }),
  ]);

  console.log('✅ Tabulações criadas:', tabulations.length);

  // Criar usuário admin
  const adminPassword = await argon2.hash('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vend.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@vend.com',
      password: adminPassword,
      role: 'admin',
      status: 'Offline',
    },
  });

  console.log('✅ Admin criado:', admin.email, '| senha: admin123');

  // Criar usuário supervisor
  const supervisorPassword = await argon2.hash('supervisor123');
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@vend.com' },
    update: {},
    create: {
      name: 'Supervisor',
      email: 'supervisor@vend.com',
      password: supervisorPassword,
      role: 'supervisor',
      segment: segment.id,
      status: 'Offline',
    },
  });

  console.log('✅ Supervisor criado:', supervisor.email, '| senha: supervisor123');

  // Criar usuário operator
  const operatorPassword = await argon2.hash('operator123');
  const operator = await prisma.user.upsert({
    where: { email: 'operator@vend.com' },
    update: {},
    create: {
      name: 'Operador',
      email: 'operator@vend.com',
      password: operatorPassword,
      role: 'operator',
      segment: segment.id,
      status: 'Offline',
    },
  });

  console.log('✅ Operator criado:', operator.email, '| senha: operator123');

  // Criar Evolution de exemplo
  const evolution = await prisma.evolution.upsert({
    where: { evolutionName: 'Evolution01' },
    update: {},
    create: {
      evolutionName: 'Evolution01',
      evolutionUrl: 'http://localhost:8080',
      evolutionKey: 'sua-chave-aqui',
    },
  });

  console.log('✅ Evolution criada:', evolution.evolutionName);

  console.log('✅ Seed concluído com sucesso!');
  console.log('\n📋 Dados criados:');
  console.log('👥 Usuários:');
  console.log('   Admin:      admin@vend.com | admin123');
  console.log('   Supervisor: supervisor@vend.com | supervisor123');
  console.log('   Operator:   operator@vend.com | operator123');
  console.log('\n📡 Evolution:');
  console.log('   Nome: Evolution01');
  console.log('   URL: http://localhost:8080');
  console.log('   ⚠️  Lembre-se de atualizar a URL e chave da Evolution!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
