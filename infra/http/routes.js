import { Router } from 'express';
import { makePublicUserController, makePrivateUserController } from '../factories/user_factory.js';
import { makeProductController } from '../factories/product_factory.js'; // Nova Factory

import auth from './middlewares/auth.js';
import checkPermission from './middlewares/checkPermission.js';
import isOwnerOrAdmin from './middlewares/isOwnerOrAdmin.js';
import { Permissions } from '../../model/constants/permissions.js';
import { validate } from './middlewares/validator.js';

// Schemas
import { createUserSchema, loginUserSchema, updateProfileSchema, updatePasswordSchema } from '../schemas/user_schemas.js';

import { createProductSchema, updateProductSchema } from '../schemas/product_schemas.js'

const router = Router();

const publicUserController = makePublicUserController();
const privateUserController = makePrivateUserController();
const productController = makeProductController(); // Instância do Controller de Produtos

// --- ROTAS PUBLICAS ---
router.post('/register', validate(createUserSchema), (req, res) => publicUserController.cadastro(req, res));
router.post('/login', validate(loginUserSchema), (req, res) => publicUserController.login(req, res));

// --- ROTAS PRIVADAS: USUÁRIOS ---
router.get('/users', auth, checkPermission(Permissions.USER_READ), privateUserController.listar);

router.patch('/users-update/:id', validate(updateProfileSchema), auth, isOwnerOrAdmin, privateUserController.atualizar);

router.patch('/password-update/:id', validate(updatePasswordSchema), auth, isOwnerOrAdmin, privateUserController.atualizarSenha);

router.patch('/role-update/:id', auth, checkPermission(Permissions.ADMIN_ACCESS), privateUserController.alterarCargo);

router.patch('/setup-admin/:id', privateUserController.setupAdmin);

router.delete('/users/:id', auth, isOwnerOrAdmin, privateUserController.deletar);

// --- ROTAS PRIVADAS: PRODUTOS ---

// Listar produtos (Permissão PRODUCT_READ para Admin e Default)
router.get('/products', auth, checkPermission('PRODUCT_READ'), productController.listar);

// Criar produto (Apenas ADMIN via PRODUCT_CREATE)
router.post('/products', validate(createProductSchema), auth, checkPermission('PRODUCT_CREATE'), productController.criar);

// Deletar produto (Apenas ADMIN via PRODUCT_DELETE)
router.delete('/products/:id', auth, checkPermission('PRODUCT_DELETE'), productController.deletar);

// Alterar Estoque (Apenas ADMIN via PRODUCT_UPDATE)
router.patch('/products/:id/stock', validate(updateProductSchema), auth, checkPermission('PRODUCT_UPDATE'), productController.alterarEstoque);

// Alterar Preço (Apenas ADMIN via PRODUCT_UPDATE)
router.patch('/products/:id/price', validate(updateProductSchema), auth, checkPermission('PRODUCT_UPDATE'), productController.alterarPreco);

// Atualizar produto geral (Apenas ADMIN via PRODUCT_UPDATE)
router.patch('/products/:id', validate(updateProductSchema), auth, checkPermission('PRODUCT_UPDATE'), productController.atualizar);

export default router;