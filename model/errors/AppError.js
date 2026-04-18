export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.message = message;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

// model/errors/UserErrors.js
export class UserAlreadyExistsError extends AppError {
  constructor() { super('Este email já está em uso.', 409); }
}

export class InvalidCredentialsError extends AppError {
  constructor() { super('Credenciais inválidas.', 401); }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource = 'Recurso') { super(`${resource} não encontrado.`, 404); }
}