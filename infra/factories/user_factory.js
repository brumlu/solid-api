// 1. Camada de Infra (Detalhes Técnicos)
import { UserRepository } from '../../repository/prisma_user_repository.js';
import { HashProvider } from '../providers/hash_provider.js';
import { TokenProvider } from '../providers/token_provider.js';

// 2. Camada de Aplicação (Regras de Negócio)
import { 
  CreateUser, 
  LoginUser, 
  ListUsers, 
  UpdateUser, 
  UpdateUserPassword, 
  DeleteUser, 
  ChangeUserRole 
} from '../../usecase/user_usecase.js';

// 3. Camada de Adaptadores (Entrada/Saída)
import { PublicUserController } from '../http/controller/public_user_controller.js';
import { PrivateUserController } from '../http/controller/private_user_controller.js';

// --- FÁBRICAS ---

export const makePublicUserController = () => {
  // Instanciamos os detalhes técnicos uma única vez
  const userRepository = new UserRepository();
  const hashProvider = new HashProvider();
  const tokenProvider = new TokenProvider();

  // Injetamos as dependências nos Use Cases
  const createUserUseCase = new CreateUser(userRepository, hashProvider);
  const loginUserUseCase = new LoginUser(userRepository, hashProvider, tokenProvider);

  // Retornamos o Controller pronto para o Router
  return new PublicUserController(createUserUseCase, loginUserUseCase);
};

export const makePrivateUserController = () => {
  const userRepository = new UserRepository();
  const hashProvider = new HashProvider(); // Agora injetado corretamente para troca de senha

  const useCases = {
    listUsers: new ListUsers(userRepository),
    updateUser: new UpdateUser(userRepository),
    // Aqui aplicamos o DIP: passamos o hashProvider para o caso de uso de senha
    updatePassword: new UpdateUserPassword(userRepository, hashProvider),
    deleteUser: new DeleteUser(userRepository),
    changeRole: new ChangeUserRole(userRepository)
  };

  return new PrivateUserController(useCases);
};