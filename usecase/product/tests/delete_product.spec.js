import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Delete Product (Integration)', () => {
  let adminToken;
  let userToken;
  let productIdToDelete;

  beforeAll(async () => {
    // 1. Limpeza total
    await prisma.rolePermission.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // 2. Criar Role ADMIN (com permissão de delete) e Role Default (sem delete)
    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        permissions: {
          create: {
            permission: {
              create: { name: 'PRODUCT_DELETE', description: 'Deletar produtos' }
            }
          }
        }
      }
    });

    const defaultRole = await prisma.role.create({
      data: { name: 'Default' }
    });

    // 3. Criar um produto para ser deletado
    const product = await prisma.products.create({
      data: { name: 'Produto para Deletar', price: 50.00, stock: 1 }
    });
    productIdToDelete = product.id;

    // 4. Criar Usuários e Tokens
    const hashedPassword = await bcrypt.hash('password123', 8);

    // Criar Admin
    await prisma.users.create({
      data: { name: 'Admin', email: 'admin@del.com', password: hashedPassword, roleId: adminRole.id }
    });
    const adminLogin = await request(app).post('/login').send({ email: 'admin@del.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    // Criar User Comum
    await prisma.users.create({
      data: { name: 'User', email: 'user@del.com', password: hashedPassword, roleId: defaultRole.id }
    });
    const userLogin = await request(app).post('/login').send({ email: 'user@del.com', password: 'password123' });
    userToken = userLogin.body.token;
  });

  it('não deve permitir que um usuário sem permissão delete um produto', async () => {
    const response = await request(app)
      .delete(`/products/${productIdToDelete}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403); // Forbidden
    
    // Garantir que o produto ainda existe no banco
    const productExists = await prisma.products.findUnique({ where: { id: productIdToDelete } });
    expect(productExists).not.toBeNull();
  });

  it('deve ser capaz de deletar um produto como admin', async () => {
    const response = await request(app)
      .delete(`/products/${productIdToDelete}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);

    // Verificar se foi removido do banco de fato
    const productExists = await prisma.products.findUnique({ where: { id: productIdToDelete } });
    expect(productExists).toBeNull();
  });

  it('deve retornar 404 ao tentar deletar um produto que não existe', async () => {
    const response = await request(app)
      .delete('/products/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    // Se o seu UseCase lança um erro de "não encontrado", deve ser 404
    expect(response.status).toBe(404);
  });
});