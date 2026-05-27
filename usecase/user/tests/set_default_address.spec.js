import { it, describe, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';
import { SetDefaultAddressUseCase } from '../index.js';
import { UserRepository } from '../../../repository/prisma_user_repository.js';
import { AddressRepository } from '../../../repository/prisma_address_repository.js';

describe('Set Default Address (Use Case & Route)', () => {
  let userCookie = null;
  let userId = null;
  let addressId = null;
  let sut; // Use Case (System Under Test)
  let userRepository;
  let addressRepository;

  const testEmail = `luca.${Date.now()}@teste.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    // 1. Limpeza e Setup Inicial
    await prisma.address.deleteMany();
    await prisma.users.deleteMany();
    
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 2. Criação de Usuário e Login para Rota
    const registerRes = await request(app).post('/register').send({
      name: 'Luca Teste',
      email: testEmail,
      password: testPassword
    });
    userId = registerRes.body.userId;

    const loginRes = await request(app).post('/login').send({
      email: testEmail,
      password: testPassword
    });
    userCookie = loginRes.header['set-cookie'];

    // 3. Criação de um endereço inicial via rota
    const addressRes = await request(app)
      .post('/addresses')
      .set('Cookie', userCookie)
      .send({
        street: 'Rua de Salvador',
        number: '123',
        neighborhood: 'Centro',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000000',
        userId: userId
      });
    
    addressId = addressRes.body.id || addressRes.body.address?.id;

    // 4. Instância do Use Case para testes de lógica
    userRepository = new UserRepository();
    addressRepository = new AddressRepository();
    sut = new SetDefaultAddressUseCase(userRepository, addressRepository);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- TESTE DO USE CASE ---
  it('deve ser capaz de definir um endereço padrão via Use Case', async () => {
    // Criamos um novo endereço para testar a troca via Use Case
    const newAddr = await prisma.address.create({
      data: {
        userId,
        street: 'Rua do Use Case',
        number: '50',
        neighborhood: 'Bonfim',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40415000'
      }
    });

    const result = await sut.execute({
      userId: userId,
      addressId: newAddr.id
    });

    expect(result.isRight()).toBe(true);

    const userInDb = await prisma.users.findUnique({ where: { id: userId } });
    expect(userInDb.defaultAddressId).toBe(newAddr.id);
  });

  // --- TESTES DA ROTA (PATCH /users/default-address) ---
  it('PATCH /users/default-address - deve definir o endereço padrão via ROTA HTTP', async () => {
    const response = await request(app)
      .patch('/users/default-address')
      .set('Cookie', userCookie)
      .send({ addressId });

    expect(response.status).toBe(200);

    const userInDb = await prisma.users.findUnique({ where: { id: userId } });
    expect(userInDb.defaultAddressId).toBe(addressId);
  });

  it('PATCH /users/default-address - deve impedir uso de endereço de outro usuário', async () => {
    // Cria outro usuário e outro endereço
    const otherUser = await prisma.users.create({
      data: {
        name: 'Outro Usuário',
        email: `outro.${Date.now()}@gmail.com`,
        password: 'hash',
        roleId: (await prisma.role.findFirst({ where: { name: 'Default' } })).id
      }
    });

    const otherAddress = await prisma.address.create({
      data: {
        userId: otherUser.id,
        street: 'Rua Alheia',
        number: '0',
        neighborhood: 'Desconhecido',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000000'
      }
    });

    const response = await request(app)
      .patch('/users/default-address')
      .set('Cookie', userCookie)
      .send({ addressId: otherAddress.id });

    // O Use Case retorna NotAllowedError, que o seu controller deve mapear para 403
    expect(response.status).toBe(403);
  });

  it('PATCH /users/default-address - deve retornar 404 para endereço inexistente', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    
    const response = await request(app)
      .patch('/users/default-address')
      .set('Cookie', userCookie)
      .send({ addressId: fakeUuid });

    expect(response.status).toBe(404);
  });

  it('PATCH /users/default-address - deve retornar 401 se não houver cookie', async () => {
    const response = await request(app)
      .patch('/users/default-address')
      .send({ addressId });

    expect(response.status).toBe(401);
  });
});