import { UserRepository } from '../../repository/prisma_user_repository.js';
import { HashProvider } from '../providers/hash_provider.js';
import { TokenProvider } from '../providers/token_provider.js';
import {
  CreateUserUseCase,
  LoginUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  UpdateUserPasswordUseCase,
  DeleteUserUseCase,
  ChangeUserRoleUseCase,
  SetDefaultAddressUseCase,
  GetUserProfileUseCase
} from '../../usecase/user/index.js';

import { PublicUserController } from '../http/controller/public_user_controller.js';
import { PrivateUserController } from '../http/controller/private_user_controller.js';
import { AddressRepository } from '../../repository/prisma_address_repository.js';

// Instâncias de Infra (Compartilhadas para economizar memória)
const userRepository = new UserRepository();
const hashProvider = new HashProvider();
const tokenProvider = new TokenProvider();
const addressRepository = new AddressRepository();

export const makePublicUserController = () => {
  // Injeção nos casos de uso públicos
  const createUserUseCase = new CreateUserUseCase(userRepository, hashProvider);
  const loginUserUseCase = new LoginUserUseCase(userRepository, hashProvider, tokenProvider);

  // Retorna o controller pronto
  return new PublicUserController(createUserUseCase, loginUserUseCase);
};

export const makePrivateUserController = () => {
  const masterKey = process.env.MASTER_KEY;

  // Agrupamento de casos de uso privados
  const useCases = {
    listUsers: new ListUsersUseCase(userRepository),
    updateUser: new UpdateUserUseCase(userRepository),
    updatePassword: new UpdateUserPasswordUseCase(userRepository, hashProvider),
    deleteUser: new DeleteUserUseCase(userRepository),
    changeRole: new ChangeUserRoleUseCase(userRepository),
    setDefaultAddress: new SetDefaultAddressUseCase(userRepository, addressRepository),
    getUserProfile: new GetUserProfileUseCase(userRepository)
  };

  return new PrivateUserController(useCases, masterKey);
};