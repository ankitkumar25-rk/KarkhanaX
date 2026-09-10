import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { saveCadFile, readCadFile, deleteCadFile, isAllowedCadExtension, MAX_CAD_FILE_SIZE_BYTES } from '@/lib/cad-storage';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required to upload engineering blueprints', 401);
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return apiError('No engineering blueprint or CAD file provided in request body', 400);
    }

    if (!isAllowedCadExtension(file.name)) {
      return apiError(
        `File extension for '${file.name}' is not allowed for CAD blueprints. Supported formats: .dwg, .dxf, .step, .stp, .iges, .stl, .sldprt, .sldasm, .zip, .rar, .7z, .pdf`,
        400
      );
    }

    if (file.size > MAX_CAD_FILE_SIZE_BYTES) {
      return apiError(
        `File size exceeds maximum permitted limit of ${MAX_CAD_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
        400
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const metadata = await saveCadFile(buffer, file.name);

    return apiSuccess(
      metadata,
      'Engineering blueprint uploaded successfully to secure CAD storage',
      201
    );
  } catch (err: unknown) {
    console.error('[BLUEPRINT_UPLOAD_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to upload blueprint';
    return apiError(message, 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required to download engineering blueprints', 401);
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('file');

    if (!filename) {
      return apiError('Missing file parameter in query string', 400);
    }

    const buffer = await readCadFile(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('[BLUEPRINT_DOWNLOAD_API_ERROR]', err);
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      return apiError('Requested engineering blueprint was not found', 404);
    }
    const message = err instanceof Error ? err.message : 'Failed to retrieve blueprint';
    return apiError(message, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser(req);
    if (!currentUser) {
      return apiError('Authentication required to delete blueprints', 401);
    }

    const { searchParams } = new URL(req.url);
    let filename = searchParams.get('file');

    if (!filename) {
      try {
        const body = await req.json();
        filename = body.filename || body.file;
      } catch {
        // Body reading optional
      }
    }

    if (!filename) {
      return apiError('Missing file parameter for blueprint deletion', 400);
    }

    const deleted = await deleteCadFile(filename);

    if (!deleted) {
      return apiError('Engineering blueprint file not found or already deleted', 404);
    }

    return apiSuccess({ deleted: true, filename }, 'Engineering blueprint deleted successfully');
  } catch (err: unknown) {
    console.error('[BLUEPRINT_DELETE_API_ERROR]', err);
    const message = err instanceof Error ? err.message : 'Failed to delete blueprint';
    return apiError(message, 500);
  }
}
