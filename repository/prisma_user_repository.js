// 1. Corrija o import: como este arquivo está em infra/database/repositories, 
// o caminho para o prisma.js deve ser um nível acima.
import prisma from '../infra/database/prisma.js'; 
import { User } from '../model/entities/User.js'; 

export class UserRepository {
  
  // Transforma o objeto do Prisma em uma Entidade de Domínio
  // Criamos este método privado para não repetir código
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
      include: { role: { include: { permissions: true } } }
    });

    if (!userData) return null;

    return {
      user: this.#mapToEntity(userData),
      permissions: userData.role?.permissions.map(p => p.name) || []
    };
  }

  async create(userEntity) {
    const createdUser = await prisma.users.create({
      data: {
        email: userEntity.email,
        name: userEntity.name,
        password: userEntity.password,
        role: { connect: { name: 'ALUNO' } } // Padrão para o SafeWoman SSA
      },
    });

    return this.#mapToEntity(createdUser);
  }

  async findAll() {
    const users = await prisma.users.findMany({
      include: { role: { select: { name: true } } }
    });
    
    // IMPORTANTE: O Use Case espera Entidades, não objetos do Prisma
    return users.map(user => this.#mapToEntity(user));
  }

  async update(id, data) {
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
    // Aqui não precisamos converter para User, pois é uma busca de Role
    return await prisma.role.findUnique({ where: { name } });
  }
}