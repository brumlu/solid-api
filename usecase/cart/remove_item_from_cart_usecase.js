import { left, right } from "../../shared/core/Either.js";
import { 
  ResourceNotFoundError,
  NotAllowedError,
  AppError
} from '../../model/errors/AppError.js';

export class RemoveItemFromCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute({ userId, productId }) {
    const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
      return left(new ResourceNotFoundError("Carrinho"));
      }

    const itemExists = cart.items.find(item => item.productId === productId);
      if (!itemExists) {
      return left(new ResourceNotFoundError("Produto no carrinho"));
      }

      await this.cartRepository.removeItem(cart.id, productId);

    const updatedCart = await this.cartRepository.findByUserId(userId);
      return right(updatedCart);
  }
}