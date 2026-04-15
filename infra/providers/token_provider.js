import jwt from 'jsonwebtoken';

export class TokenProvider {
  generate(payload) {
    const secret = process.env.JWT_SECRET;

    // Validação de Segurança Crítica
    if (!secret) {
      console.error("JWT_SECRET não encontrada no process.env");
      throw new Error("Erro interno de configuração de segurança.");
    }

    const options = {
      expiresIn: '1d', // Expiração de 24 horas
    };

    return jwt.sign(payload, secret, options);
  }

  verify(token) {
    try {
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new Error("JWT_SECRET não configurada.");
      }

      return jwt.verify(token, secret);
    } catch (error) {
      // Se o token for inválido, expirado ou a chave estiver errada, retorna null
      return null;
    }
  }
}