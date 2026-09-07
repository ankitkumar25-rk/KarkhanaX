import redis from './redis';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Sliding window rate limiter backed by Redis.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    return {
      allowed: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      resetSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (err) {
    console.error('[RATELIMIT_ERROR] Rate limiting check failed:', err);
    // Fallback to allow if Redis is unavailable
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetSeconds: windowSeconds,
    };
  }
}
