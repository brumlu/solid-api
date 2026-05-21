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
    // Limpeza (Cuidado com a ordem das FKs)
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.products.deleteMany();
    await prisma.users.deleteMany();

    // Garantir a Role (Usando o nome que você usou no teste funcional)
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // REGISTRO REAL (Garante que a senha seja hasheada corretamente)
    const registerRes = await request(app)
      .post('/register')
      .send(testUser);
    
    userId = registerRes.body.userId || registerRes.body.user?.id || registerRes.body.id;

    // LOGIN REAL (Garante que o cookie seja gerado)
    const loginRes = await request(app)
      .post('/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    userCookie = loginRes.header['set-cookie'];

    // Criar Produto para os testes
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
    // Cria carrinho e adiciona item via repo
    const cart = await cartRepository.create(userId);
    await cartRepository.addItem(cart.id, testProduct.id, 2);

    // Ação
    await cartRepository.removeItem(cart.id, testProduct.id);

    // Verificação
    const updatedCart = await cartRepository.findByUserId(userId);
    expect(updatedCart.items.length).toBe(0);
  });

  it('DELETE /cart/items/:productId - deve remover o item via ROTA HTTP', async () => {
    // Garantia de que o usuário tem um carrinho com item
    let cart = await cartRepository.findByUserId(userId);
    if (!cart) {
        cart = await cartRepository.create(userId);
    }
    
    // Adiciona o item para ter o que deletar
    await cartRepository.addItem(cart.id, testProduct.id, 1);

    // Ação na Rota
    const response = await request(app)
      .delete(`/cart/items/${testProduct.id}`)
      .set('Cookie', userCookie);

    // Verificações
    expect(response.status).toBe(200);
    
    // Verificação final no banco
    const finalCheck = await cartRepository.findByUserId(userId);
    expect(finalCheck.items.length).toBe(0);
  });
});