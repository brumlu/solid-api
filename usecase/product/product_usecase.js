import { Product } from '../../model/entities/Product.js';
import { left, right } from '../../shared/core/Either.js';
import { 
  ResourceNotFoundError,
  AppError 
} from '../../model/errors/AppError.js';

export class CreateProduct {
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

export class ListProducts {
  constructor(productRepository) { 
    this.productRepository = productRepository; 
  }

  async execute() { 
    const products = await this.productRepository.findAll();
    return right(products);
  }
}

export class UpdateProduct {
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

export class DeleteProduct {
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

export class UpdateProductStock {
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