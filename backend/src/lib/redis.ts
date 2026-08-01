import Redis from "ioredis";

/**
 * Cliente Redis opcional.
 *
 * Só é criado quando `REDIS_URL` existe. Qualquer falha (URL inválida, servidor
 * fora do ar, timeout) desliga o cliente em definitivo e o cache volta a ser
 * in-memory — o Redis é aceleração, nunca dependência para a API responder.
 */

let client: Redis | null = null;
let disabled = false;

export function getRedis(): Redis | null {
  if (disabled) return null;
  if (client) return client;

  const url = process.env.REDIS_URL;
  if (!url) {
    disabled = true;
    return null;
  }

  try {
    client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 2_000,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1_000)),
    });

    client.on("error", (err) => {
      if (!disabled) {
        console.warn(`[redis] indisponível (${err.message}) — usando cache in-memory.`);
        disabled = true;
      }
    });

    client.on("ready", () => console.log("✅ Redis conectado."));

    return client;
  } catch (err) {
    console.warn(`[redis] falha ao inicializar: ${(err as Error).message}`);
    disabled = true;
    return null;
  }
}

export const isRedisEnabled = (): boolean => Boolean(getRedis());

export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  ttlMs: number
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), "PX", Math.max(1, ttlMs));
  } catch {
    // Cache é best-effort: falha ao gravar não pode derrubar a requisição.
  }
}

export async function redisDel(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // idem
  }
}

export async function closeRedis(): Promise<void> {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  } finally {
    client = null;
    disabled = true;
  }
}
