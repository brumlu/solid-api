import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class GetUserProfileUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }
  async execute(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("Usuário não encontrado");
    return user;
  }
}