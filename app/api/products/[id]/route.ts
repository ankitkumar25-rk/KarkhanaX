import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { apiSuccess, apiError } from '@/lib/api-response';

const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  slug: z.string().optional(),
  description: z.string().min(1).optional(),
  price: z.coerce.number().positive().optional(),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  costPrice: z.coerce.number().positive().nullable().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  unit: z.string().optional(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  materialGrade: z.string().nullable().optional(),
  thicknessMm: z.coerce.number().positive().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  weightKg: z.coerce.number().positive().nullable().optional(),
  finishType: z.string().nullable().optional(),
  categoryId: z.string().uuid().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        publicId: z.string().optional().nullable(),
        altText: z.string().optional().nullable(),
        sortOrder: z.coerce.number().int().default(0),
      })
    )
    .optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, parentId: true },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { reviews: true, wishlistItems: true },
        },
      },
    });

    if (!product) {
      return apiError('Product not found', 404);
    }

    const currentUser = await getAuthenticatedUser(req);

    // Hide inactive products from public users
    if (!product.isActive && (!currentUser || !isAdmin(currentUser))) {
      return apiError('Product not found or unavailable', 404);
    }

    return apiSuccess(product, 'Product detail retrieved successfully');
  } catch (err: unknown) {
    console.error('[PRODUCT_DETAIL_GET_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to retrieve product detail';
    return apiError(message, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required', 401);
    }

    if (!isAdmin(currentUser)) {
      return apiError('Forbidden: Only administrators can modify products', 403);
    }

    const { id } = await params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existingProduct) {
      return apiError('Product to update was not found', 404);
    }

    const body = await req.json();
    const validationResult = updateProductSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError(
        'Product update validation failed',
        400,
        validationResult.error.format()
      );
    }

    const data = validationResult.data;

    // Check category existence if categoryId is updated
    if (data.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!categoryExists) {
        return apiError(`Category '${data.categoryId}' not found`, 404);
      }
    }

    // Check slug uniqueness if slug is updated
    if (data.slug && data.slug !== existingProduct.slug) {
      const slugConflict = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugConflict) {
        return apiError(`Slug '${data.slug}' is already taken by another product`, 400);
      }
    }

    // Check SKU uniqueness if SKU is updated
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (skuConflict) {
        return apiError(`SKU '${data.sku}' is already assigned to another product`, 400);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.compareAtPrice !== undefined ? { compareAtPrice: data.compareAtPrice } : {}),
        ...(data.costPrice !== undefined ? { costPrice: data.costPrice } : {}),
        ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity } : {}),
        ...(data.unit !== undefined ? { unit: data.unit } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
        ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.materialGrade !== undefined ? { materialGrade: data.materialGrade } : {}),
        ...(data.thicknessMm !== undefined ? { thicknessMm: data.thicknessMm } : {}),
        ...(data.dimensions !== undefined ? { dimensions: data.dimensions } : {}),
        ...(data.weightKg !== undefined ? { weightKg: data.weightKg } : {}),
        ...(data.finishType !== undefined ? { finishType: data.finishType } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
        ...(data.images
          ? {
              images: {
                deleteMany: {},
                create: data.images.map((img, idx) => ({
                  url: img.url,
                  publicId: img.publicId || null,
                  altText: img.altText || data.name || existingProduct.name,
                  sortOrder: img.sortOrder ?? idx,
                })),
              },
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return apiSuccess(updatedProduct, 'Product updated successfully');
  } catch (err: unknown) {
    console.error('[PRODUCT_DETAIL_PATCH_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to update product';
    return apiError(message, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required', 401);
    }

    if (!isAdmin(currentUser)) {
      return apiError('Forbidden: Only administrators can delete products', 403);
    }

    const { id } = await params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existingProduct) {
      return apiError('Product to delete was not found', 404);
    }

    // Soft delete (deactivate product)
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: { isActive: false },
    });

    return apiSuccess(
      { id: existingProduct.id, deleted: true },
      'Product deactivated successfully'
    );
  } catch (err: unknown) {
    console.error('[PRODUCT_DETAIL_DELETE_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete product';
    return apiError(message, 500);
  }
}

