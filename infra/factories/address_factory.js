import { AddressRepository } from '../../repository/prisma_address_repository.js';
import { UserRepository } from '../../repository/prisma_user_repository.js';
import {
  AddAddressUseCase,
  ListUserAddressesUseCase,
  DeleteAddressUseCase,
  GetDefaultAddressUseCase,
  GetAddressByIdUseCase
} from '../../usecase/address/index.js';
import { AddressController } from '../http/controller/address_controller.js';

// Instâncias de Infra
const addressRepository = new AddressRepository();
const userRepository = new UserRepository();

export const makeAddressController = () => {
  // Agrupamento de casos de uso de endereço
  const useCases = {
    addAddress: new AddAddressUseCase(addressRepository, userRepository),
    listAddresses: new ListUserAddressesUseCase(addressRepository),
    deleteAddress: new DeleteAddressUseCase(addressRepository, userRepository),
    getDefaultAddress: new GetDefaultAddressUseCase(addressRepository),
    getAddressById: new GetAddressByIdUseCase(addressRepository)
  };

  // Retorna o controller de endereços injetando os use cases
  return new AddressController(useCases);
};