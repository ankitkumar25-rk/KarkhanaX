import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { clearAuthCookies, getRefreshTokenCookie } from '@/lib/cookies';
import { apiSuccess } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(_request: NextRequest) {
  try {
    const refreshToken = await getRefreshTokenCookie();

    if (refreshToken) {
      // Delete refresh token from DB if present
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Clear authentication cookies
    await clearAuthCookies();

    return apiSuccess(null, 'Logged out successfully', 200);
  } catch (err) {
    return handleApiError(err);
  }
}

