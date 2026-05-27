import { left, right } from "../../shared/core/Either.js"
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class GetAddressByIdUseCase {
  constructor(addressRepository) {
    this.addressRepository = addressRepository;
  }

  async execute(addressId) {
    const address = await this.addressRepository.findById(addressId);

    if (!address) {
      return left(new ResourceNotFoundError("Endereço"));
    }

    return right(address);
  }
}