import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Primitivas de autenticação.
 *
 * Duas regras que valem para tudo aqui: senha nunca é guardada, só o hash
 * bcrypt; e token de sessão ou de redefinição nunca é guardado em claro, só o
 * SHA-256 dele. Assim, vazar a tabela não dá acesso a conta nenhuma.
 */

const BCRYPT_ROUNDS = 12;

/** Token de acesso curto. Sessão longa fica no refresh, que é revogável. */
const ACCESS_TTL = "15m";
const REFRESH_TTL_DAYS = 30;
const RESET_TTL_MINUTES = 30;

export interface AccessPayload {
  sub: number;
  email: string;
}

function secret(): string {
  const value = process.env.JWT_SECRET;

  // Em produção, subir sem segredo definido é falha de configuração, não um
  // detalhe a contornar com valor padrão.
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET não definida — obrigatória em produção.");
    }
    return "desenvolvimento-inseguro";
  }

  return value;
}

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, BCRYPT_ROUNDS);

export const verifyPassword = (
  plain: string,
  hash: string
): Promise<boolean> => bcrypt.compare(plain, hash);

export const signAccessToken = (payload: AccessPayload): string =>
  jwt.sign(payload, secret(), { expiresIn: ACCESS_TTL });

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const payload = jwt.verify(token, secret());
    if (typeof payload === "string") return null;

    const { sub, email } = payload as Record<string, unknown>;
    if (typeof sub !== "number" || typeof email !== "string") return null;

    return { sub, email };
  } catch {
    return null;
  }
}

/** Guardamos o hash; o valor em claro só existe na resposta ao cliente. */
export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const randomToken = (): string => randomBytes(32).toString("hex");

export const refreshExpiresAt = (): Date =>
  new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000);

export const resetExpiresAt = (): Date =>
  new Date(Date.now() + RESET_TTL_MINUTES * 60_000);

/** E-mail é comparado sempre normalizado — o índice do banco usa lower(). */
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();
