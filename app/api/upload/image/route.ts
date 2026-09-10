import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { apiSuccess, apiError } from '@/lib/api-response';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
]);

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit per image

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required to upload images', 401);
    }

    const formData = await req.formData();
    const folderName = (formData.get('folder') as string) || 'products';
    const targetFolder = `karkhanax/${folderName.replace(/[^a-z0-9_-]/gi, '')}`;

    // Support both single "file" and multi "files" form fields
    const rawFiles: File[] = [];
    const singleFile = formData.get('file');
    if (singleFile && singleFile instanceof File) {
      rawFiles.push(singleFile);
    }

    const multiFiles = formData.getAll('files');
    for (const f of multiFiles) {
      if (f instanceof File) {
        rawFiles.push(f);
      }
    }

    if (rawFiles.length === 0) {
      return apiError('No image file provided in request body', 400);
    }

    const uploadedAssets = [];

    for (const file of rawFiles) {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
        return apiError(
          `Invalid file format '${file.type}'. Only JPG, PNG, WebP, SVG, and GIF are allowed`,
          400
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return apiError(
          `File '${file.name}' exceeds the maximum allowed limit of 10 MB`,
          400
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const cloudinaryResult = await uploadToCloudinary(buffer, {
        folder: targetFolder,
      });

      uploadedAssets.push({
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        format: cloudinaryResult.format,
        bytes: cloudinaryResult.bytes,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      });
    }

    return apiSuccess(
      uploadedAssets.length === 1 ? uploadedAssets[0] : uploadedAssets,
      'Image(s) uploaded successfully',
      201
    );
  } catch (err: unknown) {
    console.error('[IMAGE_UPLOAD_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to upload image';
    return apiError(message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required to delete images', 401);
    }

    const { searchParams } = new URL(req.url);
    let publicId = searchParams.get('publicId');

    if (!publicId) {
      try {
        const body = await req.json();
        publicId = body.publicId;
      } catch {
        // Body reading optional
      }
    }

    if (!publicId) {
      return apiError('Missing publicId parameter for image deletion', 400);
    }

    await deleteFromCloudinary(publicId, 'image');

    return apiSuccess({ deleted: true, publicId }, 'Image removed successfully');
  } catch (err: unknown) {
    console.error('[IMAGE_DELETE_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete image';
    return apiError(message, 500);
  }
}

