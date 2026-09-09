import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { addressSchema } from '@/lib/validations/auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { handleApiError } from '@/lib/error-handler';

/**
 * GET /api/users/addresses - Retrieve authenticated user's saved addresses
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized access', 401);
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return apiSuccess(addresses, 'Addresses retrieved successfully', 200);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/users/addresses - Add a new delivery address
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return apiError('Unauthorized access', 401);
    }

    const body = await request.json();
    const validatedData = addressSchema.parse(body);

    // If setting as default, unmark other default addresses for user
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    // Check if user has no existing addresses, make first one default
    const existingCount = await prisma.address.count({ where: { userId: user.id } });
    const isDefault = existingCount === 0 ? true : Boolean(validatedData.isDefault);

    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: user.id,
        isDefault,
      },
    });

    return apiSuccess(address, 'Address created successfully', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

