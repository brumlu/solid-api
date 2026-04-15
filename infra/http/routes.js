import { Router } from 'express';
import { PublicUserController } from './controller/public_user_controller.js';
import { PrivateUserController } from './controller/private_user_controller.js';
import { CreateUser, LoginUser, ListUsers, UpdateUser, UpdateUserPassword, DeleteUser, ChangeUserRole } from '../../usecase/user_usecase.js';
import { UserRepository } from '../../repository/user_repository.js';
import auth from './middlewares/auth.js';
import checkPermission from './middlewares/checkPermission.js';
import isOwnerOrAdmin from './middlewares/isOwnerOrAdmin.js';
import { Permissions } from '../../model/constants/permissions.js';
import { HashProvider } from '../providers/hash_provider.js';
import { TokenProvider } from '../providers/token_provider.js';

const router = Router();

// --- INJEÇÃO DE DEPENDÊNCIAS ---
// 1. O Repositório (Acesso ao Banco)
const userRepository = new UserRepository();
const hashProvider = new HashProvider();
const tokenProvider = new TokenProvider();



// 2. Os Casos de Uso (Regras de Negócio)
const createUserUseCase = new CreateUser(userRepository, hashProvider);
const loginUserUseCase = new LoginUser(userRepository, hashProvider, tokenProvider);

// 3. O Controller (Entrada e Saída HTTP)
// Passamos os dois casos de uso para o construtor do controller
const publicUserController = new PublicUserController(createUserUseCase, loginUserUseCase);
const privateUserController = new PrivateUserController({
  listUsers: new ListUsers(userRepository),
  updateUser: new UpdateUser(userRepository),
  updatePassword: new UpdateUserPassword(userRepository),
  deleteUser: new DeleteUser(userRepository),
  changeRole: new ChangeUserRole(userRepository)
});

// --- DEFINIÇÃO DAS ROTAS ---

// Rotas Públicas (Abertas)
router.post('/cadastro', (req, res) => publicUserController.cadastro(req, res));
router.post('/login', (req, res) => publicUserController.login(req, res));

// --- ROTAS PRIVADAS ---

// 1. Listagem (Leitura)
router.get('/listar-usuarios', auth, checkPermission(Permissions.USER_READ), (req, res) => privateUserController.listar(req, res));

// 2. Edição de conta (Dono ou Admin)
router.patch('/atualizar-usuario/:id', auth, isOwnerOrAdmin, (req, res) => privateUserController.atualizar(req, res));
router.patch('/atualizar-senha/:id', auth, isOwnerOrAdmin, (req, res) => privateUserController.atualizarSenha(req, res));

// 3. Admin Tools
router.delete('/deletar-usuario/:id', auth, checkPermission(Permissions.USER_DELETE), (req, res) => privateUserController.deletar(req, res));
router.patch('/admin/alterar-privilegio/:id', auth, checkPermission(Permissions.ADMIN_ACCESS), (req, res) => {
  const { roleId } = req.body;
  if (!roleId) return res.status(400).send("roleId obrigatório");
  privateUserController.useCases.changeRole.execute(req.params.id, roleId)
    .then(() => res.send("Sucesso"))
    .catch(() => res.status(500).send("Erro"));
});

// 4. Interno
router.patch('/internal/setup-admin/:id', (req, res) => privateUserController.setupAdmin(req, res));

export default router;