import { User } from '../model/entities/User.js'; // Importe a entidade User para o Create

export class CreateUser {
  // Agora recebemos o repositório E o hashProvider
  constructor(userRepository, hashProvider) {
    this.userRepository = userRepository;
    this.hashProvider = hashProvider;
  }

  async execute({ email, name, password }) {
    // 1. Regra de Negócio: Não permitir emails duplicados
    const userAlreadyExists = await this.userRepository.findByEmail(email);
    if (userAlreadyExists) {
      throw new Error('Este email já está em uso.');
    }

    // 2. Processamento de dados: Hash da senha usando o PROVIDER
    // Note que agora usamos 'this.hashProvider.generateHash' (o método que criamos no Provider)
    const hashedPassword = await this.hashProvider.generateHash(password);

    // 3. Criar a Entidade de Domínio
    const userEntity = new User({
      email,
      name,
      password: hashedPassword
    });

    // 4. Persistência
    return await this.userRepository.create(userEntity);
  }
}

export class LoginUser {
  // Agora recebemos o HashProvider e o TokenProvider
  constructor(userRepository, hashProvider, tokenProvider) {
    this.userRepository = userRepository;
    this.hashProvider = hashProvider;
    this.tokenProvider = tokenProvider;
  }

  async execute({ email, password }) {
    const result = await this.userRepository.findByEmailWithPermissions(email);

    if (!result || !result.user) throw new Error('Credenciais inválidas');

    // O Use Case não sabe que é Bcrypt, ele apenas pede para comparar
    const isPasswordValid = await this.hashProvider.compareHash(
      password, 
      result.user.password
    );

    if (!isPasswordValid) throw new Error('Credenciais inválidas');

    // O Use Case não sabe que é JWT, ele apenas pede um token
    const token = this.tokenProvider.generate({ 
      id: result.user.id, 
      permissions: result.permissions 
    });

    return { token };
  }
}
  // Listar Usuários
export class ListUsers {
  constructor(userRepository) { this.userRepository = userRepository; }
  async execute() { return await this.userRepository.findAll(); }
}

// Atualizar Dados Básicos
export class UpdateUser {
  constructor(userRepository) { this.userRepository = userRepository; }
  async execute(id, { name, email }) {
    return await this.userRepository.update(id, { name, email });
  }
}

// Atualizar Senha
export class UpdateUserPassword {
  constructor(userRepository) { this.userRepository = userRepository; }
  async execute(id, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return await this.userRepository.update(id, { password: hashedPassword });
  }
}

// Deletar Usuário
export class DeleteUser {
  constructor(userRepository) { this.userRepository = userRepository; }
  async execute(id) { return await this.userRepository.delete(id); }
}

// Alterar Cargo / Admin Setup
export class ChangeUserRole {
  constructor(userRepository) { this.userRepository = userRepository; }
  async execute(id, roleId) {
    return await this.userRepository.update(id, { roleId: Number(roleId) });
  }
  
  async promoteToAdmin(id) {
    const adminRole = await this.userRepository.findRoleByName('ADMIN');
    if (!adminRole) throw new Error("Cargo ADMIN não encontrado");
    return await this.userRepository.update(id, { roleId: adminRole.id });
  }
}