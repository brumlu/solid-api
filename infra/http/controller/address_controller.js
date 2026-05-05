export class AddressController {
  constructor(useCases) {
    this.useCases = useCases;

    // Auto-bind de todos os métodos
    this.adicionar = this.adicionar.bind(this);
    this.listarMeusEnderecos = this.listarMeusEnderecos.bind(this);
    this.deletar = this.deletar.bind(this);
    this.buscarEnderecoPadrao = this.buscarEnderecoPadrao.bind(this);
    this.buscarPorId = this.buscarPorId.bind(this);
    this.definirEnderecoPadrao = this.definirEnderecoPadrao.bind(this);
  }

  /**
   * POST /addresses
   */
  async adicionar(req, res) {
    const userId = req.user.id;
    const { 
      street, 
      number, 
      complement, 
      neighborhood, 
      city, 
      state, 
      zipCode, 
      isDefault 
    } = req.body;

    const result = await this.useCases.addAddress.execute({
      userId,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      isDefault
    });

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    return res.status(201).json({
      message: "Endereço cadastrado com sucesso",
      address: result.value
    });
  }

  /**
   * GET /addresses
   */
  async listarMeusEnderecos(req, res) {
    const userId = req.user.id;

    const result = await this.useCases.listAddresses.execute(userId);

    // Como o ListUserAddressesUseCase agora retorna Either
    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Lista de endereços recuperada",
      addresses: result.value
    });
  }

  /**
   * GET /addresses/default
   */
  async buscarEnderecoPadrao(req, res) {
    const userId = req.user.id;

    const result = await this.useCases.getDefaultAddress.execute(userId);

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.statusCode || 404).json({ message: error.message });
    }

    return res.status(200).json({
      address: result.value
    });
  }

  /**
   * PATCH /users/default-address
   */
  async definirEnderecoPadrao(req, res) {
    const userId = req.user.id;
    const { addressId } = req.body;

    const result = await this.useCases.setDefaultAddress.execute({ userId, addressId });

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Endereço padrão atualizado com sucesso"
    });
  }

  /**
   * DELETE /addresses/:id
   */
  async deletar(req, res) {
    const userId = req.user.id;
    const { id: addressId } = req.params;
    const userRole = req.user.role;

    const result = await this.useCases.deleteAddress.execute({ 
      userId, 
      addressId, 
      userRole 
    });

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.statusCode || 400).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Endereço removido com sucesso"
    });
  }

  /**
   * GET /addresses/:id
   */
  async buscarPorId(req, res) {
    const { id: addressId } = req.params;

    const result = await this.useCases.getAddressById.execute(addressId);

    if (result.isLeft()) {
      const error = result.value;
      return res.status(error.statusCode || 404).json({ message: error.message });
    }

    return res.status(200).json({
      message: "Endereço encontrado",
      address: result.value
    });
  }
}