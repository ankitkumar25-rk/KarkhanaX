import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import redis from './redis';

const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

/**
 * Generates a cryptographically secure 6-digit OTP string.
 */
export function generateNumericOtp(): string {
  const randomInt = crypto.randomInt(100000, 999999);
  return randomInt.toString();
}

/**
 * Stores hashed OTP in Redis associated with the user email or phone number.
 */
export async function storeOtp(identifier: string, otp: string): Promise<void> {
  const key = `otp:${identifier.toLowerCase()}`;
  const hash = await bcrypt.hash(otp, 10);

  await redis.set(key, hash, 'EX', OTP_TTL_SECONDS);
}

/**
 * Verifies if user provided OTP matches the stored hash in Redis.
 */
export async function verifyOtp(identifier: string, otp: string): Promise<boolean> {
  const key = `otp:${identifier.toLowerCase()}`;
  const storedHash = await redis.get(key);

  if (!storedHash) {
    return false;
  }

  const isValid = await bcrypt.compare(otp, storedHash);
  if (isValid) {
    // Delete OTP after successful verification to prevent replay
    await redis.del(key);
  }

  return isValid;
}

