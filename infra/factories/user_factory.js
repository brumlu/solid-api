import { UserRepository } from '../../repository/prisma_user_repository.js';
import { HashProvider } from '../providers/hash_provider.js';
import { TokenProvider } from '../providers/token_provider.js';

import { 
  CreateUser, 
  LoginUser, 
  ListUsers, 
  UpdateUser, 
  UpdateUserPassword, 
  DeleteUser, 
  ChangeUserRole 
} from '../../usecase/user/user_usecase.js';

import { PublicUserController } from '../http/controller/public_user_controller.js';
import { PrivateUserController } from '../http/controller/private_user_controller.js';

// Instâncias de Infra (Compartilhadas para economizar memória)
const userRepository = new UserRepository();
const hashProvider = new HashProvider();
const tokenProvider = new TokenProvider();

export const makePublicUserController = () => {
  // Injeção nos casos de uso públicos
  const createUserUseCase = new CreateUser(userRepository, hashProvider);
  const loginUserUseCase = new LoginUser(userRepository, hashProvider, tokenProvider);

  // Retorna o controller pronto
  return new PublicUserController(createUserUseCase, loginUserUseCase);
};

export const makePrivateUserController = () => {
  const masterKey = process.env.MASTER_KEY;

  // Agrupamento de casos de uso privados
  const useCases = {
    listUsers: new ListUsers(userRepository),
    updateUser: new UpdateUser(userRepository),
    updatePassword: new UpdateUserPassword(userRepository, hashProvider),
    deleteUser: new DeleteUser(userRepository),
    changeRole: new ChangeUserRole(userRepository)
  };

  return new PrivateUserController(useCases, masterKey);
};