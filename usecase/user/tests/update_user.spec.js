import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Update User (Integration)', () => {
  let userCookie = [];
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
    await prisma.users.deleteMany();
    
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    const registerRes = await request(app)
      .post('/register')
      .send(originalUser);
    
    userId = registerRes.body.userId;

    const loginRes = await request(app)
      .post('/login')
      .send({
        email: originalUser.email,
        password: originalUser.password
      });

    userCookie = loginRes.header['set-cookie'];
  });

  it('deve ser capaz de atualizar os próprios dados usando PATCH', async () => {
    const response = await request(app)
      .patch(`/users-update/${userId}`) 
      .set('Cookie', userCookie)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('deve garantir que o nome e e-mail foram alterados no banco', async () => {
    const userInDb = await prisma.users.findUnique({
      where: { id: userId }
    });

    expect(userInDb.name).toBe(updatedData.name);
    expect(userInDb.email).toBe(updatedData.email);
  });

  it('deve bloquear a atualização se o usuário tentar atualizar outro ID', async () => {
    const secondUserRes = await request(app).post('/register').send({
      name: 'Outro Usuario',
      email: 'outro.cara@teste.com',
      password: 'password123'
    });
    const secondUserId = secondUserRes.body.userId;

    const response = await request(app)
      .patch(`/users-update/${secondUserId}`)
      .set('Cookie', userCookie)
      .send({ 
        name: 'Tentativa Hacker', 
        email: 'hacker@email.com' 
      });

    expect(response.status).toBe(403);
  });

  it('deve retornar 401 para requisições sem o cookie de sessão', async () => {
    const response = await request(app)
      .patch(`/users-update/${userId}`)
      .send(updatedData);

    expect(response.status).toBe(401);
  });

  it('deve retornar erro se tentar atualizar um usuário que não existe', async () => {
    const response = await request(app)
      .patch('/users-update/00000000-0000-0000-0000-000000000000')
      .set('Cookie', userCookie)
      .send({ 
        name: 'Usuario Inexistente', 
        email: 'inexistente@email.com' 
      });

    expect([403, 404]).toContain(response.status);
  });
});