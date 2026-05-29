import { left, right } from "../../shared/core/Either.js";
import {
  ResourceNotFoundError,
  NotAllowedError,
  AppError
} from '../../model/errors/AppError.js';

export class AddProductToCartUseCase {
  constructor(cartRepository, productRepository) {
    this.cartRepository = cartRepository;
    this.productRepository = productRepository;
  }

  async execute({ userId, productId, quantity }) {
    // Validar se o produto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      return left(new ResourceNotFoundError("Produto"));
    }

    // Verificar estoque (Regra de Negócio)
    if (product.stock < quantity) {
    return left(new AppError("Estoque insuficiente para a quantidade desejada", 400));
    }

    // Buscar ou criar o carrinho do usuário
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    // Verificar se o produto já está no carrinho
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      // Se já existe, soma a nova quantidade à atual
      const newQuantity = existingItem.quantity + quantity;
      
      // Valida estoque novamente com a soma total
      if (product.stock < newQuantity) {
        return left(new AppError("A quantidade total no carrinho excede o estoque disponível", 400));
        }

      await this.cartRepository.updateItemQuantity(cart.id, productId, newQuantity);
    } else {
      // Se não existe, adiciona o novo item
      await this.cartRepository.addItem(cart.id, productId, quantity);
    }

    // Retorna o carrinho atualizado
    const updatedCart = await this.cartRepository.findByUserId(userId);
    return right(updatedCart);
  }
}