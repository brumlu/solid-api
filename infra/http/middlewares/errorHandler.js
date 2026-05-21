import { AppError } from '../../../model/errors/AppError.js';

export function errorHandler(err, req, res, next) {
  // 1. Checagem para ZodError usando 'issues' que é o padrão do Zod
  if (err.name === 'ZodError' || err.issues) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      message: issues[0]?.message || "Erro de validação",
      errors: issues
    });
  }

  // 2. Erros conhecidos (AppError)
  if (err instanceof AppError || (err.statusCode && err.message)) {
    return res.status(err.statusCode || 400).json({
      message: err.message
    });
  }

  // 3. Log de escape
  console.error('--- DEBUG ERROR ---', err);

  return res.status(500).json({
    message: 'Ocorreu um erro interno no servidor.'
  });
}