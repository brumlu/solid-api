import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../cmd/main.js' 
import prisma from '../infra/database/prisma.js'

describe('Create User (Integration)', () => {
  
  // Limpa os registros antes de cada bateria de testes
  beforeAll(async () => {
    await prisma.users.deleteMany();
  });

  it('deve ser capaz de cadastrar um novo usuário', async () => {
    const response = await request(app)
      .post('/cadastro')
      .send({
        name: 'Luca Costa',
        email: 'lucacosta@teste.com',
        password: 'password123'
      });

    // Valida o status de criação
    expect(response.status).toBe(201);
    
    // Valida o formato da resposta que sua API envia
    expect(response.body).toMatchObject({
      message: "Usuário cadastrado com sucesso",
      userId: expect.any(Number) 
    });
  });

  it('não deve ser capaz de cadastrar um email duplicado', async () => {
    const userData = {
      name: 'Luca Costa',
      email: 'duplicado@teste.com',
      password: 'password123'
    };

    // Primeiro cadastro (sucesso)
    await request(app).post('/cadastro').send(userData);

    // Segundo cadastro (tentativa com mesmo email)
    const response = await request(app)
      .post('/cadastro')
      .send(userData);

    // Verifica se a API barrou a duplicidade (400 ou 409)
    expect(response.status).toBe(400);
  });
});