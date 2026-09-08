import type { UserPayload } from '@/types/auth';
import type { Role } from '@/types/api';

/**
 * Verifies if the authenticated user possesses the required role.
 */
export function hasRole(user: UserPayload | null | undefined, requiredRole: Role): boolean {
  if (!user) {
    return false;
  }

  return user.role === requiredRole;
}

/**
 * Enforces admin role check for protected administrative route handlers.
 */
export function isAdmin(user: UserPayload | null | undefined): boolean {
  return hasRole(user, 'ADMIN');
}

