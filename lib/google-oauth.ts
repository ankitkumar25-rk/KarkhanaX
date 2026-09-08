import prisma from './prisma';
import type { UserPayload } from '@/types/auth';

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Verifies Google ID token payload and finds or provisions user record in PostgreSQL.
 */
export async function verifyAndProvisionGoogleUser(
  profile: GoogleUserProfile
): Promise<UserPayload> {
  const { googleId, email, name, picture } = profile;

  // 1. Check if user exists by googleId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId }, { email }],
    },
  });

  if (!user) {
    // 2. Provision new user account
    user = await prisma.user.create({
      data: {
        email,
        name,
        googleId,
        avatarUrl: picture,
        isVerified: true,
        role: 'CUSTOMER',
      },
    });
  } else if (!user.googleId) {
    // 3. Link Google ID if user registered via email previously
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId,
        isVerified: true,
        avatarUrl: user.avatarUrl || picture,
      },
    });
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
}

