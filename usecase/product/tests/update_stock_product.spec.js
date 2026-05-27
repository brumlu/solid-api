import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Update Product Stock (Integration)', () => {
  let adminCookie;
  let productId;

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
              create: { 
                name: 'PRODUCT_UPDATE', 
                description: 'Permissão para atualizar estoque' 
              }
            }
          }
        }
      }
    });

    const product = await prisma.products.create({
      data: {
        name: 'Mouse Gamer',
        price: 150.00,
        stock: 10
      }
    });
    productId = product.id;

    const hashedPassword = await bcrypt.hash('password123', 8);
    await prisma.users.create({
      data: {
        name: 'Admin Stock',
        email: 'admin@stock.com',
        password: hashedPassword,
        roleId: adminRole.id
      }
    });

    const loginResponse = await request(app).post('/login').send({
      email: 'admin@stock.com',
      password: 'password123'
    });

    adminCookie = loginResponse.header['set-cookie'];
  });

  it('deve ser capaz de atualizar apenas o estoque de um produto', async () => {
    const newStock = 80;

    const response = await request(app)
      .patch(`/products/${productId}/stock`)
      .set('Cookie', adminCookie)
      .send({ stock: newStock });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
    
    const updatedProduct = await prisma.products.findUnique({
      where: { id: productId }
    });

    expect(updatedProduct.stock).toBe(newStock);
  });

  it('deve retornar 404 ao tentar atualizar estoque de produto inexistente', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app)
      .patch(`/products/${fakeId}/stock`)
      .set('Cookie', adminCookie)
      .send({ stock: 100 });

    expect(response.status).toBe(404);
  });

  it('não deve permitir estoque negativo (Zod)', async () => {
    const response = await request(app)
      .patch(`/products/${productId}/stock`)
      .set('Cookie', adminCookie)
      .send({ stock: -5 });

    expect(response.status).toBe(400);
  });
});