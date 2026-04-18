export class PublicUserController {
  constructor(createUserUseCase, loginUserUseCase) {
    this.createUserUseCase = createUserUseCase;
    this.loginUserUseCase = loginUserUseCase;

    // Garante que o 'this' funcione nas rotas
    this.cadastro = this.cadastro.bind(this);
    this.login = this.login.bind(this);
  }

  async cadastro(req, res) {
    const { email, name, password } = req.body;

    const result = await this.createUserUseCase.execute({ email, name, password });

    if (result.isLeft()) {
      throw result.value; // Lança o UserAlreadyExistsError ou erro de validação
    }

    const user = result.value;

    return res.status(201).json({ 
      message: 'Usuário cadastrado com sucesso',
      userId: user.id 
    });
  }

  async login(req, res) {
    const { email, password } = req.body;

    const result = await this.loginUserUseCase.execute({ email, password });

    if (result.isLeft()) {
      throw result.value; // Lança o InvalidCredentialsError (401)
    }

    const { token } = result.value;
    return res.status(200).json({ token });
  }
}