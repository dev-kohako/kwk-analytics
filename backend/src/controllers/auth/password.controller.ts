import prisma from "../../lib/prisma";
import { AppError } from "../../utils/errors";
import { sendMail } from "../../lib/mail";
import {
  hashPassword,
  hashToken,
  normalizeEmail,
  randomToken,
  resetExpiresAt,
} from "../../lib/auth";

/**
 * Redefinição de senha.
 *
 * O pedido responde sempre a mesma coisa, exista ou não a conta: distinguir os
 * dois casos transforma o formulário num verificador de e-mails cadastrados.
 * O token vai por e-mail e só o hash fica no banco.
 */

const appUrl = (): string =>
  (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");

function corpo(nome: string, link: string): { text: string; html: string } {
  const text = [
    `Olá, ${nome}.`,
    "",
    "Recebemos um pedido para redefinir a senha da sua conta no KWK Analytics.",
    "Abra o endereço abaixo para escolher uma nova senha. O link vale por 30 minutos.",
    "",
    link,
    "",
    "Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.",
  ].join("\n");

  const html = `
    <p>Olá, ${nome}.</p>
    <p>Recebemos um pedido para redefinir a senha da sua conta no KWK Analytics.</p>
    <p><a href="${link}">Escolher uma nova senha</a> — o link vale por 30 minutos.</p>
    <p style="color:#666">Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.</p>
  `.trim();

  return { text, html };
}

/** Devolve sempre true. Ver observação sobre enumeração de contas acima. */
export async function requestPasswordReset(email: string): Promise<boolean> {
  const user = await prisma.app_user.findFirst({
    where: { email: normalizeEmail(email) },
  });

  if (!user) return true;

  // Invalida pedidos anteriores ainda abertos: só o link mais recente vale.
  await prisma.password_reset.updateMany({
    where: { user_id: user.id, used_at: null },
    data: { used_at: new Date() },
  });

  const token = randomToken();

  await prisma.password_reset.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(token),
      expires_at: resetExpiresAt(),
    },
  });

  const link = `${appUrl()}/redefinir-senha?token=${token}`;
  const { text, html } = corpo(user.name, link);

  await sendMail({
    to: user.email,
    subject: "Redefinir a senha — KWK Analytics",
    text,
    html,
  });

  return true;
}

export async function resetPassword(
  token: string,
  novaSenha: string
): Promise<boolean> {
  const pedido = await prisma.password_reset.findFirst({
    where: { token_hash: hashToken(token), used_at: null },
    orderBy: { created_at: "desc" },
  });

  if (!pedido || pedido.expires_at < new Date()) {
    throw new AppError("Link inválido ou expirado. Peça um novo.", 400);
  }

  await prisma.$transaction([
    prisma.app_user.update({
      where: { id: pedido.user_id },
      data: {
        password_hash: await hashPassword(novaSenha),
        updated_at: new Date(),
      },
    }),

    prisma.password_reset.update({
      where: { id: pedido.id },
      data: { used_at: new Date() },
    }),

    // Trocar a senha derruba as sessões abertas. Se a conta foi invadida,
    // manter o invasor logado esvaziaria o sentido da redefinição.
    prisma.user_session.updateMany({
      where: { user_id: pedido.user_id, revoked_at: null },
      data: { revoked_at: new Date() },
    }),
  ]);

  return true;
}
