import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class UpdateUserPasswordUseCase {
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