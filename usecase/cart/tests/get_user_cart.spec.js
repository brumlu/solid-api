import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';
import { randomUUID } from 'node:crypto';

describe('GetUserCart (Integration)', () => {
  let userCookie;

  const password = 'password123';

  beforeAll(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();

    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    const testUser = { 
      name: 'User', 
      email: `test.${randomUUID()}@teste.com`, 
      password: password 
    };
    
    await request(app).post('/register').send(testUser);
    
    const loginRes = await request(app).post('/login').send({
      email: testUser.email,
      password: password
    });
    
    if (!loginRes.header['set-cookie']) {
      throw new Error(`Falha no Login: ${JSON.stringify(loginRes.body)}`);
    }
    
    userCookie = loginRes.header['set-cookie'];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deve retornar 200 e um carrinho vazio se o usuário ainda não tiver itens', async () => {
    const response = await request(app)
      .get('/cart')
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);
    expect(response.body.cart).toBeDefined();
    expect(response.body.cart.items).toEqual([]); 
  });

  it('deve retornar o carrinho com os itens adicionados corretamente', async () => {
    const product = await prisma.products.create({
      data: { name: 'Notebook', price: 3000.0, stock: 10 }
    });

    await request(app)
      .post('/cart/items')
      .set('Cookie', userCookie)
      .send({ productId: product.id, quantity: 1 });

    const response = await request(app)
      .get('/cart')
      .set('Cookie', userCookie);

    // Verificações
    expect(response.status).toBe(200);
    expect(response.body.cart.items.length).toBe(1);
    
    expect(response.body.cart.items[0].name).toBe('Notebook');
    expect(response.body.cart.items[0].quantity).toBe(1);
    expect(Number(response.body.cart.items[0].price)).toBe(3000.0);
  });
});