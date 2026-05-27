import { left, right } from "../../shared/core/Either.js"
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class GetDefaultAddressUseCase {
  constructor(addressRepository) {
    this.addressRepository = addressRepository;
  }

  async execute(userId) {
    const defaultAddress = await this.addressRepository.findDefaultByUserId(userId);
    
    if (!defaultAddress) {
      return left(new ResourceNotFoundError("Endereço padrão"));
    }

    return right(defaultAddress);
  }
}