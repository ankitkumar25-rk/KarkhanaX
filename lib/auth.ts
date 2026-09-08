import { NextRequest } from 'next/server';
import { getAccessTokenCookie } from './cookies';
import { validateTokenClaims } from './paseto-service';
import prisma from './prisma';
import type { UserPayload } from '@/types/auth';

/**
 * Extracts and verifies PASETO auth token from request cookies or Authorization header.
 * Returns the authenticated user record from database, or null if unauthenticated.
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<UserPayload | null> {
  try {
    let token: string | undefined;

    // 1. Try extracting token from Request Authorization header
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // 2. Fallback to extracting token from httpOnly cookie
    if (!token) {
      token = await getAccessTokenCookie();
    }

    if (!token) {
      return null;
    }

    // 3. Validate PASETO claims
    const claims = await validateTokenClaims(token);
    if (!claims || !claims.sub) {
      return null;
    }

    // 4. Retrieve active user from database
    const user = await prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        avatarUrl: true,
        isBanned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.isBanned) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error('[AUTH_HELPER_ERROR] Verification failed:', err);
    return null;
  }
}

