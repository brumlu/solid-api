export class CartController {
  constructor(useCases) {
    this.useCases = useCases;
    // Bind necessário para não perder o contexto do 'this' nas rotas do Express
    this.adicionarItem = this.adicionarItem.bind(this);
    this.obterCarrinho = this.obterCarrinho.bind(this);
    this.removerItem = this.removerItem.bind(this);
  }

async adicionarItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const result = await this.useCases.addProductToCart.execute({
      userId, productId, quantity
    });

    if (result.isLeft()) {
      return next(result.value);
    }

    return res.status(201).json({
      message: "Produto adicionado ao carrinho",
      cart: result.value
    });
  } catch (error) {
    // ESSA LINHA SALVA O TESTE: Se algo explodir, manda pro errorHandler
    // e evita o status 500 genérico.
    next(error); 
  }
}

  async obterCarrinho(req, res, next) {
    const userId = req.user.id;
    const result = await this.useCases.getUserCart.execute(userId);

    if (result.isLeft()) {
      return next(result.value);
    }

    return res.status(200).json({
      message: "Carrinho recuperado com sucesso",
      cart: result.value
    });
  }

  async removerItem(req, res, next) {
    const userId = req.user.id;
    const { productId } = req.params;

    const result = await this.useCases.removeItemFromCart.execute({
      userId, productId
    });

    if (result.isLeft()) {
      return next(result.value);
    }

    return res.status(200).json({
      message: "Item removido do carrinho",
      cart: result.value
    });
  }
}