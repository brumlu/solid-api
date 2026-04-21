import { it, describe, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../../cmd/main.js'
import prisma from '../../../infra/database/prisma.js'
import Permissions from '../../../model/constants/permissions.js'

describe('Change User Role (Integration)', () => {
  let adminToken = '';
  let commonUserId = null;
  let adminRoleId = null;
  let defaultRoleId = null;

  beforeAll(async () => {
    // 1. Limpeza profunda respeitando a hierarquia de FKs
    await prisma.users.deleteMany();
    
    // De acordo com o mapeamento do Prisma para tabelas com snake_case
    if (prisma.rolePermission) {
      await prisma.rolePermission.deleteMany();
    } else if (prisma.role_permissions) {
      await prisma.role_permissions.deleteMany();
    }

    await prisma.permission.deleteMany();
    await prisma.role.deleteMany();

    // 2. Criar a permissão mestra exigida pelo seu middleware
    const permAdmin = await prisma.permission.create({
      data: { name: Permissions.ADMIN_ACCESS }
    });

    // 3. Criar a Role ADMIN vinculando a permissão
    // O Prisma mapeou a relação role_permissions para o nome 'permissions'
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

    // 5. Criar o usuário Administrador para o teste
    const adminReg = await request(app).post('/register').send({
      name: 'Luca Admin',
      email: 'admin.integracao@teste.com',
      password: 'password123'
    });
    
    const adminId = adminReg.body.userId;

    // 6. Promover o usuário para ADMIN no banco de dados
    await prisma.users.update({
      where: { id: (adminId) },
      data: { roleId: adminRoleId }
    });

    // 7. Login do Admin (Gera o token com ['ADMIN_ACCESS'])
    const loginRes = await request(app).post('/login').send({
      email: 'admin.integracao@teste.com',
      password: 'password123'
    });
    
    adminToken = loginRes.body.token;

    // 8. Criar o usuário comum que terá a role alterada (o alvo)
    const userRes = await request(app).post('/register').send({
      name: 'Usuário Alvo',
      email: 'alvo@teste.com',
      password: 'password123'
    });
    
    commonUserId = userRes.body.userId;

    // Garantir que ele seja 'Default'
    await prisma.users.update({
      where: { id: (commonUserId) },
      data: { roleId: defaultRoleId }
    });
  });

  it('deve permitir que um administrador altere a role de outro usuário', async () => {
    const response = await request(app)
      .patch(`/role-update/${commonUserId}`) 
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        roleId: adminRoleId 
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/sucesso/i);
  });

  it('deve verificar no banco de dados se a role do usuário foi realmente alterada', async () => {
    const updatedUser = await prisma.users.findUnique({
      where: { id: (commonUserId) }
    });

    expect(updatedUser.roleId).toBe(adminRoleId);
  });

  it('deve impedir que um usuário comum tente alterar a própria role (403)', async () => {
    // Primeiro voltamos o usuário para Default para garantir o teste de segurança
    await prisma.users.update({
      where: { id: (commonUserId) },
      data: { roleId: defaultRoleId }
    });

    // Login do usuário comum
    const loginCommon = await request(app).post('/login').send({
      email: 'alvo@teste.com',
      password: 'password123'
    });
    const commonToken = loginCommon.body.token;

    // Tentativa de auto-promoção: Deve ser barrado pelo middleware
    const response = await request(app)
      .patch(`/role-update/${commonUserId}`)
      .set('Authorization', `Bearer ${commonToken}`)
      .send({ roleId: adminRoleId });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/negado|privilégio/i);
  });

  it('deve impedir que um usuário sem token acesse a rota (401)', async () => {
    const response = await request(app)
      .patch(`/role-update/${commonUserId}`)
      .send({ roleId: adminRoleId });

    expect(response.status).toBe(401);
  });
});