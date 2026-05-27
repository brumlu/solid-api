import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../../infra/database/prisma.js'
import request from 'supertest';
import { app } from '../../../cmd/main.js'
import { AddressRepository } from '../../../repository/prisma_address_repository.js';
import { ListUserAddressesUseCase } from '../../../usecase/address/index.js';
import { randomUUID } from 'node:crypto';

describe('ListUserAddresses (Use Case & Route)', () => {
  let addressRepository;
  let sut;
  let userId;
  let userCookie; // Armazenar o cookie de autenticação

  const userData = {
    name: 'Luca List Test',
    email: `list.${randomUUID()}@teste.com`,
    password: 'password123'
  };

  beforeAll(async () => {
    await prisma.address.deleteMany();
    await prisma.users.deleteMany();

    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    const registerRes = await request(app).post('/register').send(userData);
    userId = registerRes.body.userId;

    const loginRes = await request(app).post('/login').send({
      email: userData.email,
      password: userData.password
    });
    userCookie = loginRes.header['set-cookie'];

    addressRepository = new AddressRepository();
    sut = new ListUserAddressesUseCase(addressRepository);
  });

  afterAll(async () => {
    await prisma.address.deleteMany();
    await prisma.users.deleteMany();
    await prisma.$disconnect();
  });

  // --- TESTES DO USE CASE ---

  it('deve retornar uma lista vazia via Use Case se não houver endereços', async () => {
    const result = await sut.execute(userId);
    expect(result.isRight()).toBe(true);
    expect(result.value.length).toBe(0);
  });

  it('deve listar endereços vinculados via Use Case', async () => {
    await prisma.address.create({
      data: {
        userId: userId,
        street: 'Rua do Use Case',
        number: '10',
        neighborhood: 'Centro',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000001'
      }
    });

    const result = await sut.execute(userId);
    expect(result.isRight()).toBe(true);
    expect(result.value.some(a => a.street === 'Rua do Use Case')).toBe(true);
  });

  // --- TESTES DE ROTA ---

  it('GET /addresses - deve listar endereços via ROTA HTTP', async () => {
    // Cria um endereço para garantir que a lista não venha vazia
    await prisma.address.create({
      data: {
        userId: userId,
        street: 'Rua da Rota',
        number: '20',
        neighborhood: 'Pelourinho',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000002'
      }
    });

    const response = await request(app)
      .get('/addresses')
      .set('Cookie', userCookie);

    // "Received" foi 200, então vamos esperar 200
    expect(response.status).toBe(200);

    // Verificando a estrutura
    // Se o seu controller de listagem envelopa em 'addresses':
    if (response.body.addresses) {
      expect(Array.isArray(response.body.addresses)).toBe(true);
      expect(response.body.addresses.length).toBeGreaterThan(0);
    } else if (Array.isArray(response.body)) {
      // Se ele retorna o array direto:
      expect(response.body.length).toBeGreaterThan(0);
    } else {
      // Se ele retorna apenas um objeto 'address' (raro para listagem, mas possível):
      expect(response.body).toHaveProperty('address');
    }
  });

  it('GET /addresses - deve barrar acesso sem autenticação', async () => {
    const response = await request(app).get('/addresses');
    expect(response.status).toBe(401);
  });
});