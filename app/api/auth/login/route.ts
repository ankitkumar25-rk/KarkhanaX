import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { createAuthTokenPair } from '@/lib/paseto-service';
import { setAuthCookies } from '@/lib/cookies';
import { loginSchema } from '@/lib/validations/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';
import { checkAuthRateLimit } from '@/lib/auth-rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Check Rate Limiting
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkAuthRateLimit(ip);
    if (!rateLimit.allowed) {
      return apiError('Too many login attempts. Please try again later.', 429);
    }

    // 2. Validate Body
    const body = await request.json();
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // 3. Find User
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return apiError('Invalid email or password', 401);
    }

    if (user.isBanned) {
      return apiError('Account has been suspended. Please contact support.', 403);
    }

    // 4. Verify Password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return apiError('Invalid email or password', 401);
    }

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

    // 5. Generate Tokens & Set Cookies
    const tokenPair = await createAuthTokenPair(userPayload);
    await setAuthCookies(tokenPair.accessToken, tokenPair.refreshToken);

    // Save refresh token record to DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokenPair.refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return apiSuccess(
      {
        user: userPayload,
        accessToken: tokenPair.accessToken,
      },
      'Login successful',
      200
    );
  } catch (err) {
    return handleApiError(err);
  }
}
