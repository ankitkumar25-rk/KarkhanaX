import { applySecurityHeaders } from '@/lib/security-headers';
import { generateCsrfToken, verifyCsrfToken } from '@/lib/csrf';

describe('Security & Header Verification Test Suite', () => {
  it('should apply required security headers to response', () => {
    const headers = new Headers();
    applySecurityHeaders(headers);

    expect(headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Strict-Transport-Security')).toContain('max-age=');
  });

  it('should generate and verify double-submit CSRF tokens', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);

    const isValid = verifyCsrfToken(token, token);
    expect(isValid).toBe(true);

    const isInvalid = verifyCsrfToken(token, 'invalid-token-string');
    expect(isInvalid).toBe(false);
  });
});
