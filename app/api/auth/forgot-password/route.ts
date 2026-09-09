import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { apiSuccess } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message to prevent account enumeration
    if (!user) {
      return apiSuccess(
        null,
        'If an account exists with that email, a password reset link has been sent.',
        200
      );
    }

    // Delete existing reset tokens for user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Create new password reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log(`[PASSWORD_RESET] Token for ${user.email}: ${token}`);

    return apiSuccess(
      null,
      'If an account exists with that email, a password reset link has been sent.',
      200
    );
  } catch (err) {
    return handleApiError(err);
  }
}

