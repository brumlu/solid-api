import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Update Product General (Integration)', () => {
  let adminCookie;
  let productId;

  beforeAll(async () => {
    await prisma.rolePermission.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // Cria Role ADMIN com permissão PRODUCT_UPDATE
    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        permissions: {
          create: {
            permission: {
              create: { 
                name: 'PRODUCT_UPDATE', 
                description: 'Permissão para atualizar dados de produtos' 
              }
            }
          }
        }
      }
    });

    // Cria o produto que será editado
    const product = await prisma.products.create({
      data: {
        name: 'Produto Antigo',
        description: 'Descrição Antiga',
        price: 100.00,
        stock: 10
      }
    });
    productId = product.id;

    // Criar Admin e realizar login para capturar o Cookie
    const hashedPassword = await bcrypt.hash('password123', 8);
    await prisma.users.create({
      data: {
        name: 'Admin User',
        email: 'admin@updategeneral.com',
        password: hashedPassword,
        roleId: adminRole.id
      }
    });

    const loginResponse = await request(app).post('/login').send({
      email: 'admin@updategeneral.com',
      password: 'password123'
    });

    // Captura o cabeçalho 'set-cookie' enviado pela API
    adminCookie = loginResponse.header['set-cookie'];
  });

  it('deve ser capaz de atualizar todos os campos de um produto usando PATCH', async () => {
    const updatedData = {
      name: 'Produto Novo',
      description: 'Descrição Atualizada',
      price: 150.50,
      stock: 20
    };

    const response = await request(app)
      .patch(`/products/${productId}`)
      .set('Cookie', adminCookie)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);

    const productInDb = await prisma.products.findUnique({
      where: { id: productId }
    });

    expect(productInDb.name).toBe(updatedData.name);
    expect(productInDb.description).toBe(updatedData.description);
    expect(Number(productInDb.price)).toBe(updatedData.price);
    expect(productInDb.stock).toBe(updatedData.stock);
  });

  it('deve ser capaz de atualizar apenas o nome via PATCH, mantendo os outros campos', async () => {
    const response = await request(app)
      .patch(`/products/${productId}`)
      .set('Cookie', adminCookie)
      .send({ name: 'Nome Apenas' });

    expect(response.status).toBe(200);

    const productInDb = await prisma.products.findUnique({
      where: { id: productId }
    });

    expect(productInDb.name).toBe('Nome Apenas');
    expect(productInDb.stock).toBe(20); // Valor persistido do teste anterior
  });

  it('não deve permitir atualizar com dados inválidos (Zod) via PATCH', async () => {
    const response = await request(app)
      .patch(`/products/${productId}`)
      .set('Cookie', adminCookie)
      .send({
        price: "valor_invalido", 
        stock: -5              
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details');
  });

  it('deve retornar 404 para produto inexistente no PATCH', async () => {
    const response = await request(app)
      .patch('/products/00000000-0000-0000-0000-000000000000')
      .set('Cookie', adminCookie)
      .send({ name: 'Inexistente' });

    expect(response.status).toBe(404);
  });
});