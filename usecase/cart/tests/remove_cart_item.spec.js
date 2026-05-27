import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';
import { CartRepository } from '../../../repository/prisma_cart_repository.js';
import { randomUUID } from 'node:crypto';

describe('RemoveItemFromCart (Use Case & Route DELETE)', () => {
  let cartRepository;
  let userId;
  let testProduct;
  let userCookie;

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

    const registerRes = await request(app)
      .post('/register')
      .send(testUser);
    
    userId = registerRes.body.userId || registerRes.body.user?.id || registerRes.body.id;

    const loginRes = await request(app)
      .post('/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    userCookie = loginRes.header['set-cookie'];

    // Criando produto para os testes
    testProduct = await prisma.products.create({
      data: {
        name: 'Produto de Teste',
        price: 99.90,
        stock: 50
      }
    });

    cartRepository = new CartRepository();
  });

  afterAll(async () => {
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();
    await prisma.$disconnect();
  });

  it('deve remover um item do carrinho via Use Case', async () => {
    const cart = await cartRepository.create(userId);
    await cartRepository.addItem(cart.id, testProduct.id, 2);

    await cartRepository.removeItem(cart.id, testProduct.id);

    const updatedCart = await cartRepository.findByUserId(userId);
    expect(updatedCart.items.length).toBe(0);
  });

  it('DELETE /cart/items/:productId - deve remover o item via ROTA HTTP', async () => {
    let cart = await cartRepository.findByUserId(userId);
    if (!cart) {
        cart = await cartRepository.create(userId);
    }
    
    await cartRepository.addItem(cart.id, testProduct.id, 1);

    const response = await request(app)
      .delete(`/cart/items/${testProduct.id}`)
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);
    
    const finalCheck = await cartRepository.findByUserId(userId);
    expect(finalCheck.items.length).toBe(0);
  });
});