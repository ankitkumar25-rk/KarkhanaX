import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

/**
 * Upload an image file buffer to Cloudinary (PNG, JPG, WebP, SVG, GIF)
 */
export function uploadToCloudinary(
  fileBuffer: Buffer,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      resource_type: 'image',
      folder: 'karkhanax/products',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('[CLOUDINARY_ERROR] Upload failed with empty result'));
      } else {
        resolve(result);
      }
    });

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

/**
 * Upload a raw file buffer to Cloudinary (CAD drawings, DXF, STEP, ZIP, PDF)
 */
export function uploadRawToCloudinary(
  fileBuffer: Buffer,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      resource_type: 'raw',
      folder: 'karkhanax/blueprints',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('[CLOUDINARY_ERROR] Raw upload failed with empty result'));
      } else {
        resolve(result);
      }
    });

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

/**
 * Upload a file buffer to Cloudinary with automatic type detection
 */
export function uploadAutoToCloudinary(
  fileBuffer: Buffer,
  options: UploadApiOptions = {}
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadOptions: UploadApiOptions = {
      resource_type: 'auto',
      folder: 'karkhanax/uploads',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error || !result) {
        reject(error || new Error('[CLOUDINARY_ERROR] Auto upload failed with empty result'));
      } else {
        resolve(result);
      }
    });

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

/**
 * Delete an asset from Cloudinary by public_id
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'raw' | 'video' = 'image'
): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };

