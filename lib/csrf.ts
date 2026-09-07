import crypto from 'node:crypto';

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates double-submit CSRF token (Header vs Cookie matching).
 */
export function verifyCsrfToken(cookieToken?: string, headerToken?: string): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  try {
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken);

    if (cookieBuf.length !== headerBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(cookieBuf, headerBuf);
  } catch {
    return false;
  }
}
