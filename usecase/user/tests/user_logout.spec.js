import { it, describe, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../../cmd/main.js';
import prisma from '../../../infra/database/prisma.js';

describe('Logout Operation (Integration)', () => {
  let userCookie;

  beforeAll(async () => {
    // 1. Limpeza do banco para garantir ambiente isolado
    await prisma.users.deleteMany();
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 2. Criar o usuário para o teste (IMPORTANTE: Sem isso o login falha)
    await request(app).post('/register').send({
      name: 'Luca Logout',
      email: 'luca.logout@teste.com',
      password: 'password123'
    });

    // 3. Faz login para obter o cookie 'api_token'
    const loginRes = await request(app).post('/login').send({
      email: 'luca.logout@teste.com',
      password: 'password123'
    });
    
    userCookie = loginRes.header['set-cookie'];

    // Verificação de segurança para o teste não quebrar com 'undefined'
    if (!userCookie) {
      throw new Error('Falha ao obter cookie de login. Verifique se o LoginController está enviando api_token.');
    }
  });

  it('deve limpar o cookie de autenticação ao fazer logout', async () => {
    const response = await request(app)
      .post('/logout')
      .set('Cookie', userCookie); // Agora userCookie está garantido

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);

    // 4. Verificamos se o cabeçalho 'set-cookie' contém a instrução de expiração
    const setCookieHeader = response.header['set-cookie'];
    expect(setCookieHeader).toBeDefined();

    const logoutCookie = setCookieHeader.find(c => c.includes('api_token=;'));
    
    // O navegador deleta o cookie se a data for 1970 (Epoch)
    expect(logoutCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(logoutCookie).toMatch(/api_token=;/); 
  });

  it('não deve permitir acessar uma rota privada após o logout', async () => {
    // 1. Fazemos o logout
    const logoutRes = await request(app)
      .post('/logout')
      .set('Cookie', userCookie);
    
    // Pegamos o cookie de "expiração" que o logout enviou
    const expiredCookie = logoutRes.header['set-cookie'];

    // 2. Tentamos acessar a listagem de usuários com o cookie expirado
    const response = await request(app)
      .get('/users')
      .set('Cookie', expiredCookie);

    expect(response.status).toBe(401);
  });
});