import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Create User (Integration)', () => {
  
  beforeAll(async () => {
    // 1. Limpeza total de usuários para evitar conflito entre execuções
    await prisma.users.deleteMany();
    
    // 2. Garante a Role Default (essencial para o repository não quebrar)
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

    // Com o novo padrão, o sucesso deve ser sempre 201 (Created)
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('não deve cadastrar um email que já existe no sistema', async () => {
    // Tenta cadastrar o mesmo usuário novamente
    const response = await request(app)
      .post('/register')
      .send(newUser);

    // O ErrorHandler agora mapeia UserAlreadyExistsError para 409 (Conflict)
    // Se o seu código usa 400, mude para .toBe(400)
    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Este email já está em uso.');
  });

  it('não deve cadastrar com dados inválidos (ex: email mal formatado)', async () => {
    const response = await request(app)
      .post('/register')
      .send({ 
        name: 'Luca',
        email: 'email-invalido', 
        password: '123' 
      });

    // O validador Zod deve retornar 400
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('details'); // Verifica se os detalhes do Zod estão vindo
  });
});