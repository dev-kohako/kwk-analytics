import { z } from "zod";

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual."),
  newPassword: z
    .string()
    .min(8, "A nova senha precisa ter ao menos 8 caracteres.")
    .max(200, "Senha longa demais."),
});

export const UpdateProfileInput = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
});
