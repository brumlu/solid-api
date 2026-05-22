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

    res.cookie('api_token', token, {
    httpOnly: true,    // Impede que o JavaScript do front-end acesse o cookie (Proteção XSS)
    secure: process.env.NODE_ENV === 'production', // Só envia via HTTPS em produção
    sameSite: 'lax', 
    maxAge: 1000 * 60 * 60 * 24, // Expira em 1 dia (ajuste conforme sua necessidade)
    path: '/',         // Disponível em todas as rotas
    });
    
    return res.status(200).json({ 
        message: 'Login realizado com sucesso'
      });
  }
}