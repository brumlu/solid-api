import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Set Default Address (Integration)', () => {
  let userCookie = null;
  let userId = null;
  let addressId = null;

  const testEmail = `luca.${Date.now()}@teste.com`;
  const testPassword = 'password123';

  beforeAll(async () => {
    await prisma.address.deleteMany();
    await prisma.users.deleteMany();
    
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

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

    const addressRes = await request(app)
      .post('/addresses')
      .set('Cookie', userCookie)
      .send({
        street: 'Rua de Salvador',
        number: '123',
        neighborhood: 'Centro',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000-000',
        userId: userId
      });
    
    // Captura flexível do ID
    addressId = addressRes.body.id || addressRes.body.addressId || addressRes.body.address?.id;
  });

  it('deve ser capaz de definir um endereço como padrão', async () => {
    expect(addressId).toBeDefined();

    const response = await request(app)
      .patch('/users/default-address')
      .set('Cookie', userCookie)
      .send({ addressId });

    // Se falhar, logamos o erro para saber se foi "Não pertence" ou "Não encontrado"
    if (response.status !== 200) console.log('ERRO 400:', response.body);

    expect(response.status).toBe(200);

    const userInDb = await prisma.users.findUnique({ where: { id: userId } });
    // Verifique se no seu Prisma Client o campo é defaultAddressId
    expect(userInDb.defaultAddressId).toBe(addressId);
  });

  it('deve retornar 401 se não estiver logado', async () => {
    const response = await request(app)
      .patch('/users/default-address')
      .send({ addressId });
    expect(response.status).toBe(401);
  });

  it('deve impedir uso de endereço de outro usuário', async () => {
    const secondUserRes = await request(app).post('/register').send({
      name: 'Outro',
      email: `outro.${Date.now()}@teste.com`,
      password: testPassword
    });

    const otherAddress = await prisma.address.create({
      data: {
        street: 'Rua de Salvador',
        number: '123',
        neighborhood: 'Centro',
        city: 'Salvador',
        state: 'BA',
        zipCode: '40000-000',
        userId: secondUserRes.body.userId
      }
    });

    const response = await request(app)
      .patch('/users/default-address')
      .set('Cookie', userCookie)
      .send({ addressId: otherAddress.id });

    expect(response.status).toBe(403);
  });

  it('deve retornar 404 para endereço inexistente', async () => {
    const response = await request(app)
      .patch('/users/default-address')
      .set('Cookie', userCookie)
      .send({ addressId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(404);
  });
});