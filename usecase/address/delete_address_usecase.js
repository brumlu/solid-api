import { left, right } from "../../shared/core/Either.js"
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class DeleteAddressUseCase {
  constructor(addressRepository, userRepository) {
    this.addressRepository = addressRepository;
    this.userRepository = userRepository;
  }

  async execute({ userId, addressId, userRole }) {
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      return left(new ResourceNotFoundError("Endereço"));
    }

    const isOwner = String(address.userId) === String(userId);
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return left(new NotAllowedError("Sem permissão para excluir este endereço"));
    }

    await this.addressRepository.delete(addressId);

    return right(null);
  }
}