import { z } from "zod";

/**
 * Validação das entradas de conta.
 *
 * A regra de senha é deliberadamente simples: comprimento mínimo de verdade,
 * sem exigir símbolo ou maiúscula. Regra complexa demais empurra a pessoa para
 * "Senha123!" — previsível — em vez de uma senha longa, que é o que protege.
 */

export const RegisterInput = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  email: z.string().trim().email("E-mail inválido.").max(255),
  password: z
    .string()
    .min(8, "A senha precisa ter ao menos 8 caracteres.")
    .max(200, "Senha longa demais."),
});

export const LoginInput = z.object({
  email: z.string().trim().email("E-mail inválido.").max(255),
  password: z.string().min(1, "Informe a senha."),
});

export const RefreshInput = z.object({
  refreshToken: z.string().min(10, "Token inválido."),
});
