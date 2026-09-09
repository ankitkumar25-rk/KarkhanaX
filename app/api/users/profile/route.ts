import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { updateProfileSchema } from '@/lib/validations/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

/**
 * GET /api/users/profile - Returns authenticated user details
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized access', 401);
    }

    return apiSuccess(user, 'User profile retrieved successfully', 200);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PUT /api/users/profile - Updates authenticated user details
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized access', 401);
    }

    const body = await request.json();
    const { name, phone, avatarUrl } = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isVerified: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const userPayload = {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return apiSuccess(userPayload, 'User profile updated successfully', 200);
  } catch (err) {
    return handleApiError(err);
  }
}

