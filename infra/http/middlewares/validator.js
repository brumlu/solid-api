import { ZodError } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    const validatedData = await schema.parseAsync(req.body);
    req.body = validatedData;
    return next();
  } catch (error) {
    if (error instanceof ZodError || error.name === 'ZodError') {
      const issues = error.issues || [];
      
      const details = issues.map(err => ({
        path: err.path ? err.path[0] : 'campo',
        message: err.message
      }));

      // Extraímos a primeira mensagem de erro para o caso do carrinho
      let firstMessage = issues[0]?.message || "Dados inválidos";
      
      // Lógica de "força-tarefa" para o caso específico do carrinho
      if (firstMessage.includes("expected number, received undefined")) {
        firstMessage = "A quantidade é obrigatória";
      }

      // Se for rota de carrinho, usamos a mensagem específica.
      // Para todas as outras rotas (produtos, usuários, etc), mantemos "Dados inválidos".
      const isCartRoute = req.originalUrl.includes('/cart');

      return res.status(400).json({
        status: 'error',
        message: isCartRoute ? firstMessage : 'Dados inválidos',
        details: details
      });
    }

    return next(error);
  }
};