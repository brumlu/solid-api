import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Delete Product (Integration)', () => {
  let adminCookie;
  let userCookie;
  let productIdToDelete;

  beforeAll(async () => {
    await prisma.rolePermission.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

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

    const product = await prisma.products.create({
      data: { name: 'Produto para Deletar', price: 50.00, stock: 1 }
    });
    productIdToDelete = product.id;

    const hashedPassword = await bcrypt.hash('password123', 8);

    // Login Admin
    await prisma.users.create({
      data: { name: 'Admin', email: 'admin@del.com', password: hashedPassword, roleId: adminRole.id }
    });
    const adminLogin = await request(app).post('/login').send({ email: 'admin@del.com', password: 'password123' });
    adminCookie = adminLogin.header['set-cookie'];

    // Login User Comum
    await prisma.users.create({
      data: { name: 'User', email: 'user@del.com', password: hashedPassword, roleId: defaultRole.id }
    });
    const userLogin = await request(app).post('/login').send({ email: 'user@del.com', password: 'password123' });
    userCookie = userLogin.header['set-cookie'];
  });

  it('não deve permitir que um usuário sem permissão delete um produto', async () => {
    const response = await request(app)
      .delete(`/products/${productIdToDelete}`)
      .set('Cookie', userCookie);

    expect(response.status).toBe(403); 
    
    // Garantindo que o produto ainda existe no banco
    const productExists = await prisma.products.findUnique({ where: { id: productIdToDelete } });
    expect(productExists).not.toBeNull();
  });

  it('deve ser capaz de deletar um produto como admin', async () => {
    const response = await request(app)
      .delete(`/products/${productIdToDelete}`)
      .set('Cookie', adminCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);

    // Verificar se foi removido do banco de fato
    const productExists = await prisma.products.findUnique({ where: { id: productIdToDelete } });
    expect(productExists).toBeNull();
  });

  it('deve retornar 404 ao tentar deletar um produto que não existe', async () => {
    const response = await request(app)
      .delete('/products/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookie);

    expect(response.status).toBe(404);
  });
});