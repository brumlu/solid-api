import { User } from '../model/entities/User.js';

// 1. Criar Usuário
export class CreateUser {
  constructor(userRepository, hashProvider) {
    this.userRepository = userRepository;
    this.hashProvider = hashProvider;
  }

  async execute({ email, name, password }) {
    const userAlreadyExists = await this.userRepository.findByEmail(email);
    if (userAlreadyExists) throw new Error('Este email já está em uso.');

    const hashedPassword = await this.hashProvider.generateHash(password);

    const userEntity = new User({
      email,
      name,
      password: hashedPassword
    });

    return await this.userRepository.create(userEntity);
  }
}

// 2. Login de Usuário
export class LoginUser {
  constructor(userRepository, hashProvider, tokenProvider) {
    this.userRepository = userRepository;
    this.hashProvider = hashProvider;
    this.tokenProvider = tokenProvider;
  }

  async execute({ email, password }) {
    const result = await this.userRepository.findByEmailWithPermissions(email);
    if (!result || !result.user) throw new Error('Credenciais inválidas');

    const isPasswordValid = await this.hashProvider.compareHash(
      password, 
      result.user.password
    );

    if (!isPasswordValid) throw new Error('Credenciais inválidas');

    return this.tokenProvider.generate({ 
      id: result.user.id, 
      permissions: result.permissions 
    });
  }
}

// 3. Listar Usuários
export class ListUsers {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }
  async execute() { 
    return await this.userRepository.findAll(); 
  }
}

// 4. Atualizar Dados Básicos
export class UpdateUser {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }
  async execute(id, { name, email }) {
    return await this.userRepository.update(id, { name, email });
  }
}

// 5. Atualizar Senha (CORRIGIDO COM DIP)
export class UpdateUserPassword {
  constructor(userRepository, hashProvider) { 
    this.userRepository = userRepository; 
    this.hashProvider = hashProvider; // Injetado!
  }

  async execute(id, password) {
    // Inversão: O Use Case pede ao provider para gerar o hash, 
    // sem saber se é Bcrypt, Argon2 ou MD5.
    const hashedPassword = await this.hashProvider.generateHash(password);
    return await this.userRepository.update(id, { password: hashedPassword });
  }
}

// 6. Deletar Usuário
export class DeleteUser {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }
  async execute(id) { 
    return await this.userRepository.delete(id); 
  }
}

// 7. Alterar Cargo
export class ChangeUserRole {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }

  async execute(id, roleId) {
    return await this.userRepository.update(id, { roleId: Number(roleId) });
  }
  
  async promoteToAdmin(id) {
    const adminRole = await this.userRepository.findRoleByName('ADMIN');
    if (!adminRole) throw new Error("Cargo ADMIN não encontrado");
    return await this.userRepository.update(id, { roleId: adminRole.id });
  }
}