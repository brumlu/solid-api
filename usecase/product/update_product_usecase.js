import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class UpdateProductUseCase {
  constructor(productRepository) { 
    this.productRepository = productRepository; 
  }

  async execute(id, data) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return left(new ResourceNotFoundError('Produto'));
    }

    if (data.price !== undefined && data.price < 0) {
      return left(new AppError('O preço não pode ser negativo'));
    }

    const updated = await this.productRepository.update(id, data);
    return right(updated);
  }
}