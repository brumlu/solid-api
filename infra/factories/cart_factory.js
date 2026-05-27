import { CartRepository } from '../../repository/prisma_cart_repository.js';
import { ProductRepository } from '../../repository/prisma_product_repository.js';
import {
  AddProductToCartUseCase,
  GetUserCartUseCase,
  RemoveItemFromCartUseCase
} from '../../usecase/cart/index.js';
import { CartController } from '../http/controller/cart_controller.js';

// Instâncias de Infra (Repositórios)
const cartRepository = new CartRepository();
const productRepository = new ProductRepository();

export const makeCartController = () => {
  // Agrupamento de casos de uso do carrinho
  const useCases = {
    addProductToCart: new AddProductToCartUseCase(cartRepository, productRepository),
    getUserCart: new GetUserCartUseCase(cartRepository),
    removeItemFromCart: new RemoveItemFromCartUseCase(cartRepository)
  };

  // Retorna o controller do carrinho injetando os casos de uso
  return new CartController(useCases);
};