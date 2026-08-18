import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash Redis credentials are not configured.");
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    return await getRedis().get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, expirySeconds = 300): Promise<void> {
  try {
    await getRedis().setex(key, expirySeconds, JSON.stringify(value));
  } catch {
    // Fail silently — Redis is a cache, not a critical path
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {}
}
