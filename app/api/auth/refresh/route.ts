import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getRefreshTokenCookie, setAuthCookies } from '@/lib/cookies';
import { createAuthTokenPair, validateTokenClaims } from '@/lib/paseto-service';
import { apiSuccess, apiError } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(_request: NextRequest) {
  try {
    // 1. Get refresh token from cookie
    const refreshToken = await getRefreshTokenCookie();
    if (!refreshToken) {
      return apiError('Refresh token missing', 401);
    }

    // 2. Validate token format & claims
    const claims = await validateTokenClaims(refreshToken);
    if (!claims || !claims.sub) {
      return apiError('Invalid or expired refresh token', 401);
    }

    // 3. Find refresh token in DB
    const savedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!savedToken) {
      // Possible token reuse attack: Revoke all tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId: claims.sub },
      });
      return apiError('Security alert: Token reuse detected. Please log in again.', 401);
    }

    // Check expiration
    if (new Date() > savedToken.expiresAt || savedToken.user.isBanned) {
      await prisma.refreshToken.delete({ where: { id: savedToken.id } });
      return apiError('Refresh token expired', 401);
    }

    const { user } = savedToken;
    const userPayload = {
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

    // 4. Rotate tokens: Generate new pair & delete old refresh token
    const tokenPair = await createAuthTokenPair(userPayload);
    
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: savedToken.id } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: tokenPair.refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // Set new cookies
    await setAuthCookies(tokenPair.accessToken, tokenPair.refreshToken);

    return apiSuccess(
      {
        user: userPayload,
        accessToken: tokenPair.accessToken,
      },
      'Token refreshed successfully',
      200
    );
  } catch (err) {
    return handleApiError(err);
  }
}

