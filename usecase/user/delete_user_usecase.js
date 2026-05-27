import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class DeleteUserUseCase {
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