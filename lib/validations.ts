import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email({
    message: "Email inválido.",
  }),
  password: z.string().min(1, {
    message: "A senha é obrigatória.",
  }),
})
