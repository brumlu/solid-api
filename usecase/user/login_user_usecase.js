import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class LoginUserUseCase {
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