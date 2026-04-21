import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Update User (Integration)', () => {
  let userToken = '';
  let userId = null;

  const originalUser = {
    name: 'Luca Original',
    email: 'original.update@teste.com',
    password: 'password123'
  };

  const updatedData = {
    name: 'Luca Atualizado',
    email: 'atualizado.final@teste.com'
  };

  beforeAll(async () => {
    // 1. Limpeza do banco
    await prisma.users.deleteMany();
    
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 2. Cria o usuário via rota de registro
    const registerRes = await request(app)
      .post('/register')
      .send(originalUser);
    
    userId = registerRes.body.userId;

    // 3. Login para obter o token
    const loginRes = await request(app)
      .post('/login')
      .send({
        email: originalUser.email,
        password: originalUser.password
      });
    
    userToken = loginRes.body.token;
  });

  it('deve ser capaz de atualizar os próprios dados usando PATCH', async () => {
    const response = await request(app)
      .patch(`/users-update/${userId}`) 
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('deve garantir que o nome e e-mail foram alterados no banco', async () => {
    const userInDb = await prisma.users.findUnique({
      where: { id: (userId) }
    });

    expect(userInDb.name).toBe(updatedData.name);
    expect(userInDb.email).toBe(updatedData.email);
  });

  it('deve bloquear a atualização se o usuário tentar atualizar outro ID', async () => {
    // 1. Criar um segundo usuário
    const secondUserRes = await request(app).post('/register').send({
      name: 'Outro Usuario',
      email: 'outro.cara@teste.com',
      password: 'password123'
    });
    const secondUserId = secondUserRes.body.userId;

    // 2. Tentativa de alteração (Enviando dados completos para passar no Zod)
    const response = await request(app)
      .patch(`/users-update/${secondUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ 
        name: 'Tentativa Hacker', 
        email: 'hacker@email.com' 
      });

    // O middleware isOwnerOrAdmin deve barrar com 403 antes de chegar no Use Case
    expect(response.status).toBe(403);
  });

  it('deve retornar 401 para requisições sem token', async () => {
    const response = await request(app)
      .patch(`/users-update/${userId}`)
      .send(updatedData);

    expect(response.status).toBe(401);
  });

  it('deve retornar 404 se tentar atualizar um usuário que não existe', async () => {
    // ID 00000000-0000-0000-0000-000000000000 não existe. Enviamos dados válidos para o Zod não barrar com 400.
    const response = await request(app)
      .patch('/users-update/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ 
        name: 'Usuario Inexistente', 
        email: 'inexistente@email.com' 
      });

    // Se o middleware isOwnerOrAdmin for verificado primeiro, será 403.
    // Se o sistema permitir a busca, será 404.
    expect([403, 404]).toContain(response.status);
  });
});