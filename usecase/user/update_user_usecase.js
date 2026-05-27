import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class UpdateUserUseCase {
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