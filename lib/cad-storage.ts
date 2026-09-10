import fs from 'node:fs/promises';
import existsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const CAD_ALLOWED_EXTENSIONS = [
  '.dwg',
  '.dxf',
  '.step',
  '.stp',
  '.iges',
  '.igs',
  '.stl',
  '.sldprt',
  '.sldasm',
  '.zip',
  '.rar',
  '.7z',
  '.pdf',
] as const;

export const MAX_CAD_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

export interface CadFileMetadata {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  relativeUrl: string;
  sizeBytes: number;
  extension: string;
  mimeType: string;
  sha256: string;
  createdAt: string;
}

const MIME_MAP: Record<string, string> = {
  '.dwg': 'image/vnd.dwg',
  '.dxf': 'image/vnd.dxf',
  '.step': 'application/step',
  '.stp': 'application/step',
  '.iges': 'model/iges',
  '.igs': 'model/iges',
  '.stl': 'model/stl',
  '.sldprt': 'application/x-solidworks-part',
  '.sldasm': 'application/x-solidworks-assembly',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.pdf': 'application/pdf',
};

/**
 * Returns absolute path for CAD storage directory, ensuring directory exists on disk.
 */
export async function ensureCadStorageDir(): Promise<string> {
  const baseDir = process.env.CAD_STORAGE_PATH || path.join(process.cwd(), 'storage', 'cad');
  if (!existsSync.existsSync(baseDir)) {
    await fs.mkdir(baseDir, { recursive: true });
  }
  return baseDir;
}

/**
 * Validates if the given filename has a supported engineering CAD extension.
 */
export function isAllowedCadExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return CAD_ALLOWED_EXTENSIONS.includes(ext as (typeof CAD_ALLOWED_EXTENSIONS)[number]);
}

/**
 * Ensures resolved path stays strictly inside storage directory (prevents path traversal).
 */
export function getSafeCadFilePath(baseDir: string, filename: string): string {
  const sanitizedFilename = path.basename(filename);
  const resolvedPath = path.resolve(baseDir, sanitizedFilename);
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    throw new Error('[CAD_SECURITY_ERROR] Path traversal attempt detected');
  }
  return resolvedPath;
}

/**
 * Saves a CAD file buffer to local disk storage with SHA-256 verification and path isolation.
 */
export async function saveCadFile(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<CadFileMetadata> {
  if (fileBuffer.length > MAX_CAD_FILE_SIZE_BYTES) {
    throw new Error(`[CAD_STORAGE_ERROR] File size exceeds maximum limit of ${MAX_CAD_FILE_SIZE_BYTES / (1024 * 1024)} MB`);
  }

  const ext = path.extname(originalFilename).toLowerCase();
  if (!isAllowedCadExtension(originalFilename)) {
    throw new Error(`[CAD_STORAGE_ERROR] Extension '${ext}' is not permitted for engineering blueprints`);
  }

  const baseDir = await ensureCadStorageDir();
  const fileId = `cad_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const storedFilename = `${fileId}${ext}`;
  const targetFilePath = getSafeCadFilePath(baseDir, storedFilename);

  // Calculate SHA-256 checksum
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Write buffer to disk
  await fs.writeFile(targetFilePath, fileBuffer);

  const relativeUrl = `/api/upload/blueprint/download?file=${storedFilename}`;
  const mimeType = MIME_MAP[ext] || 'application/octet-stream';

  return {
    id: fileId,
    filename: storedFilename,
    originalName: path.basename(originalFilename),
    filePath: targetFilePath,
    relativeUrl,
    sizeBytes: fileBuffer.length,
    extension: ext,
    mimeType,
    sha256,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Reads a CAD file from disk storage cleanly.
 */
export async function readCadFile(filename: string): Promise<Buffer> {
  const baseDir = await ensureCadStorageDir();
  const safePath = getSafeCadFilePath(baseDir, filename);
  return await fs.readFile(safePath);
}

/**
 * Deletes a stored CAD file safely from disk.
 */
export async function deleteCadFile(filename: string): Promise<boolean> {
  try {
    const baseDir = await ensureCadStorageDir();
    const safePath = getSafeCadFilePath(baseDir, filename);
    await fs.unlink(safePath);
    return true;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

