import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class DeleteProductUseCase {
  constructor(productRepository) { 
    this.productRepository = productRepository; 
  }

  async execute(id) { 
    const product = await this.productRepository.findById(id);
    if (!product) {
      return left(new ResourceNotFoundError('Produto'));
    }

    await this.productRepository.delete(id); 
    return right(null);
  }
}