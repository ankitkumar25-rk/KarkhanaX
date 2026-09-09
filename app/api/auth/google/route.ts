import { NextRequest } from 'next/server';
import { verifyAndProvisionGoogleUser } from '@/lib/google-oauth';
import { createAuthTokenPair } from '@/lib/paseto-service';
import { setAuthCookies } from '@/lib/cookies';
import { apiSuccess, apiError } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { googleId, email, name, picture } = body;

    if (!googleId || !email || !name) {
      return apiError('Missing required Google profile fields', 400);
    }

    // Provision or find Google user
    const userPayload = await verifyAndProvisionGoogleUser({
      googleId,
      email,
      name,
      picture,
    });

    // Check if account is banned
    const dbUser = await prisma.user.findUnique({ where: { id: userPayload.id } });
    if (dbUser?.isBanned) {
      return apiError('Account has been suspended. Please contact support.', 403);
    }

    // Issue PASETO token pair & set cookies
    const tokenPair = await createAuthTokenPair(userPayload);
    await setAuthCookies(tokenPair.accessToken, tokenPair.refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: userPayload.id,
        token: tokenPair.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return apiSuccess(
      {
        user: userPayload,
        accessToken: tokenPair.accessToken,
      },
      'Google authentication successful',
      200
    );
  } catch (err) {
    return handleApiError(err);
  }
}

