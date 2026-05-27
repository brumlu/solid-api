import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Logout Operation (Integration)', () => {
  let userCookie;

  beforeAll(async () => {
    await prisma.users.deleteMany();
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    await request(app).post('/register').send({
      name: 'Luca Logout',
      email: 'luca.logout@teste.com',
      password: 'password123'
    });

    const loginRes = await request(app).post('/login').send({
      email: 'luca.logout@teste.com',
      password: 'password123'
    });
    
    userCookie = loginRes.header['set-cookie'];

    if (!userCookie) {
      throw new Error('Falha ao obter cookie de login. Verifique se o LoginController está enviando api_token.');
    }
  });

  it('deve limpar o cookie de autenticação ao fazer logout', async () => {
    const response = await request(app)
      .post('/logout')
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);

    const setCookieHeader = response.header['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    const logoutCookie = setCookieHeader.find(c => c.includes('api_token=;'));

    expect(logoutCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(logoutCookie).toMatch(/api_token=;/); 
  });

  it('não deve permitir acessar uma rota privada após o logout', async () => {
    const logoutRes = await request(app)
      .post('/logout')
      .set('Cookie', userCookie);

    const expiredCookie = logoutRes.header['set-cookie'];

    const response = await request(app)
      .get('/users')
      .set('Cookie', expiredCookie);

    expect(response.status).toBe(401);
  });
});