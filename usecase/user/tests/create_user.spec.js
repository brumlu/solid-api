import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Create User (Integration)', () => {
  
  beforeAll(async () => {
    await prisma.users.deleteMany();
    await prisma.role.upsert({
      where: { name: 'Default' },
      update: {},
      create: { name: 'Default' }
    });
  });

  const newUser = {
    name: 'Luca Costa',
    email: 'luca.create@teste.com',
    password: 'password123'
  };

  it('deve ser capaz de cadastrar um novo usuário', async () => {
    const response = await request(app)
      .post('/register')
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(response.body.message).toMatch(/sucesso/i);

  });

  it('não deve cadastrar um email que já existe no sistema', async () => {
    // Tenta cadastrar o mesmo usuário (newUser) que foi criado no teste anterior
    const response = await request(app)
      .post('/register')
      .send(newUser);

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/email já está em uso|conflito/i);
  });

  it('não deve cadastrar com dados inválidos (ex: email mal formatado)', async () => {
    const response = await request(app)
      .post('/register')
      .send({ 
        name: 'Luca',
        email: 'email-invalido', 
        password: '123' 
      });

    // O validador Zod deve retornar 400 (Bad Request)
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details'); // Detalhes do erro de validação
  });

  it('deve verificar se a senha foi armazenada com hash no banco de dados', async () => {
    const userInDb = await prisma.users.findUnique({
      where: { email: newUser.email }
    });

    expect(userInDb).not.toBeNull();
    // A senha não deve ser igual a 'password123'
    expect(userInDb.password).not.toBe(newUser.password);
    // Verifica se parece um hash
    expect(userInDb.password).toMatch(/^\$2[ayb]\$.{56}$/);
  });
});