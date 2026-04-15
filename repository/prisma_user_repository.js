// 1. Corrija o import: como este arquivo está em infra/database/repositories, 
// o caminho para o prisma.js deve ser um nível acima.
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
          include: { 
            permissions: { 
              include: { 
                permission: true // Traz os dados da tabela Permission
              } 
            } 
          } 
        } 
      }
    });

    if (!userData) return null;

    /**
     * CORREÇÃO AQUI:
     * Como a relação é explícita, o array é: 
     * userData.role.permissions = [{ permission: { name: 'USER_READ' } }, ...]
     */
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
        // No seed usamos 'Default' ou 'ALUNO', garanta que o nome aqui seja igual ao do banco
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
    // Garantimos que o ID seja um número, vindo da rota como string
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