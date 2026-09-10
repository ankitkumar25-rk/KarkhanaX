import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';
import { isAdmin } from '@/lib/rbac';
import { cacheGet, cacheSet, cacheDelPattern } from '@/lib/cache';
import { apiSuccess, apiError } from '@/lib/api-response';

const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url('Invalid image URL format').optional().or(z.literal('')),
  parentId: z.string().uuid('Invalid parent category ID').nullable().optional(),
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
    const isTreeMode = searchParams.get('tree') === 'true' || searchParams.get('flat') !== 'true';
    const searchQuery = searchParams.get('search')?.trim();

    const cacheKey = `categories:${isTreeMode ? 'tree' : 'flat'}${searchQuery ? `:${searchQuery}` : ''}`;
    const cachedData = await cacheGet(cacheKey);

    if (cachedData) {
      return apiSuccess(cachedData, 'Categories retrieved from cache');
    }

    if (isTreeMode && !searchQuery) {
      // Build hierarchical category tree (root categories with nested children)
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        orderBy: { name: 'asc' },
        include: {
          children: {
            orderBy: { name: 'asc' },
            include: {
              children: { orderBy: { name: 'asc' } },
              _count: { select: { products: true } },
            },
          },
          _count: { select: { products: true } },
        },
      });

      await cacheSet(cacheKey, categories, 300); // 5 min TTL
      return apiSuccess(categories, 'Category tree retrieved successfully');
    }

    // Flat listing (used for select dropdowns or filtered search)
    const whereClause = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as const } },
            { description: { contains: searchQuery, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    if (!searchQuery) {
      await cacheSet(cacheKey, categories, 300);
    }

    return apiSuccess(categories, 'Categories list retrieved successfully');
  } catch (err: unknown) {
    console.error('[CATEGORIES_GET_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to fetch categories';
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
      return apiError('Forbidden: Only administrators can manage categories', 403);
    }

    const body = await req.json();
    const validationResult = createCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return apiError(
        'Category validation failed',
        400,
        validationResult.error.format()
      );
    }

    const { name, description, imageUrl, parentId } = validationResult.data;
    const slug = validationResult.data.slug?.trim() || generateSlug(name);

    // Verify slug uniqueness
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return apiError(`Category with slug '${slug}' already exists`, 400);
    }

    // Verify parent category existence if parentId is supplied
    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parentExists) {
        return apiError(`Parent category with ID '${parentId}' not found`, 404);
      }
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        parentId: parentId || null,
      },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    // Invalidate cached category queries
    await cacheDelPattern('categories:*');

    return apiSuccess(newCategory, 'Category created successfully', 201);
  } catch (err: unknown) {
    console.error('[CATEGORIES_POST_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to create category';
    return apiError(message, 500);
  }
}

