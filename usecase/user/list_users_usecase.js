import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class ListUsersUseCase {
  constructor(userRepository) { 
    this.userRepository = userRepository; 
  }
  async execute() { 
    const users = await this.userRepository.findAll();
    return right(users);
  }
}