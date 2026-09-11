import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { apiSuccess, apiError } from '@/lib/api-response';

const stockAdjustmentSchema = z
  .object({
    stockQuantity: z.coerce.number().int().min(0).optional(),
    delta: z.coerce.number().int().optional(),
    operation: z.enum(['set', 'increment', 'decrement']).default('set'),
    reason: z.string().optional(),
  })
  .refine(
    (data) => data.stockQuantity !== undefined || data.delta !== undefined,
    { message: 'Either stockQuantity or delta must be provided' }
  );

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required', 401);
    }

    if (!isAdmin(currentUser)) {
      return apiError('Forbidden: Only administrators can adjust product inventory stock', 403);
    }

    const { id } = await params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
      },
    });

    if (!existingProduct) {
      return apiError('Product not found for inventory stock adjustment', 404);
    }

    const body = await req.json();
    const validationResult = stockAdjustmentSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError(
        'Stock adjustment validation failed',
        400,
        validationResult.error.format()
      );
    }

    const { stockQuantity, delta, operation } = validationResult.data;
    let newStockQuantity: number = existingProduct.stockQuantity;

    if (operation === 'set' && stockQuantity !== undefined) {
      newStockQuantity = stockQuantity;
    } else if (operation === 'increment' || (delta !== undefined && delta > 0 && operation !== 'decrement')) {
      const inc = delta !== undefined ? Math.abs(delta) : (stockQuantity ?? 0);
      newStockQuantity = existingProduct.stockQuantity + inc;
    } else if (operation === 'decrement' || (delta !== undefined && delta < 0)) {
      const dec = delta !== undefined ? Math.abs(delta) : (stockQuantity ?? 0);
      newStockQuantity = Math.max(0, existingProduct.stockQuantity - dec);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        stockQuantity: newStockQuantity,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        updatedAt: true,
      },
    });

    return apiSuccess(
      {
        id: updatedProduct.id,
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        previousStock: existingProduct.stockQuantity,
        currentStock: updatedProduct.stockQuantity,
        stockQuantity: updatedProduct.stockQuantity,
        updatedAt: updatedProduct.updatedAt,
      },
      `Product stock updated from ${existingProduct.stockQuantity} to ${updatedProduct.stockQuantity}`
    );
  } catch (err: unknown) {
    console.error('[STOCK_ADJUSTMENT_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to adjust product stock';
    return apiError(message, 500);
  }
}

