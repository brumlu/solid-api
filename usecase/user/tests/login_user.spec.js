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

  it('deve ser capaz de autenticar um usuário e receber um cookie HttpOnly', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: loginUser.email,
        password: loginUser.password
      });

    expect(response.status).toBe(200);
    
    // 1. O corpo da resposta NÃO deve mais conter o token (por segurança)
    expect(response.body.token).toBeUndefined();

    // 2. Verificamos se o cookie foi enviado no cabeçalho
    const cookies = response.header['set-cookie'];
    expect(cookies).toBeDefined();

    // 3. Validamos se o cookie específico 'api_token' está lá e contém as flags
    const authCookie = cookies.find(cookie => cookie.includes('api_token'));
    expect(authCookie).toBeDefined();
    expect(authCookie).toMatch(/HttpOnly/);
    expect(authCookie).toMatch(/Path=\//);
    
    // Verifica se o valor do token dentro do cookie começa com o padrão JWT (ey...)
    expect(authCookie).toMatch(/api_token=ey/);
  });

  it('não deve logar com uma senha incorreta', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: loginUser.email,
        password: 'senha_errada'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/inválid/i); 
    
    // Garante que o cookie NÃO foi enviado em caso de falha
    expect(response.header['set-cookie']).toBeUndefined();
  });

  it('não deve logar com um e-mail que não existe no sistema', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'naoexiste@teste.com',
        password: 'password123'
      });

    // Segurança: 401 para evitar enumeração de e-mails
    expect(response.status).toBe(401);
    expect(response.header['set-cookie']).toBeUndefined();
  });

  it('deve retornar erro 400 se o corpo da requisição estiver incompleto', async () => {
    const response = await request(app)
      .post('/login')
      .send({ email: loginUser.email });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details');
  });
});