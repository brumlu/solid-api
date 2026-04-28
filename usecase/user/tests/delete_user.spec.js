import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Delete User (Integration)', () => {
  let userCookie = [];
  let userId = null;

  const userToDelete = {
    name: 'User To Delete',
    email: 'delete@teste.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // 1. Limpeza total respeitando a hierarquia
    if (prisma.rolePermission) await prisma.rolePermission.deleteMany();
    await prisma.users.deleteMany();

    // 2. Garante a Role Default
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 3. Cadastra o usuário alvo
    const registerRes = await request(app).post('/register').send(userToDelete);
    userId = registerRes.body.userId;

    // 4. Obtém o Cookie HttpOnly via Login
    const loginRes = await request(app).post('/login').send({
      email: userToDelete.email,
      password: userToDelete.password
    });
    
    userCookie = loginRes.header['set-cookie'];
  });

  it('deve ser capaz de deletar o próprio usuário usando o ID na rota', async () => {
    const response = await request(app)
      .delete(`/users/${userId}`) 
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('NÃO deve ser capaz de logar após a conta ser deletada', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: userToDelete.email,
        password: userToDelete.password
      });

    // Usuário não existe mais, deve retornar 401
    expect(response.status).toBe(401);
  });

  it('deve garantir que o usuário realmente sumiu do banco de dados', async () => {
    const userInDb = await prisma.users.findUnique({
      where: { id: userId }
    });

    expect(userInDb).toBeNull();
  });

  it('deve retornar 403 se um usuário tentar deletar outro (Segurança)', async () => {
    // 1. Criar um usuário "Intruso"
    await request(app).post('/register').send({
      name: 'Intruso',
      email: 'intruder@teste.com',
      password: 'password123'
    });
    
    // 2. Criar uma "Vítima"
    const victimRes = await request(app).post('/register').send({
      name: 'Vítima',
      email: 'victim@teste.com',
      password: 'password123'
    });
    const victimId = victimRes.body.userId;

    // 3. Login do Intruso para pegar o cookie dele
    const loginIntruder = await request(app).post('/login').send({
      email: 'intruder@teste.com',
      password: 'password123'
    });
    const intruderCookie = loginIntruder.header['set-cookie'];

    // 4. Intruso tenta deletar a Vítima enviando o PRÓPRIO cookie
    const response = await request(app)
      .delete(`/users/${victimId}`)
      .set('Cookie', intruderCookie);

    // O middleware de propriedade (isOwnerOrAdmin) deve barrar com 403
    expect(response.status).toBe(403);
  });
});