import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('List Products (Integration)', () => {
  let userCookie;

  beforeAll(async () => {
    await prisma.rolePermission.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();

    // Criar Role Default com permissão de leitura de produtos
    const defaultRole = await prisma.role.create({
      data: {
        name: 'Default',
        description: 'Usuário padrão do sistema',
        permissions: {
          create: {
            permission: {
              create: { 
                name: 'PRODUCT_READ', 
                description: 'Permissão para visualizar produtos' 
              }
            }
          }
        }
      }
    });

    // Criando alguns produtos para a listagem
    await prisma.products.createMany({
      data: [
        { name: 'Mouse Gamer', price: 150.00, stock: 10 },
        { name: 'Monitor 144hz', price: 1200.00, stock: 5 },
        { name: 'Cadeira Ergonômica', price: 890.00, stock: 2 }
      ]
    });

    const hashedPassword = await bcrypt.hash('password123', 8);
    await prisma.users.create({
      data: {
        name: 'Usuário Comum',
        email: 'user@teste.com',
        password: hashedPassword,
        roleId: defaultRole.id
      }
    });

    const loginResponse = await request(app).post('/login').send({
      email: 'user@teste.com',
      password: 'password123'
    });

    userCookie = loginResponse.header['set-cookie'];
  });

  it('deve ser capaz de listar todos os produtos cadastrados', async () => {
    const response = await request(app)
      .get('/products')
      .set('Cookie', userCookie);
      
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body.products.length).toBe(3);
    
    const firstProduct = response.body.products[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
  });

  it('não deve permitir listar produtos sem estar autenticado', async () => {
    const response = await request(app).get('/products');

    expect(response.status).toBe(401);
  });

  it('deve retornar uma lista vazia se não houver produtos', async () => {
    // Limpamos apenas os produtos para este teste específico
    await prisma.products.deleteMany();

    const response = await request(app)
      .get('/products')
      .set('Cookie', userCookie); // Mantendo a sessão via cookie

    expect(response.status).toBe(200);
    expect(response.body.products).toEqual([]);
  });
});