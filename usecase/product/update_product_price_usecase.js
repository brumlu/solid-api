import { Product } from '../../model/entities/Product.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class UpdateProductPrice {
  constructor(productRepository) { 
    this.productRepository = productRepository; 
  }

  async execute(id, { price }) { 
    const product = await this.productRepository.findById(id);
    if (!product) return left(new ResourceNotFoundError('Produto'));

    if (price < 0) return left(new AppError('O preço não pode ser negativo'));

    const updated = await this.productRepository.update(id, { price });
    return right(updated);
  }
}