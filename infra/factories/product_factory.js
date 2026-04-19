import { ProductRepository } from '../../repository/prisma_product_repository.js';
import { 
  CreateProduct, 
  ListProducts, 
  UpdateProduct, 
  DeleteProduct,
  UpdateProductStock,
  UpdateProductPrice
} from '../../usecase/product/product_usecase.js';

import { ProductController } from '../http/controller/product_controller.js';

// Instância de Infra (Compartilhada)
const productRepository = new ProductRepository();

export const makeProductController = () => {
  // Agrupamento de casos de uso
  const useCases = {
    createProduct: new CreateProduct(productRepository),
    listProducts: new ListProducts(productRepository),
    updateProduct: new UpdateProduct(productRepository),
    deleteProduct: new DeleteProduct(productRepository),
    updateStock: new UpdateProductStock(productRepository),
    updatePrice: new UpdateProductPrice(productRepository)
  };

  // Retorna o controller pronto
  return new ProductController(useCases);
};