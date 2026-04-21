import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Update Product Price (Integration)', () => {
  let adminToken;
  let productId;

  beforeAll(async () => {
    // 1. Limpeza total para evitar conflitos de testes anteriores
    await prisma.rolePermission.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // 2. Criar Role ADMIN com permissão necessária
    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        permissions: {
          create: {
            permission: {
              create: { 
                name: 'PRODUCT_UPDATE', 
                description: 'Permissão para atualizar produtos' 
              }
            }
          }
        }
      }
    });

    // 3. Criar produto inicial
    const product = await prisma.products.create({
      data: {
        name: 'Teclado Gamer',
        price: 200.00,
        stock: 50
      }
    });
    productId = product.id;

    // 4. Criar Usuário Admin e logar para obter o Token
    const hashedPassword = await bcrypt.hash('password123', 8);
    await prisma.users.create({
      data: {
        name: 'Admin User',
        email: 'admin@price.com',
        password: hashedPassword,
        roleId: adminRole.id
      }
    });

    const loginResponse = await request(app).post('/login').send({
      email: 'admin@price.com',
      password: 'password123'
    });

    adminToken = loginResponse.body.token;
  });

  it('deve ser capaz de atualizar apenas o preço de um produto', async () => {
    const newPrice = 259.90;

    const response = await request(app)
      .patch(`/products/${productId}/price`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: newPrice });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
    
    // Validar no banco de dados
    const updatedProduct = await prisma.products.findUnique({
      where: { id: productId }
    });

    expect(Number(updatedProduct.price)).toBe(newPrice);
    expect(updatedProduct.name).toBe('Teclado Gamer'); 
  });

  it('deve retornar 404 ao tentar atualizar preço de produto inexistente', async () => {
    // Usamos um UUID no formato correto para evitar erro 500 de sintaxe do banco
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app)
      .patch(`/products/${fakeId}/price`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 100.00 });

    expect(response.status).toBe(404);
  });

  it('não deve atualizar preço se o valor for negativo (Zod)', async () => {
    const response = await request(app)
      .patch(`/products/${productId}/price`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: -50.00 });

    expect(response.status).toBe(400);
  });
});