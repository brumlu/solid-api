import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';
import { DeleteAddressUseCase } from '../../../usecase/address/index.js';
import { AddressRepository } from '../../../repository/prisma_address_repository.js';
import { UserRepository } from '../../../repository/prisma_user_repository.js';
import { randomUUID } from 'node:crypto';

describe('Delete Address (Use Case & Route)', () => {
  let addressRepository;
  let userRepository;
  let sut;
  let userId;
  let userCookie;
  let addressId;

  const testUser = {
    name: 'Luca Delete Test',
    email: `delete.${randomUUID()}@teste.com`,
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

    const registerRes = await request(app).post('/register').send(testUser);
    userId = registerRes.body.userId || registerRes.body.user?.id || registerRes.body.id;

    const loginRes = await request(app).post('/login').send({
      email: testUser.email,
      password: testUser.password
    });
    userCookie = loginRes.header['set-cookie'];

    const addr = await prisma.address.create({
      data: {
        userId,
        street: 'Rua Principal',
        number: '10',
        neighborhood: 'Centro',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000000'
      }
    });
    addressId = addr.id;

    addressRepository = new AddressRepository();
    userRepository = new UserRepository();
    sut = new DeleteAddressUseCase(addressRepository, userRepository);
  });

  afterAll(async () => {
    await prisma.address.deleteMany();
    await prisma.users.deleteMany();
    await prisma.$disconnect();
  });

  it('DELETE /addresses/:id - deve deletar via ROTA HTTP (Dono)', async () => {
    const response = await request(app)
      .delete(`/addresses/${addressId}`) 
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);
  });

  it('DELETE /addresses/:id - deve retornar 404 para endereço inexistente', async () => {
    const response = await request(app)
      .delete(`/addresses/${randomUUID()}`)
      .set('Cookie', userCookie);

    expect(response.status).toBe(404);
  });

  it('DELETE /addresses/:id - deve retornar 403 para endereço de outro usuário', async () => {
    const otherUser = await prisma.users.create({
      data: {
        name: 'Outro',
        email: `outro.${randomUUID()}@teste.com`,
        password: '123',
        roleId: (await prisma.role.findFirst({ where: { name: 'Default' } })).id
      }
    });

    const otherAddr = await prisma.address.create({
      data: { userId: otherUser.id, street: 'Rua Alheia', number: '0', neighborhood: 'N', city: 'S', state: 'BA', zipCode: '0' }
    });

    const response = await request(app)
      .delete(`/addresses/${otherAddr.id}`)
      .set('Cookie', userCookie);

    expect(response.status).toBe(403);
  });
});