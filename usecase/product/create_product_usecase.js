import { Product } from '../../model/entities/Product.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  ResourceNotFoundError,
  NotAllowedError
} from '../../model/errors/AppError.js';

export class CreateProductUseCase {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async execute({ name, description, price, stock }) {
    // Validação simples de domínio
    if (price < 0) {
      return left(new AppError('O preço não pode ser negativo'));
    }

    const productEntity = new Product({
      name,
      description,
      price,
      stock: stock ?? 0
    });

    const product = await this.productRepository.create(productEntity);
    return right(product);
  }
}