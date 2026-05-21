import { Router } from 'express';
import { makePublicUserController, makePrivateUserController } from '../factories/user_factory.js';
import { makeProductController } from '../factories/product_factory.js';
import { makeAddressController } from '../factories/address_factory.js';
import { makeCartController } from '../factories/cart_factory.js'; // Nova Factory de Carrinho

import auth from './middlewares/auth.js';
import checkPermission from './middlewares/checkPermission.js';
import isOwnerOrAdmin from './middlewares/isOwnerOrAdmin.js';
import { Permissions } from '../../model/constants/permissions.js';
import { validate } from './middlewares/validator.js';

// Schemas
import { createUserSchema, loginUserSchema, updateProfileSchema, updatePasswordSchema } from '../schemas/user_schemas.js';
import { createProductSchema, updateProductSchema } from '../schemas/product_schemas.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/address_schemas.js';
import { addToCartSchema } from '../schemas/cart_schemas.js';

const router = Router();

const publicUserController = makePublicUserController();
const privateUserController = makePrivateUserController();
const productController = makeProductController();
const addressController = makeAddressController();
const cartController = makeCartController(); // Instância do Controller de Carrinho

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
router.post('/logout', auth, (req, res) => privateUserController.logout(req, res));
router.patch('/users/default-address', auth, privateUserController.definirEnderecoPadrao);

// --- ROTAS PRIVADAS: PRODUTOS ---
router.get('/products', auth, checkPermission('PRODUCT_READ'), productController.listar);
router.post('/products', validate(createProductSchema), auth, checkPermission('PRODUCT_CREATE'), productController.criar);
router.delete('/products/:id', auth, checkPermission('PRODUCT_DELETE'), productController.deletar);
router.patch('/products/:id/stock', validate(updateProductSchema), auth, checkPermission('PRODUCT_UPDATE'), productController.alterarEstoque);
router.patch('/products/:id/price', validate(updateProductSchema), auth, checkPermission('PRODUCT_UPDATE'), productController.alterarPreco);
router.patch('/products/:id', validate(updateProductSchema), auth, checkPermission('PRODUCT_UPDATE'), productController.atualizar);

// --- ROTAS PRIVADAS: ENDEREÇOS ---
router.post('/addresses', auth, validate(createAddressSchema), addressController.adicionar);
router.get('/addresses/default', auth, addressController.buscarEnderecoPadrao);
router.get('/addresses/:id', auth, isOwnerOrAdmin, addressController.buscarPorId);
router.get('/addresses', auth, addressController.listarMeusEnderecos);
router.delete('/addresses/:id', auth, isOwnerOrAdmin, addressController.deletar);


// --- ROTAS PRIVADAS: CARRINHO ---

// Obter o carrinho
router.get('/cart', auth, (req, res, next) => cartController.obterCarrinho(req, res, next));

// Adicionar produto
router.post('/cart/items', (req, res, next) => { next(); }, validate(addToCartSchema), auth, cartController.adicionarItem);

// Remover item
router.delete('/cart/items/:productId', auth, (req, res, next) => cartController.removerItem(req, res, next));

export default router;