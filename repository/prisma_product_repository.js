import prisma from '../infra/database/prisma.js';
import { PrismaClient, Prisma } from '@prisma/client'
import { Product } from '../model/entities/Product.js'; 

export class ProductRepository {
  
  // Transforma o objeto do Prisma em uma Entidade de Domínio (Mapping)
  #mapToEntity(productData) {
    if (!productData) return null;
    return new Product({
      id: productData.id,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      stock: productData.stock,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt
    });
  }

  // --- MÉTODOS DE BUSCA ---

  async findById(id) {
    const productData = await prisma.products.findUnique({ 
      where: { id: Number(id) } 
    });
    return this.#mapToEntity(productData);
  }

  async findAll() {
    const products = await prisma.products.findMany();
    return products.map(product => this.#mapToEntity(product));
  }

  // --- MÉTODOS DE ESCRITA ---

  async create(productEntity) {
    const createdProduct = await prisma.products.create({
      data: {
        name: productEntity.name,
        description: productEntity.description,
        price: new Prisma.Decimal(productEntity.price), // Garantindo o formato Decimal
        stock: productEntity.stock || 0
      },
    });

    return this.#mapToEntity(createdProduct);
  }

  async update(id, data) {

    const updateData = { ...data };
    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price);
    }

    const updatedProduct = await prisma.products.update({
      where: { id: Number(id) },
      data: updateData
    });

    return this.#mapToEntity(updatedProduct);
  }

  async delete(id) {
    const deletedProduct = await prisma.products.delete({
      where: { id: Number(id) }
    });
    return this.#mapToEntity(deletedProduct);
  }
}