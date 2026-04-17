import prisma from '../infra/database/prisma.js'; 
import { User } from '../model/entities/User.js'; 

export class UserRepository {
  
  // Transforma o objeto do Prisma em uma Entidade de Domínio
  #mapToEntity(userData) {
    if (!userData) return null;
    return new User({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      roleId: userData.roleId,
      createdAt: userData.createdAt
    });
  }

  async findByEmail(email) {
    const userData = await prisma.users.findUnique({ where: { email } });
    return this.#mapToEntity(userData);
  }

  async findByEmailWithPermissions(email) {
    const userData = await prisma.users.findUnique({
      where: { email },
      include: { 
        role: { 
          include: { permissions: { include: { permission: true } } }
        } 
      }
    });

    if (!userData) return null;

    const permissionsNames = userData.role?.permissions.map(
      (rp) => rp.permission.name
    ) || [];

    return {
      user: this.#mapToEntity(userData),
      permissions: permissionsNames
    };
  }

  async create(userEntity) {
    const createdUser = await prisma.users.create({
      data: {
        email: userEntity.email,
        name: userEntity.name,
        password: userEntity.password,
        role: { connect: { name: 'Default' } } 
      },
    });

    return this.#mapToEntity(createdUser);
  }

  async findAll() {
    const users = await prisma.users.findMany();
    return users.map(user => this.#mapToEntity(user));
  }

  async update(id, data) {
    // Garantindo que o ID seja um número, vindo da rota como string
    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data
    });
    return this.#mapToEntity(updatedUser);
  }

  async delete(id) {
    const deletedUser = await prisma.users.delete({
      where: { id: Number(id) }
    });
    return this.#mapToEntity(deletedUser);
  }

  async findRoleByName(name) {
    return await prisma.role.findUnique({ where: { name } });
  }
}