import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string({
    required_error: "O ID do produto é obrigatório",
  }).uuid({ message: "O ID do produto deve ser um UUID válido" }),
  
  // Use o .pipe() ou apenas force o required_error no z.number
  quantity: z.number({
    required_error: "A quantidade é obrigatória",
    invalid_type_error: "A quantidade deve ser um número",
  }).min(1, { message: "A quantidade mínima é 1" })
});