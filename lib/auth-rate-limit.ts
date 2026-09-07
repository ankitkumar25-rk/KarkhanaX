import { checkRateLimit, RateLimitResult } from './rate-limit';

/**
 * Strict rate limiter for authentication, login, and password recovery endpoints
 * (Max 5 attempts per 15-minute window).
 */
export async function checkAuthRateLimit(ipAddress: string): Promise<RateLimitResult> {
  const identifier = `auth:${ipAddress}`;
  const limit = 5;
  const windowSeconds = 15 * 60; // 15 minutes

  return checkRateLimit(identifier, limit, windowSeconds);
}
