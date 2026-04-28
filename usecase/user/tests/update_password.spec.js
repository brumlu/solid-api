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
    // 1. Limpeza total
    await prisma.users.deleteMany();

    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 2. Cadastra o usuário com a senha inicial
    const registerRes = await request(app).post('/register').send({
      name: userCredentials.name,
      email: userCredentials.email,
      password: userCredentials.oldPassword
    });

    userId = registerRes.body.userId;

    // 3. Login inicial para obter o Cookie HttpOnly
    const loginRes = await request(app).post('/login').send({
      email: userCredentials.email,
      password: userCredentials.oldPassword
    });
    
    // Captura o cabeçalho 'set-cookie' (api_token)
    userCookie = loginRes.header['set-cookie'];
  });

  it('deve ser capaz de alterar a própria senha usando o ID na rota', async () => {
    const response = await request(app)
      .patch(`/password-update/${userId}`) 
      .set('Cookie', userCookie) // Enviando o cookie api_token
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
    
    // Verifica se o cookie api_token foi enviado na resposta
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
    // 1. Criar um segundo usuário (Vítima)
    const secondUser = await request(app).post('/register').send({
      name: 'Vítima',
      email: 'vitima@teste.com',
      password: 'password123'
    });
    const secondUserId = secondUser.body.userId;

    // 2. O usuário "Luca" tenta mudar a senha da "Vítima" enviando o SEU cookie
    const response = await request(app)
      .patch(`/password-update/${secondUserId}`)
      .set('Cookie', userCookie)
      .send({ password: 'hackedPassword' });

    // O middleware de autorização (isOwnerOrAdmin) deve barrar
    expect(response.status).toBe(403);
  });
});