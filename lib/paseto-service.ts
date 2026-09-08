import { generateAccessToken, generateRefreshToken, verifyPasetoToken } from './paseto';
import type { UserPayload, PasetoPayload } from '@/types/auth';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

/**
 * Helper service to issue complete access/refresh token pairs for authenticated users.
 */
export async function createAuthTokenPair(user: UserPayload): Promise<TokenPair> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user),
    generateRefreshToken(user),
  ]);

  return {
    accessToken,
    refreshToken,
    expiresInSeconds: 3600, // 1 hour
  };
}

/**
 * Decrypts and validates an incoming access or refresh token payload.
 */
export async function validateTokenClaims(token: string): Promise<PasetoPayload | null> {
  try {
    return await verifyPasetoToken<PasetoPayload>(token);
  } catch (err) {
    console.error('[PASETO_SERVICE_ERROR] Token validation failed:', err);
    return null;
  }
}
