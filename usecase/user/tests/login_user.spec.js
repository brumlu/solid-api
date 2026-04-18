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
    // 1. Limpeza do banco
    await prisma.users.deleteMany();

    // 2. Garante a Role Default
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });

    // 3. Cadastra o usuário via rota oficial para garantir o hash da senha
    await request(app)
      .post('/register')
      .send(loginUser);
  });

  it('deve ser capaz de autenticar um usuário e receber um token JWT', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: loginUser.email,
        password: loginUser.password
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    // Verifica se o token parece um JWT válido
    expect(response.body.token).toMatch(/^ey/);
  });

  it('não deve logar com uma senha incorreta', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: loginUser.email,
        password: 'senha_errada'
      });

    // O ErrorHandler deve retornar 401 (Unauthorized)
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inválid/i); 
    expect(response.body.token).toBeUndefined();
  });

  it('não deve logar com um e-mail que não existe no sistema', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'naoexiste@teste.com',
        password: 'password123'
      });

    // Segurança: Retornamos 401 mesmo se o e-mail não existir para evitar enumeração de usuários
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inválid/i);
  });

  it('deve retornar erro 400 se o corpo da requisição estiver incompleto', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: loginUser.email }); // Faltando password

    // Aqui o seu Middleware de Validação (Zod) deve atuar
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details'); // O mapeamento amigável que fizemos no validator.js
  });
});