import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Limite para rotas sensíveis (ex: Login, Cadastro)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas
  skip: () => isTest,
  message: { error: "Muitas tentativas de login, tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite para rotas gerais (ex: Produtos, Carrinho)
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requisições por minuto
  skip: () => isTest,
  message: { error: "Muitas requisições, por favor, espere um pouco." },
});