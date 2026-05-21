export class CartItem {
  constructor({ productId, quantity, price, name }) {
    this.productId = productId;
    this.quantity = quantity;
    this.price = price; // Guardamos o preço para cálculos
    this.name = name;
  }
}

export class Cart {
  constructor({ id, userId, items = [], createdAt, updatedAt }) {
    this.id = id;
    this.userId = userId;
    this.items = items.map(item => new CartItem(item));
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Regra de Negócio: Calcular o valor total do carrinho
  get totalValue() {
    return this.items.reduce((acc, item) => {
      return acc + (Number(item.price) * item.quantity);
    }, 0);
  }

  // Regra de Negócio: Validar se o carrinho está vazio
  isEmpty() {
    return this.items.length === 0;
  }
}