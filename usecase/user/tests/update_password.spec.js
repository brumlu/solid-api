import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Update Password (Integration)', () => {
  let userCookie = [];
  let userId = null;

  const userCredentials = {
    name: 'Luca Update',
    email: 'update@teste.com',
    oldPassword: 'password123',
    newPassword: 'newPassword456'
  };

  beforeAll(async () => {
    await prisma.users.deleteMany();

    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    const registerRes = await request(app).post('/register').send({
      name: userCredentials.name,
      email: userCredentials.email,
      password: userCredentials.oldPassword
    });

    userId = registerRes.body.userId;

    const loginRes = await request(app).post('/login').send({
      email: userCredentials.email,
      password: userCredentials.oldPassword
    });

    userCookie = loginRes.header['set-cookie'];
  });

  it('deve ser capaz de alterar a própria senha usando o ID na rota', async () => {
    const response = await request(app)
      .patch(`/password-update/${userId}`) 
      .set('Cookie', userCookie)
      .send({
        password: userCredentials.newPassword 
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('deve conseguir logar com a nova senha e receber novo cookie', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: userCredentials.email,
        password: userCredentials.newPassword
      });

    expect(response.status).toBe(200);

    const cookies = response.header['set-cookie'];
    expect(cookies.find(c => c.includes('api_token'))).toBeDefined();
  });

  it('NÃO deve conseguir logar com a senha antiga', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: userCredentials.email,
        password: userCredentials.oldPassword
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inválid/i);
  });

  it('deve retornar 403 se tentar alterar a senha de outro usuário (Segurança)', async () => {
    const secondUser = await request(app).post('/register').send({
      name: 'Vítima',
      email: 'vitima@teste.com',
      password: 'password123'
    });
    const secondUserId = secondUser.body.userId;

    const response = await request(app)
      .patch(`/password-update/${secondUserId}`)
      .set('Cookie', userCookie)
      .send({ password: 'hackedPassword' });

    expect(response.status).toBe(403);
  });
});