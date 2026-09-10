import { V3 } from 'paseto';
import crypto from 'node:crypto';
import { env } from './env';
import type { PasetoPayload, UserPayload } from '@/types/auth';

// 32-byte symmetric key for PASETO v3 local encryption
const getSymmetricKey = (): crypto.KeyObject => {
  const secretHex = env.PASETO_SECRET_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const keyBuffer = Buffer.from(secretHex, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('[PASETO_ERROR] Secret key must be exactly 32 bytes (64 hex characters)');
  }

  return crypto.createSecretKey(keyBuffer);
};

const secretKeyObject = getSymmetricKey();

/**
 * Encrypts payload into a PASETO v3 local token with expiration.
 */
export async function createPasetoToken(
  payload: Record<string, unknown>,
  expiresIn: string = '1h'
): Promise<string> {
  const options = {
    issuer: env.PASETO_ISSUER || 'karkhanax-api',
    audience: env.PASETO_AUDIENCE || 'karkhanax-app',
    expiresIn,
  };

  return await V3.encrypt(payload, secretKeyObject, options);
}

/**
 * Decrypts and verifies a PASETO v3 local token.
 */
export async function verifyPasetoToken<T = PasetoPayload>(token: string): Promise<T> {
  const options = {
    issuer: env.PASETO_ISSUER || 'karkhanax-api',
    audience: env.PASETO_AUDIENCE || 'karkhanax-app',
  };

  const payload = await V3.decrypt(token, secretKeyObject, options);
  return payload as unknown as T;
}

/**
 * Generates an Access Token for an authenticated user (1 hour expiration).
 */
export async function generateAccessToken(user: UserPayload): Promise<string> {
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return createPasetoToken(payload, '1h');
}

/**
 * Generates a Refresh Token for session renewal (15 days expiration).
 */
export async function generateRefreshToken(user: UserPayload): Promise<string> {
  const payload = {
    sub: user.id,
    type: 'refresh',
  };

  return createPasetoToken(payload, '15d');
}
