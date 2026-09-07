import redis from './redis';

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`[CACHE_ERROR] Get failed for key ${key}:`, err);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, 'EX', ttlSeconds);
  } catch (err) {
    console.error(`[CACHE_ERROR] Set failed for key ${key}:`, err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error(`[CACHE_ERROR] Delete failed for key ${key}:`, err);
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error(`[CACHE_ERROR] Delete pattern failed for ${pattern}:`, err);
  }
}
