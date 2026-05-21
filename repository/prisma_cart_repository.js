import prisma from '../infra/database/prisma.js';
import { Cart, CartItem } from '../model/entities/Cart.js';

export class CartRepository {
  // Transforma os dados do Prisma (Cart + Items) na Entidade de Domínio Cart
  #mapToEntity(cartData) {
    if (!cartData) return null;

    return new Cart({
      id: cartData.id,
      userId: cartData.userId,
      createdAt: cartData.createdAt,
      updatedAt: cartData.updatedAt,
      // Mapea os itens internos se eles existirem na consulta
      items: cartData.items ? cartData.items.map(item => new CartItem({
        productId: item.productId,
        quantity: item.quantity,
        // Se o include do Prisma trouxe o produto, passo os dados extras
        price: item.product?.price,
        name: item.product?.name
      })) : []
    });
  }

  // --- MÉTODOS DE BUSCA ---

  async findByUserId(userId) {
    const cartData = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    return this.#mapToEntity(cartData);
  }

  // --- MÉTODOS DE ESCRITA (CARRINHO) ---

  async create(userId) {
    const createdCart = await prisma.cart.create({
      data: { userId },
      include: { items: true }
    });

    return this.#mapToEntity(createdCart);
  }

  // --- MÉTODOS DE ESCRITA (ITENS DO CARRINHO) ---

  async addItem(cartId, productId, quantity) {
    // No Prisma Client, usa-se o nome da variável do modelo (camelCase)
    await prisma.cartItem.create({
      data: {
        cartId: cartId,
        productId: productId,
        quantity: quantity
      }
    });
  }

  async updateItemQuantity(cartId, productId, newQuantity) {
    await prisma.cartItem.updateMany({
      where: {
        cartId: cartId,
        productId: productId
      },
      data: {
        quantity: newQuantity
      }
    });
  }

  async removeItem(cartId, productId) {
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cartId,
        productId: productId
      }
    });
  }
}