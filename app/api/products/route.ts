import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { apiSuccess, apiError } from '@/lib/api-response';

const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200, 'Name cannot exceed 200 characters'),
  slug: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Price must be a positive number'),
  compareAtPrice: z.coerce.number().positive().nullable().optional(),
  costPrice: z.coerce.number().positive().nullable().optional(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  unit: z.string().default('piece'),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
  isActive: z.coerce.boolean().default(true),
  materialGrade: z.string().optional().nullable(),
  thicknessMm: z.coerce.number().positive().nullable().optional(),
  dimensions: z.string().optional().nullable(),
  weightKg: z.coerce.number().positive().nullable().optional(),
  finishType: z.string().optional().nullable(),
  categoryId: z.string().uuid('Invalid Category ID format'),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        publicId: z.string().optional().nullable(),
        altText: z.string().optional().nullable(),
        sortOrder: z.coerce.number().int().default(0),
      })
    )
    .optional()
    .default([]),
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const categoryParam = searchParams.get('category')?.trim();
    const searchQuery = searchParams.get('search')?.trim();
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const isFeaturedParam = searchParams.get('isFeatured');
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    // Construct Prisma dynamic filter
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (categoryParam) {
      where.category = {
        OR: [{ id: categoryParam }, { slug: categoryParam }],
      };
    }

    if (isFeaturedParam !== null && isFeaturedParam !== undefined) {
      where.isFeatured = isFeaturedParam === 'true';
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { description: { contains: searchQuery, mode: 'insensitive' as const } },
        { materialGrade: { contains: searchQuery, mode: 'insensitive' as const } },
        { sku: { contains: searchQuery, mode: 'insensitive' as const } },
      ];
    }

    const validSortFields = new Set(['createdAt', 'price', 'name', 'stockQuantity']);
    const orderByField = validSortFields.has(sortField) ? sortField : 'createdAt';

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: { reviews: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return apiSuccess(products, 'Products retrieved successfully', 200, undefined);
  } catch (err: unknown) {
    console.error('[PRODUCTS_GET_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to retrieve products';
    return apiError(message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required', 401);
    }

    if (!isAdmin(currentUser)) {
      return apiError('Forbidden: Only administrators can create products', 403);
    }

    const body = await req.json();
    const validationResult = createProductSchema.safeParse(body);

    if (!validationResult.success) {
      return apiError(
        'Product validation failed',
        400,
        validationResult.error.format()
      );
    }

    const data = validationResult.data;
    const slug = data.slug?.trim() || generateSlug(data.name);

    // Verify Category existence
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!categoryExists) {
      return apiError(`Category with ID '${data.categoryId}' does not exist`, 404);
    }

    // Verify slug uniqueness
    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      return apiError(`Product with slug '${slug}' already exists`, 400);
    }

    // Verify SKU uniqueness if provided
    if (data.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        return apiError(`Product with SKU '${data.sku}' already exists`, 400);
      }
    }

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice ?? null,
        costPrice: data.costPrice ?? null,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        sku: data.sku || null,
        barcode: data.barcode || null,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        materialGrade: data.materialGrade || null,
        thicknessMm: data.thicknessMm ?? null,
        dimensions: data.dimensions || null,
        weightKg: data.weightKg ?? null,
        finishType: data.finishType || null,
        categoryId: data.categoryId,
        images: {
          create: data.images.map((img, idx) => ({
            url: img.url,
            publicId: img.publicId || null,
            altText: img.altText || data.name,
            sortOrder: img.sortOrder ?? idx,
          })),
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return apiSuccess(newProduct, 'Product created successfully', 201);
  } catch (err: unknown) {
    console.error('[PRODUCTS_POST_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to create product';
    return apiError(message, 500);
  }
}

