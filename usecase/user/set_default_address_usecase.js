import { User } from '../../model/entities/User.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';
import { Roles } from '../../model/constants/roles.js';

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