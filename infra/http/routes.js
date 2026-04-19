import { Router } from 'express';
import { makePublicUserController, makePrivateUserController } from '../factories/user_factory.js';
import auth from './middlewares/auth.js';
import checkPermission from './middlewares/checkPermission.js';
import isOwnerOrAdmin from './middlewares/isOwnerOrAdmin.js';
import { Permissions } from '../../model/constants/permissions.js';
import { validate } from './middlewares/validator.js';
import { createUserSchema, loginUserSchema, updateProfileSchema, updatePasswordSchema } from '../schemas/user_schemas.js';

const router = Router();

const publicUserController = makePublicUserController();
const privateUserController = makePrivateUserController();

// --- ROTAS PUBLICAS ---
router.post('/register', validate(createUserSchema), (req, res) => publicUserController.cadastro(req, res));
router.post('/login', validate(loginUserSchema), (req, res) => publicUserController.login(req, res));

// --- ROTAS PRIVADAS ---

router.get('/users', auth, checkPermission(Permissions.USER_READ), (req, res) => 
  privateUserController.listar(req, res)
);

router.patch('/users-update/:id', validate(updateProfileSchema), auth, isOwnerOrAdmin, (req, res) => 
  privateUserController.atualizar(req, res)
);

router.patch('/password-update/:id', validate(updatePasswordSchema), auth, isOwnerOrAdmin, (req, res) => 
  privateUserController.atualizarSenha(req, res)
);

router.patch('/role-update/:id', auth, checkPermission(Permissions.ADMIN_ACCESS), (req, res) => 
  privateUserController.alterarCargo(req, res)
);

router.patch('/setup-admin/:id', (req, res) => 
  privateUserController.setupAdmin(req, res)
);

router.delete('/users/:id', auth, isOwnerOrAdmin, (req, res) => 
  privateUserController.deletar(req, res)
);

export default router;