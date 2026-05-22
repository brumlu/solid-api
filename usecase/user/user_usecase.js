import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js'; // Exemplo de constante

export class CreateUser {
  constructor(userRepository, hashProvider) {
    this.userRepository = userRepository;
    this.hashProvider = hashProvider;
  }

  async execute({ email, name, password }) {
    const userAlreadyExists = await this.userRepository.findByEmail(email);
    
    if (userAlreadyExists) {
      return left(new UserAlreadyExistsError());
    }

    const hashedPassword = await this.hashProvider.generateHash(password);

    const userEntity = new User({
      email,
      name,
      password: hashedPassword
    });

    const user = await this.userRepository.create(userEntity);
    return right(user);
  }
}

export class LoginUser {
  constructor(userRepository, hashProvider, tokenProvider) {
    this.userRepository = userRepository;
    this.hashProvider = hashProvider;
    this.tokenProvider = tokenProvider;
  }

  async execute({ email, password }) {
    const result = await this.userRepository.findByEmailWithPermissions(email);

    if (!result || !result.user) {
      return left(new InvalidCredentialsError());
    }

    const isPasswordValid = await this.hashProvider.compareHash(
      password, 
      result.user.password
    );

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError());
    }

    const token = this.tokenProvider.generate({ 
      id: result.user.id, 
      email: result.user.email,
      permissions: result.permissions 
    });

    return right({ token });
  }
}

export class ListUsers {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }
  async execute() { 
    const users = await this.userRepository.findAll();
    return right(users);
  }
}

export class UpdateUser {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }
  async execute(id, { name, email }) {
    const user = await this.userRepository.findById(id);
    if (!user) return left(new ResourceNotFoundError('Usuário'));

    const updated = await this.userRepository.update(id, { name, email });
    return right(updated);
  }
}

export class UpdateUserPassword {
  constructor(userRepository, hashProvider) { 
    this.userRepository = userRepository; 
    this.hashProvider = hashProvider;
  }

  async execute(id, password) {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      return left(new ResourceNotFoundError('Usuário'));
    }

    const hashedPassword = await this.hashProvider.generateHash(password);
    
    // O await aqui garante que a senha seja salva antes de prosseguir
    await this.userRepository.update(id, { password: hashedPassword });
    
    return right(null);
  }
}

export class DeleteUser {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }

  async execute(id) { 
    const user = await this.userRepository.findById(id);
    if (!user) return left(new ResourceNotFoundError('Usuário'));

    await this.userRepository.delete(id); 
    return right(null);
  }
}

export class ChangeUserRole {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }

  async execute(id, roleId) {
    const user = await this.userRepository.findById(id);
    if (!user) return left(new ResourceNotFoundError('Usuário'));

    const updated = await this.userRepository.update(id, { roleId: (roleId) });
    return right(updated);
  }
  
  async promoteToAdmin(id) {
    const adminRole = await this.userRepository.findRoleByName(Roles.ADMIN); 
    
    if (!adminRole) {
      return left(new ResourceNotFoundError('Cargo ADMIN'));
    }

    const updated = await this.userRepository.update(id, { roleId: adminRole.id });
    return right(updated);
  }
}

export class SetDefaultAddressUseCase {
  constructor(userRepository, addressRepository) {
    this.userRepository = userRepository;
    this.addressRepository = addressRepository;
  }

  async execute({ userId, addressId }) {
    const user = await this.userRepository.findById(userId);
    if (!user) return left(new ResourceNotFoundError("Usuário"));

    const address = await this.addressRepository.findById(addressId);
    if (!address) return left(new ResourceNotFoundError("Endereço"));

    // Normalização para comparação de UUIDs
    const ownerId = String(address.userId).trim().toLowerCase();
    const requesterId = String(userId).trim().toLowerCase();

    if (ownerId !== requesterId) {
      return left(new NotAllowedError("Este endereço não pertence ao usuário informado."));
    }

    await this.userRepository.updateDefaultAddress(userId, addressId);

    return right(null);
  }
}

export class GetUserProfile {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("Usuário não encontrado");
    return user;
  }
}