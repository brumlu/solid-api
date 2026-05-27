import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

export class ChangeUserRoleUseCase {
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