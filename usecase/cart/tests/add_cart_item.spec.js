import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';
import { randomUUID } from 'node:crypto';

describe('Add Item to Cart (Integration)', () => {
  let userCookie;
  let userId;
  let testProduct;

  const testUser = {
    name: 'Cart Tester',
    email: `cart.${randomUUID()}@teste.com`,
    password: 'password123'
  };

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

    await request(app).post('/register').send(testUser);
    
    const loginRes = await request(app).post('/login').send({
      email: testUser.email,
      password: testUser.password
    });
    
    userCookie = loginRes.header['set-cookie'];
    userId = loginRes.body.user?.id || loginRes.body.id;

    testProduct = await prisma.products.create({
      data: {
        name: 'Teclado Mecânico',
        price: 250.00,
        stock: 50
      }
    });
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.$disconnect();
  });

  describe('Validation', () => {
    it('should return 400 when productId is not a valid UUID', async () => {
      const response = await request(app)
        .post('/cart/items')
        .set('Cookie', userCookie)
        .send({ productId: 'id-invalido-123', quantity: 2 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("O ID do produto deve ser um UUID válido");
    });

    it('should return 400 when quantity is missing', async () => {
      const response = await request(app)
        .post('/cart/items')
        .set('Cookie', userCookie)
        .send({ productId: 'a52e437b-a50e-407e-a567-b21f3131e290' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("A quantidade é obrigatória");
    });
  });

  describe('Business Rules', () => {
    it('não deve adicionar ao carrinho se o estoque for insuficiente', async () => {
      const lowStockProduct = await prisma.products.create({
        data: { name: 'Produto Estoque Baixo', price: 10.0, stock: 1 }
      });

      const response = await request(app)
        .post('/cart/items')
        .set('Cookie', userCookie)
        .send({
          productId: lowStockProduct.id,
          quantity: 10 // Tentando pegar mais do que tem
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Estoque insuficiente para a quantidade desejada");
    });

    it('deve adicionar item ao carrinho com sucesso', async () => {
      const response = await request(app)
        .post('/cart/items')
        .set('Cookie', userCookie)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      expect(response.status).toBe(201);
      
      // Verificação no banco
      const cart = await prisma.cart.findFirst({ 
        where: { userId }, 
        include: { items: true } 
      });
      expect(cart.items.some(i => i.productId === testProduct.id)).toBe(true);
    });
  });
});