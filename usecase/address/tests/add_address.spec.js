import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../../infra/database/prisma.js'
import request from 'supertest';
import { app } from '../../../cmd/main.js'
import { AddressRepository } from '../../../repository/prisma_address_repository.js';
import { AddAddressUseCase } from '../../../usecase/address/index.js';
import { UserRepository } from '../../../repository/prisma_user_repository.js';
import { randomUUID } from 'node:crypto';

describe('AddAddress (Use Case & Route POST)', () => {
  let addressRepository;
  let userRepository;
  let sut;
  let userId;
  let userCookie;

  const testUser = {
    name: 'Luca Address Test',
    email: `luca.${randomUUID()}@teste.com`,
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

    // Registro do usuário
    const registerRes = await request(app)
      .post('/register')
      .send(testUser);
    
    userId = registerRes.body.userId;

    // Login para obter o Cookie
    const loginRes = await request(app)
      .post('/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    userCookie = loginRes.header['set-cookie'];

    // Instância dos repositórios e Use Case
    addressRepository = new AddressRepository();
    userRepository = new UserRepository();
    sut = new AddAddressUseCase(addressRepository, userRepository);
  });

  afterAll(async () => {
    await prisma.address.deleteMany();
    await prisma.users.deleteMany();
    await prisma.$disconnect();
  });

  // --- TESTES DO USE CASE ---

  it('deve persistir um novo endereço vinculado ao usuário via Use Case', async () => {
    const addressData = {
      userId: userId,
      street: 'Rua do Use Case',
      number: '123',
      neighborhood: 'Bairro Teste',
      city: 'Salvador',
      state: 'BA',
      zipCode: '40000000',
      isDefault: true
    };

    const result = await sut.execute(addressData);

    expect(result.isRight()).toBe(true);
    expect(result.value).toHaveProperty('id');
  });

  // --- TESTES DA ROTA ---

  it('POST /addresses - deve criar um novo endereço via ROTA HTTP', async () => {
    const addressData = {
      userId: userId, // Se o seu controller/schema exigir no body
      street: 'Rua da Rota POST',
      number: '456',
      neighborhood: 'Centro',
      city: 'Salvador',
      state: 'BA',
      zipCode: '40015000',
      isDefault: false
    };

    const response = await request(app)
      .post('/addresses')
      .set('Cookie', userCookie) // Autenticação aqui
      .send(addressData);

    // Validações baseadas no controller (Status 201 e mensagem)
    expect(response.status).toBe(201);
    expect(response.body.message).toMatch(/sucesso/i);
    expect(response.body.address).toHaveProperty('id');
    expect(response.body.address.street).toBe('Rua da Rota POST');

    // Verificação extra no banco de dados
    const dbCheck = await prisma.address.findUnique({
      where: { id: response.body.address.id }
    });
    expect(dbCheck).not.toBeNull();
  });

  it('POST /addresses - deve retornar 400 se a validação do schema falhar', async () => {
    const response = await request(app)
      .post('/addresses')
      .set('Cookie', userCookie)
      .send({
        street: '', // Rua vazia deve falhar no validate(createAddressSchema)
        zipCode: 'curto'
      });

    expect(response.status).toBe(400);
  });

  it('POST /addresses - deve retornar 401 se o usuário não estiver logado', async () => {
    const response = await request(app)
      .post('/addresses')
      .send({ street: 'Rua Sem Login' });

    expect(response.status).toBe(401);
  });
});