import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'
import Permissions from '../../../model/constants/permissions.js'

describe('Change User Role (Integration)', () => {
  let adminCookie = [];
  let commonCookie = [];
  let commonUserId = null;
  let adminRoleId = null;
  let defaultRoleId = null;

  beforeAll(async () => {
    // 1. Limpeza profunda respeitando a hierarquia de FKs
    await prisma.users.deleteMany();
    
    if (prisma.rolePermission) {
      await prisma.rolePermission.deleteMany();
    } else if (prisma.role_permissions) {
      await prisma.role_permissions.deleteMany();
    }

    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // 2. Criar a permissão mestra
    const permAdmin = await prisma.permission.create({
      data: { name: Permissions.ADMIN_ACCESS }
    });

    // 3. Criar a Role ADMIN vinculando a permissão
    const roleAdmin = await prisma.role.create({
      data: {
        name: 'ADMIN',
        permissions: {
          create: [
            { permissionId: permAdmin.id }
          ]
        }
      }
    });
    adminRoleId = roleAdmin.id;

    // 4. Criar a Role padrão
    const roleDefault = await prisma.role.create({ 
      data: { name: 'Default' } 
    });
    defaultRoleId = roleDefault.id;

    // 5. Criar o usuário Administrador
    const adminReg = await request(app).post('/register').send({
      name: 'Luca Admin',
      email: 'admin.integracao@teste.com',
      password: 'password123'
    });
    
    const adminId = adminReg.body.userId;

    // 6. Promover o usuário para ADMIN no banco
    await prisma.users.update({
      where: { id: adminId },
      data: { roleId: adminRoleId }
    });

    // 7. Login do Admin - Capturando o COOKIE HttpOnly
    const loginRes = await request(app).post('/login').send({
      email: 'admin.integracao@teste.com',
      password: 'password123'
    });
    
    adminCookie = loginRes.header['set-cookie'];

    // 8. Criar o usuário comum (o alvo)
    const userRes = await request(app).post('/register').send({
      name: 'Usuário Alvo',
      email: 'alvo@teste.com',
      password: 'password123'
    });
    
    commonUserId = userRes.body.userId;

    await prisma.users.update({
      where: { id: commonUserId },
      data: { roleId: defaultRoleId }
    });

    // Login do usuário comum para testar acesso negado depois
    const loginCommon = await request(app).post('/login').send({
      email: 'alvo@teste.com',
      password: 'password123'
    });
    commonCookie = loginCommon.header['set-cookie'];
  });

  it('deve permitir que um administrador altere a role de outro usuário', async () => {
    const response = await request(app)
      .patch(`/role-update/${commonUserId}`) 
      .set('Cookie', adminCookie) // Enviando cookie de admin
      .send({
        roleId: adminRoleId 
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);

    // Verificação no banco
    const updatedUser = await prisma.users.findUnique({
      where: { id: commonUserId }
    });
    expect(updatedUser.roleId).toBe(adminRoleId);
  });

  it('deve impedir que um usuário sem privilégios tente alterar a própria role (403)', async () => {
    // Voltamos ele para Default para o teste de segurança
    await prisma.users.update({
      where: { id: commonUserId },
      data: { roleId: defaultRoleId }
    });

    // Tentativa de auto-promoção usando o cookie de usuário comum
    const response = await request(app)
      .patch(`/role-update/${commonUserId}`)
      .set('Cookie', commonCookie) 
      .send({ roleId: adminRoleId });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/negado|privilégio/i);
  });

  it('deve impedir que um usuário sem cookie de autenticação acesse a rota (401)', async () => {
    const response = await request(app)
      .patch(`/role-update/${commonUserId}`)
      .send({ roleId: adminRoleId });

    expect(response.status).toBe(401);
  });
});