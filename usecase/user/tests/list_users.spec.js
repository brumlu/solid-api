import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'

describe('List Users Operations (Integration)', () => {
  let userCookie = [];

  beforeAll(async () => {
    if (prisma.rolePermission) await prisma.rolePermission.deleteMany();
    await prisma.users.deleteMany();
    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    const permission = await prisma.permission.create({
      data: { name: 'USER_READ' }
    });

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

    const loginRes = await request(app).post('/login').send({
      email: 'luca.list@teste.com',
      password: 'password123'
    });

    userCookie = loginRes.header['set-cookie'];
  });

  it('deve ser capaz de listar todos os usuários cadastrados', async () => {
    const response = await request(app)
      .get('/users')
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);

    const usersList = Array.isArray(response.body) ? response.body : response.body.users;

    expect(Array.isArray(usersList)).toBe(true);
    expect(usersList.length).toBeGreaterThanOrEqual(2);

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