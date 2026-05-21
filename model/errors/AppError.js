export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    
    // Captura onde o erro ocorreu, facilitando muito o debug no terminal do Vitest
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Suas subclasses estão ótimas, pode manter como estão:
export class UserAlreadyExistsError extends AppError {
  constructor() { super('Este email já está em uso.', 409); }
}

export class InvalidCredentialsError extends AppError {
  constructor() { super('Credenciais inválidas.', 401); }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource = 'Recurso') { super(`${resource} não encontrado.`, 404); }
}

export class NotAllowedError extends AppError {
  constructor(resource = 'Acesso não permitido') { super(`${resource}`, 403); }
}