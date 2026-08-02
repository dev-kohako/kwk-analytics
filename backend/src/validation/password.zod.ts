import { z } from "zod";

export const RequestResetInput = z.object({
  email: z.string().trim().email("E-mail inválido.").max(255),
});

export const ResetPasswordInput = z.object({
  token: z.string().min(10, "Link inválido."),
  password: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres.")
    .max(200, "Senha longa demais."),
});
