import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Create Product (Integration)', () => {
  let authCookie;

  beforeAll(async () => {
    await prisma.rolePermission.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    const adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrador do sistema',
        permissions: {
          create: {
            permission: {
              create: { 
                name: 'PRODUCT_CREATE', 
                description: 'Permissão para criar produtos' 
              }
            }
          }
        }
      }
    });

    // Criar o Usuário Administrador diretamente no banco
    const hashedPassword = await bcrypt.hash('password123', 8);

    await prisma.users.create({
      data: {
        name: 'Admin User',
        email: 'admin@teste.com',
        password: hashedPassword,
        roleId: adminRole.id
      }
    });

    // Realizando o login para capturar o cookie
    const loginResponse = await request(app).post('/login').send({
      email: 'admin@teste.com',
      password: 'password123'
    });
    
    const cookies = loginResponse.header['set-cookie'];

    // Se o login falhar aqui, o teste vai avisar antes de começar
    if (!cookies) {
      throw new Error(`Falha ao gerar cookie de autenticação: ${JSON.stringify(loginResponse.body)}`);
    }
    authCookie = cookies;
  });

  const newProduct = {
    name: 'Teclado Mecânico RGB',
    description: 'Switch Blue, ABNT2',
    price: 250.90,
    stock: 15
  };

  it('deve ser capaz de cadastrar um novo produto como admin', async () => {
    const response = await request(app)
      .post('/products')
      .set('Cookie', authCookie)
      .send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product.name).toBe(newProduct.name);
    
    // Convertendo Decimal (string) para Number
    expect(Number(response.body.product.price)).toBe(newProduct.price);
  });

  it('não deve permitir cadastrar produto sem token de autenticação', async () => {
    const response = await request(app)
      .post('/products')
      .send(newProduct);

    expect(response.status).toBe(401);
  });

  it('não deve cadastrar produto com preço negativo', async () => {
    const response = await request(app)
      .post('/products')
      .set('Cookie', authCookie)
      .send({
        ...newProduct,
        price: -10.00
      });

    // AppError capturado pelo Middleware deve retornar 400
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Dados inválidos");
  });

  it('não deve cadastrar se faltarem dados obrigatórios (Zod)', async () => {
    const response = await request(app)
      .post('/products')
      .set('Cookie', authCookie)
      .send({
        description: 'Faltando nome e preço'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details');
  });
});