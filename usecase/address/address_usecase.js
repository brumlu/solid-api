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
    // 1. Validar se o usuário existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return left(new ResourceNotFoundError("Usuário"));
    }

    // 2. Criar o endereço
    const newAddress = await this.addressRepository.create({
      ...addressData,
      userId
    });

    // 3. Regra de Negócio: Se for o primeiro endereço OU isDefault for true
    if (isDefault || !user.defaultAddressId) {
      await this.userRepository.updateDefaultAddress(userId, newAddress.id);
    }

    return right(newAddress);
  }
}

export class ListUserAddressesUseCase {
  constructor(addressRepository) {
    this.addressRepository = addressRepository;
  }

  async execute(userId) {
    const addresses = await this.addressRepository.findByUserId(userId);
    return right(addresses);
  }
}

export class SetDefaultAddressUseCase {
  constructor(userRepository, addressRepository) {
    this.userRepository = userRepository;
    this.addressRepository = addressRepository;
  }

  async execute({ userId, addressId }) {
    // 1. Validar se o endereço existe
    const address = await this.addressRepository.findById(addressId);
    
    if (!address) {
      return left(new ResourceNotFoundError("Endereço"));
    }

    // 2. Verificar se pertence ao usuário
    // Usando String() para evitar erros de comparação de tipos UUID do Prisma
    if (String(address.userId) !== String(userId)) {
      return left(new NotAllowedError("Este endereço não pertence a este usuário"));
    }

    // 3. Atualizar o ponteiro no usuário
    await this.userRepository.updateDefaultAddress(userId, addressId);
    
    return right(null);
  }
}

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