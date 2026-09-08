import { generateAccessToken, verifyPasetoToken } from '@/lib/paseto';
import { hasRole, isAdmin } from '@/lib/rbac';
import type { UserPayload } from '@/types/auth';

describe('PASETO & RBAC Unit Test Suite', () => {
  const sampleUser: UserPayload = {
    id: 'usr_test_123',
    email: 'test@karkhanax.com',
    name: 'Test User',
    role: 'CUSTOMER',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const adminUser: UserPayload = {
    ...sampleUser,
    id: 'usr_admin_456',
    email: 'admin@karkhanax.com',
    role: 'ADMIN',
  };

  it('should generate and decrypt a valid PASETO access token', async () => {
    const token = await generateAccessToken(sampleUser);
    expect(typeof token).toBe('string');
    expect(token.startsWith('v4.public.') || token.startsWith('v4.local.')).toBe(true);

    const decoded = await verifyPasetoToken<{ sub: string; email: string; role: string }>(token);
    expect(decoded.sub).toBe(sampleUser.id);
    expect(decoded.email).toBe(sampleUser.email);
    expect(decoded.role).toBe('CUSTOMER');
  });

  it('should validate RBAC customer and admin permissions', () => {
    expect(hasRole(sampleUser, 'CUSTOMER')).toBe(true);
    expect(hasRole(sampleUser, 'ADMIN')).toBe(false);
    expect(isAdmin(sampleUser)).toBe(false);

    expect(hasRole(adminUser, 'ADMIN')).toBe(true);
    expect(isAdmin(adminUser)).toBe(true);
  });
});

