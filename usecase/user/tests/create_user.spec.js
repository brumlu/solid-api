import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('Create User (Integration)', () => {
  
  beforeAll(async () => {
    // 1. Limpeza total de usuários para evitar conflito entre execuções
    // Ordem: Deletar usuários primeiro devido a possíveis vínculos
    await prisma.users.deleteMany();
    
    // 2. Garante a Role Default (essencial para o repository não quebrar)
    // Usamos upsert para evitar erro de duplicidade caso a role já exista
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

    // Sucesso deve ser 201 (Created)
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('userId');
    expect(response.body.message).toMatch(/sucesso/i);

    /* Se o sistema logar o usuário automaticamente após o registro,
       descomente a linha abaixo para verificar se o cookie foi enviado:
       expect(response.header['set-cookie']).toBeDefined();
    */
  });

  it('não deve cadastrar um email que já existe no sistema', async () => {
    // Tenta cadastrar o mesmo usuário (newUser) que foi criado no teste anterior
    const response = await request(app)
      .post('/register')
      .send(newUser);

    // O ErrorHandler deve mapear UserAlreadyExists para 409 (Conflict)
    // Se o seu middleware retorna 400, altere para .toBe(400)
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
    // Verifica se parece um hash (geralmente começa com $2b$ ou similar do bcrypt)
    expect(userInDb.password).toMatch(/^\$2[ayb]\$.{56}$/);
  });
});