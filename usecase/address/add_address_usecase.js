import { left, right } from "../../shared/core/Either.js"
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class AddAddressUseCase {
  constructor(addressRepository, userRepository) {
    this.addressRepository = addressRepository;
    this.userRepository = userRepository;
  }

  async execute({ userId, isDefault, ...addressData }) {
    // Validar se o usuário existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return left(new ResourceNotFoundError("Usuário"));
    }

    // Criar o endereço
    const newAddress = await this.addressRepository.create({
      ...addressData,
      userId
    });

    // Regra de Negócio: Se for o primeiro endereço OU isDefault for true
    if (isDefault || !user.defaultAddressId) {
      await this.userRepository.updateDefaultAddress(userId, newAddress.id);
    }

    return right(newAddress);
  }
}