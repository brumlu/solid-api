import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class ListProductsUseCase {
  constructor(productRepository) { 
    this.productRepository = productRepository; 
  }

  async execute() { 
    const products = await this.productRepository.findAll();
    return right(products);
  }
}