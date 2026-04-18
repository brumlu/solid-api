import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Delete User (Integration)', () => {
  let userToken = '';
  let userId = null;

  const userToDelete = {
    name: 'User To Delete',
    email: 'delete@teste.com',
    password: 'password123'
  };

  beforeAll(async () => {
    // 1. Limpeza respeitando restrições (se houver role_permissions)
    if (prisma.rolePermission) await prisma.rolePermission.deleteMany();
    await prisma.users.deleteMany();

    // 2. Garante a Role
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 3. Cadastra o usuário
    const registerRes = await request(app).post('/register').send(userToDelete);
    
    // De acordo com seu PublicUserController, a chave retornada é userId
    userId = registerRes.body.userId;

    // 4. Obtém o token
    const loginRes = await request(app).post('/login').send({
      email: userToDelete.email,
      password: userToDelete.password
    });
    userToken = loginRes.body.token;
  });

  it('deve ser capaz de deletar o próprio usuário usando o ID na rota', async () => {
    // Verifique se no seu routes.js o caminho é este mesmo
    const response = await request(app)
      .delete(`/users/${userId}`) 
      .set('Authorization', `Bearer ${userToken}`);

    // Seu PrivateUserController retorna 200
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

    // Como o usuário sumiu, cai no InvalidCredentialsError (401)
    expect(response.status).toBe(401);
  });

  it('deve garantir que o usuário realmente sumiu do banco de dados', async () => {
    const userInDb = await prisma.users.findUnique({
      where: { id: Number(userId) }
    });

    expect(userInDb).toBeNull();
  });

  it('deve retornar 403 se um usuário tentar deletar outro', async () => {
    // 1. Criar um usuário "Intruso"
    const intruderRes = await request(app).post('/register').send({
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

    // 3. Login do Intruso
    const loginIntruder = await request(app).post('/login').send({
      email: 'intruder@teste.com',
      password: 'password123'
    });
    const intruderToken = loginIntruder.body.token;

    // 4. Intruso tenta deletar a Vítima
    const response = await request(app)
      .delete(`/users/${victimId}`)
      .set('Authorization', `Bearer ${intruderToken}`);

    // O middleware isOwnerOrAdmin deve barrar
    expect(response.status).toBe(403);
  });
});