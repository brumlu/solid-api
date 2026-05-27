import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Login Operations (Integration)', () => {
  const loginUser = {
    name: 'Luca Login',
    email: 'login@teste.com',
    password: 'password123'
  };

  beforeAll(async () => {
    await prisma.users.deleteMany();

    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    await request(app)
      .post('/register')
      .send(loginUser);
  });

  it('deve ser capaz de autenticar um usuário e receber um cookie HttpOnly', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: loginUser.email,
        password: loginUser.password
      });

    expect(response.status).toBe(200);

    expect(response.body.token).toBeUndefined();

    const cookies = response.header['set-cookie'];
    expect(cookies).toBeDefined();

    const authCookie = cookies.find(cookie => cookie.includes('api_token'));
    expect(authCookie).toBeDefined();
    expect(authCookie).toMatch(/HttpOnly/);
    expect(authCookie).toMatch(/Path=\//);

    expect(authCookie).toMatch(/api_token=ey/);
  });

  it('não deve logar com uma senha incorreta', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: loginUser.email,
        password: 'senha_errada'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inválid/i); 

    expect(response.header['set-cookie']).toBeUndefined();
  });

  it('não deve logar com um e-mail que não existe no sistema', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'naoexiste@teste.com',
        password: 'password123'
      });

    expect(response.status).toBe(401);
    expect(response.header['set-cookie']).toBeUndefined();
  });

  it('deve retornar erro 400 se o corpo da requisição estiver incompleto', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: loginUser.email });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details');
  });
});