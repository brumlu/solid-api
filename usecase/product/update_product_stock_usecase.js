import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class UpdateProductStockUseCase {
  constructor(productRepository) { 
    this.productRepository = productRepository; 
  }

  async execute(id, { stock }) { // Ajustado para receber objeto { stock }
    const product = await this.productRepository.findById(id);
    if (!product) return left(new ResourceNotFoundError('Produto'));

    if (stock < 0) return left(new AppError('O estoque não pode ser negativo'));

    const updated = await this.productRepository.update(id, { stock });
    return right(updated);
  }
}