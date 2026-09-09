import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return apiError('Invalid or expired password reset token', 400);
    }

    if (new Date() > resetTokenRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
      return apiError('Password reset token has expired', 400);
    }

    // Hash new password and update user record
    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetTokenRecord.userId },
        data: {
          passwordHash,
          isVerified: true,
        },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } }),
    ]);

    return apiSuccess(null, 'Password has been updated successfully. Please log in.', 200);
  } catch (err) {
    return handleApiError(err);
  }
}

