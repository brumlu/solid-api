import { afterAll } from 'vitest';
import prisma from './infra/database/prisma.js';

afterAll(async () => {
  await prisma.users.deleteMany();
  await prisma.$disconnect();
});