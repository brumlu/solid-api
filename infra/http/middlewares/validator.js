import { ZodError } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      // Adicionamos uma verificação de segurança (Optional Chaining) 
      // e um fallback para array vazio caso error.errors seja undefined
      const details = (error.errors || []).map(err => ({
        path: err.path ? err.path[0] : 'campo',
        message: err.message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Dados inválidos',
        details: details
      });
    }

    // Se não for um erro do Zod, jogue para o Error Handler Global 
    // em vez de retornar 500 manualmente aqui.
    next(error);
  }
};