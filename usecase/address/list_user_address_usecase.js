import { left, right } from "../../shared/core/Either.js"
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class ListUserAddressesUseCase {
  constructor(addressRepository) {
    this.addressRepository = addressRepository;
  }

  async execute(userId) {
    const addresses = await this.addressRepository.findByUserId(userId);
    return right(addresses);
  }
}