import { isRedisEnabled, redisDel, redisGet, redisSet } from "../lib/redis";

/**
 * Cache em duas camadas.
 *
 * L1 é um Map no processo — barato e sempre presente. L2 é o Redis, ativado
 * apenas quando `REDIS_URL` existe, e serve para compartilhar o resultado entre
 * réplicas. Se o Redis cair, a L1 continua respondendo sozinha.
 */

type CacheEntry<T> = {
  value: T;
  expiry: number;
};

const cache = new Map<string, CacheEntry<any>>();
const CLEANUP_INTERVAL = 60_000;
const KEY_PREFIX = "kwk:cache:";

export async function cacheWrap<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const local = cache.get(key);

  if (local && local.expiry > now) {
    return local.value;
  }

  const shared = await redisGet<T>(`${KEY_PREFIX}${key}`);
  if (shared !== null) {
    cache.set(key, { value: shared, expiry: now + ttlMs });
    return shared;
  }

  const value = await fn();
  cache.set(key, { value, expiry: now + ttlMs });
  await redisSet(`${KEY_PREFIX}${key}`, value, ttlMs);

  return value;
}

export function clearCache(): void {
  cache.clear();

  // Best-effort: não bloqueia o encerramento nem quebra se o Redis sumir.
  void redisDel(`${KEY_PREFIX}*`);

  if (process.env.NODE_ENV === "development") {
    console.log("🧹 Cache cleared manually.");
  }
}

export const cacheLayers = (): string[] =>
  isRedisEnabled() ? ["memory", "redis"] : ["memory"];

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiry <= now) {
      cache.delete(key);
    }
  }
}, CLEANUP_INTERVAL).unref();
