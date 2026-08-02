import { verifyAccessToken } from "../lib/auth";

/**
 * Contexto da requisição.
 *
 * Antes devolvia um objeto vazio — não havia usuário nem IP, o que deixava o
 * rate limit com um balde único para todo mundo. Agora carrega a identidade
 * quando o Authorization traz um token válido, e o IP sempre.
 */

export interface GraphQLContext {
  userId: number | null;
  email: string | null;
  ip: string;
  userAgent?: string;
}

interface ExpressLike {
  req?: {
    headers?: Record<string, string | string[] | undefined>;
    ip?: string;
    socket?: { remoteAddress?: string };
  };
}

const primeiro = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

export const createContext = async ({
  req,
}: ExpressLike = {}): Promise<GraphQLContext> => {
  const headers = req?.headers ?? {};
  const authorization = primeiro(headers.authorization) ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : null;

  const payload = token ? verifyAccessToken(token) : null;

  // Atrás de proxy (Render, Vercel) o IP real vem no X-Forwarded-For.
  const forwarded = primeiro(headers["x-forwarded-for"]);
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req?.ip ||
    req?.socket?.remoteAddress ||
    "desconhecido";

  return {
    userId: payload?.sub ?? null,
    email: payload?.email ?? null,
    ip,
    userAgent: primeiro(headers["user-agent"]),
  };
};
