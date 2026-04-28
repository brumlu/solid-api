import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('List Users Operations (Integration)', () => {
  let userCookie = [];

  beforeAll(async () => {
    // 1. Limpeza profunda respeitando a integridade referencial
    if (prisma.rolePermission) await prisma.rolePermission.deleteMany();
    await prisma.users.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // 2. Setup de Permissões
    // O seu middleware 'checkPermission' busca por este nome:
    const permission = await prisma.permission.create({
      data: { name: 'USER_READ' }
    });

    // Criamos a role Default e já conectamos a permissão necessária
    await prisma.role.create({
      data: {
        name: 'Default',
        permissions: {
          create: [{ 
            permission: { connect: { id: permission.id } } 
          }]
        }
      }
    });

    // 3. Criar usuários via rota de cadastro 
    // (Garante que o UseCase atribua a role 'Default' automaticamente)
    await request(app).post('/register').send({
      name: 'Luca List',
      email: 'luca.list@teste.com',
      password: 'password123'
    });

    await request(app).post('/register').send({
      name: 'Outro Usuario',
      email: 'outro@teste.com',
      password: 'password123'
    });

    // 4. Login para obter o COOKIE HttpOnly
    const loginRes = await request(app).post('/login').send({
      email: 'luca.list@teste.com',
      password: 'password123'
    });
    
    // Captura o cabeçalho 'set-cookie'
    userCookie = loginRes.header['set-cookie'];
  });

  it('deve ser capaz de listar todos os usuários cadastrados', async () => {
    const response = await request(app)
      .get('/users')
      .set('Cookie', userCookie); // Enviando o cookie em vez do Bearer token

    // Se retornar 403 aqui, verifique se a Role no banco realmente recebeu USER_READ
    expect(response.status).toBe(200);

    // Ajuste conforme o retorno do seu Controller: { users: [...] } ou [...]
    const usersList = Array.isArray(response.body) ? response.body : response.body.users;

    expect(Array.isArray(usersList)).toBe(true);
    expect(usersList.length).toBeGreaterThanOrEqual(2);
    
    // Verificações de Segurança: Senhas NUNCA devem ser listadas
    const firstUser = usersList[0];
    expect(firstUser).not.toHaveProperty('password');
    expect(firstUser).toHaveProperty('email');
    expect(firstUser).toHaveProperty('name');
  });

  it('deve retornar 401 se tentar listar sem o cookie de sessão', async () => {
    const response = await request(app).get('/users');
    
    expect(response.status).toBe(401);
  });
});