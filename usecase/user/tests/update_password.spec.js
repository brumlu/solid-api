import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Update Password (Integration)', () => {
  let userToken = '';
  let userId = null;

  const userCredentials = {
    name: 'Luca Update',
    email: 'update@teste.com',
    oldPassword: 'password123',
    newPassword: 'newPassword456'
  };

  beforeAll(async () => {
    // 1. Limpeza
    await prisma.users.deleteMany();

    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 2. Cadastra o usuário com a senha inicial
    const registerRes = await request(app).post('/cadastro').send({
      name: userCredentials.name,
      email: userCredentials.email,
      password: userCredentials.oldPassword
    });

    // Captura o userId do corpo da resposta
    userId = registerRes.body.userId;

    // 3. Login inicial para obter o token de autorização
    const loginRes = await request(app).post('/login').send({
      email: userCredentials.email,
      password: userCredentials.oldPassword
    });
    userToken = loginRes.body.token;
  });

  it('deve ser capaz de alterar a própria senha usando o ID na rota', async () => {
    const response = await request(app)
      .patch(`/atualizar-senha/${userId}`) 
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        // Verifique se o seu DTO/Zod espera "password"
        password: userCredentials.newPassword 
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('deve conseguir logar com a nova senha', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: userCredentials.email,
        password: userCredentials.newPassword
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('NÃO deve conseguir logar com a senha antiga', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: userCredentials.email,
        password: userCredentials.oldPassword
      });

    // O ErrorHandler deve garantir o 401 para credenciais inválidas
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inválid/i);
  });

  it('deve retornar 403 se tentar alterar a senha de outro usuário', async () => {
    // 1. Criar um segundo usuário
    const secondUser = await request(app).post('/cadastro').send({
      name: 'Vítima',
      email: 'vitima@teste.com',
      password: 'password123'
    });
    const secondUserId = secondUser.body.userId;

    // 2. O usuário "Luca" tenta mudar a senha da "Vítima"
    const response = await request(app)
      .patch(`/atualizar-senha/${secondUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ password: 'hackedPassword' });

    // O middleware isOwnerOrAdmin deve barrar com 403
    expect(response.status).toBe(403);
  });
});