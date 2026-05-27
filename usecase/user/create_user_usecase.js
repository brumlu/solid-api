import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class CreateUserUseCase {
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