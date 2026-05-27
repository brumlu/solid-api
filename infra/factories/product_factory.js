import { ProductRepository } from '../../repository/prisma_product_repository.js';
import {
  CreateProductUseCase,
  ListProductsUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase,
  UpdateProductStockUseCase,
  UpdateProductPriceUseCase
} from '../../usecase/product/index.js';
import { ProductController } from '../http/controller/product_controller.js';

// Instância de Infra (Compartilhada)
const productRepository = new ProductRepository();

export const makeProductController = () => {
  // Agrupamento de casos de uso
  const useCases = {
    createProduct: new CreateProductUseCase(productRepository),
    listProducts: new ListProductsUseCase(productRepository),
    updateProduct: new UpdateProductUseCase(productRepository),
    deleteProduct: new DeleteProductUseCase(productRepository),
    updateStock: new UpdateProductStockUseCase(productRepository),
    updatePrice: new UpdateProductPriceUseCase(productRepository)
  };

  // Retorna o controller pronto
  return new ProductController(useCases);
};