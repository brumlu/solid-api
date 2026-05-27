import { left, right } from "../../shared/core/Either.js";
import { 
  ResourceNotFoundError,
  NotAllowedError,
  AppError
} from '../../model/errors/AppError.js';

export class GetUserCartUseCase {
  constructor(cartRepository) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    let cart = await this.cartRepository.findByUserId(userId);

    // Se não encontrou, cria um carrinho vazio para o usuário
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    // Retorna o carrinho
    return right(cart);
  }
}