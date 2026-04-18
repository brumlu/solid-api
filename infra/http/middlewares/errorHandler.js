// infra/http/middlewares/error_handler.js
import { AppError } from '../../../model/errors/AppError.js';

export function errorHandler(err, req, res, next) {
  // Se for um erro que nós criamos (instância de AppError)
  if (err instanceof AppError || err.statusCode) {
    return res.status(err.statusCode || 400).json({
      message: err.message
    });
  }

  // Se cair aqui, é um erro inesperado (Bug ou Banco fora do ar)
  console.error(' [ERRO NÃO TRATADO]:', err);

  return res.status(500).json({
    message: 'Ocorreu um erro interno no servidor.'
  });
}