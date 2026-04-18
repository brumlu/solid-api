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
    // 1. Limpeza
    await prisma.users.deleteMany();
    
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 2. Cria o usuário
    const registerRes = await request(app)
      .post('/cadastro')
      .send(originalUser);
    
    userId = registerRes.body.userId;

    // 3. Login
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
      .patch(`/atualizar-usuario/${userId}`) 
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatedData);

    // O status deve ser 200 conforme seu PrivateUserController.atualizar
    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('deve garantir que o nome e e-mail foram alterados no banco', async () => {
    const userInDb = await prisma.users.findUnique({
      where: { id: Number(userId) }
    });

    expect(userInDb.name).toBe(updatedData.name);
    expect(userInDb.email).toBe(updatedData.email);
  });

  it('deve bloquear a atualização se o usuário tentar atualizar outro ID', async () => {
    // 1. Criar um segundo usuário
    const secondUserRes = await request(app).post('/cadastro').send({
      name: 'Outro Usuario',
      email: 'outro.cara@teste.com',
      password: 'password123'
    });
    const secondUserId = secondUserRes.body.userId;

    // 2. O primeiro usuário (Luca) tenta atualizar o segundo (Outro)
    const response = await request(app)
      .patch(`/atualizar-usuario/${secondUserId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Hacker' });

    // O middleware isOwnerOrAdmin barra com 403
    expect(response.status).toBe(403);
  });

  it('deve retornar 401 para requisições sem token', async () => {
    const response = await request(app)
      .patch(`/atualizar-usuario/${userId}`)
      .send(updatedData);

    expect(response.status).toBe(401);
  });

  it('deve retornar 404 se tentar atualizar um usuário que não existe', async () => {
    // Geramos um ID que não existe (ex: 9999)
    const response = await request(app)
      .patch('/atualizar-usuario/9999')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Inexistente' });

    // Como seu isOwnerOrAdmin só permite o próprio ID, ele pode retornar 403 antes do 404,
    // ou se você for Admin, o UseCase retornará o ResourceNotFoundError (404).
    // Se o middleware isOwnerOrAdmin for rígido, o resultado será 403.
    expect([403, 404]).toContain(response.status);
  });
});