import prisma from "../../lib/prisma";
import { AppError } from "../../utils/errors";
import {
  hashPassword,
  hashToken,
  normalizeEmail,
  randomToken,
  refreshExpiresAt,
  signAccessToken,
  verifyPassword,
} from "../../lib/auth";

/**
 * Registro, login e sessão.
 *
 * O plano gratuito é criado junto com a conta: sem isso, todo lugar que lê
 * limite precisaria tratar "usuário sem assinatura" como caso especial.
 */

export interface SessionResult {
  accessToken: string;
  refreshToken: string;
  user: { id: number; name: string; email: string };
}

const publicUser = (u: { id: number; name: string; email: string }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
});

async function createSession(
  userId: number,
  email: string,
  userAgent?: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = randomToken();

  await prisma.user_session.create({
    data: {
      user_id: userId,
      token_hash: hashToken(refreshToken),
      user_agent: userAgent?.slice(0, 300),
      expires_at: refreshExpiresAt(),
    },
  });

  return {
    accessToken: signAccessToken({ sub: userId, email }),
    refreshToken,
  };
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  userAgent?: string;
}): Promise<SessionResult> {
  const email = normalizeEmail(input.email);

  const existente = await prisma.app_user.findFirst({ where: { email } });
  if (existente) {
    throw new AppError("Já existe uma conta com esse e-mail.", 409);
  }

  const user = await prisma.app_user.create({
    data: {
      name: input.name.trim(),
      email,
      password_hash: await hashPassword(input.password),
    },
  });

  // Toda conta nasce no plano gratuito, ativo desde já.
  await prisma.subscription.create({
    data: { user_id: user.id, plan_code: "free", status: "active" },
  });

  const tokens = await createSession(user.id, user.email, input.userAgent);
  return { ...tokens, user: publicUser(user) };
}

export async function login(input: {
  email: string;
  password: string;
  userAgent?: string;
}): Promise<SessionResult> {
  const email = normalizeEmail(input.email);
  const user = await prisma.app_user.findFirst({ where: { email } });

  // Mesma mensagem para e-mail inexistente e senha errada: distinguir os dois
  // entrega ao atacante quais e-mails estão cadastrados.
  const generico = new AppError("E-mail ou senha incorretos.", 401);

  if (!user) {
    // Gasta o tempo de um bcrypt mesmo sem usuário, para que a resposta não
    // revele pelo tempo se o e-mail existe.
    await hashPassword(input.password);
    throw generico;
  }

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) throw generico;

  const tokens = await createSession(user.id, user.email, input.userAgent);
  return { ...tokens, user: publicUser(user) };
}

export async function refreshSession(
  refreshToken: string
): Promise<{ accessToken: string }> {
  const session = await prisma.user_session.findFirst({
    where: { token_hash: hashToken(refreshToken), revoked_at: null },
    include: { app_user: true },
  });

  if (!session || session.expires_at < new Date()) {
    throw new AppError("Sessão expirada. Entre novamente.", 401);
  }

  return {
    accessToken: signAccessToken({
      sub: session.user_id,
      email: session.app_user.email,
    }),
  };
}

export async function logout(refreshToken: string): Promise<boolean> {
  const { count } = await prisma.user_session.updateMany({
    where: { token_hash: hashToken(refreshToken), revoked_at: null },
    data: { revoked_at: new Date() },
  });

  return count > 0;
}

/** Encerra todas as sessões — usado no "sair de todos os dispositivos". */
export async function logoutAll(userId: number): Promise<number> {
  const { count } = await prisma.user_session.updateMany({
    where: { user_id: userId, revoked_at: null },
    data: { revoked_at: new Date() },
  });

  return count;
}

export async function currentUser(userId: number) {
  const user = await prisma.app_user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("Conta não encontrada.", 404);

  const sub = await prisma.subscription.findFirst({
    where: { user_id: userId, status: { in: ["trialing", "active", "past_due"] } },
    include: { plan: true },
  });

  return {
    ...publicUser(user),
    createdAt: user.created_at.toISOString(),
    plan: sub
      ? {
          code: sub.plan_code,
          name: sub.plan.name,
          status: sub.status,
          trialEndsAt: sub.trial_ends_at?.toISOString() ?? null,
        }
      : null,
  };
}
