import zod from 'zod';

const z = zod;

export const loginUserSchema = z.object({
  email: z.string()
    .email("Formato de e-mail inválido")
    .min(1, "O e-mail é obrigatório"),
  password: z.string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
});

export const createUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras"),
  password: z.string().min(8, "A senha deve ser forte (mínimo 8 caracteres)")
});

// Schema para atualização de perfil (Nome e Email)
export const updateProfileSchema = z.object({
  email: z.string().email("E-mail inválido"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 letras")
});

// Schema para atualização de senha
export const updatePasswordSchema = z.object({
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres")
});