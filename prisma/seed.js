import pkgClient from '@prisma/client';
const { PrismaClient } = pkgClient;

// Reformular isso
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config'; 

import { Permissions } from '../src/constants/permissions.js';

// Configura a conexão manual
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Instancia o Prisma com o adaptador
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando Seed...');
}
  // Criar as Permissões no banco de dados
  console.log('Criando permissões...');
  const allPermissions = Object.values(Permissions);
  
  for (const pName of allPermissions) {
    await prisma.permission.upsert({
      where: { name: pName },
      update: {}, // Se já existir, não altera nada
      create: { 
        name: pName,
        description: `Permissão para ${pName.toLowerCase().replace('_', ' ')}`
      },
    });
  }

  // Criar o Cargo ADMIN e vincular a permissão ADMIN_ACCESS
  console.log('Criando cargo Admin...');
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador total do sistema',
      permissions: {
        connect: [{ name: Permissions.ADMIN_ACCESS }]
      }
    }
  });

  // Criar o Cargo ALUNO/USER e vincular permissões básicas
  console.log('Criando cargo ALUNO...');
  await prisma.role.upsert({
    where: { name: 'ALUNO' },
    update: {},
    create: {
      name: 'ALUNO',
      description: 'Usuário padrão com acesso ao próprio perfil',
      permissions: {
        connect: [
          { name: Permissions.USER_READ },
          { name: Permissions.USER_UPDATE }
        ]
      }
    }
  });

  console.log('Seed finalizado com sucesso!');

main()
  .catch((err) => {
    console.error('Erro no Seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  // Fazer depois o CREATE para nova tabela e etc