import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

/**
 * Script to migrate local public images to Cloudinary CDN
 */
async function migrateImagesToCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary credentials missing in environment variables. Aborting migration.');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const sourceDir = path.join(process.cwd(), 'public', 'images');
  if (!fs.existsSync(sourceDir)) {
    console.log('No local public/images directory found to migrate.');
    return;
  }

  const files = fs.readdirSync(sourceDir);
  console.log(`Found ${files.length} local images to migrate to Cloudinary.`);

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    if (fs.statSync(filePath).isFile()) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'karkhanax/migrated',
          use_filename: true,
          unique_filename: false,
        });
        console.log(`Migrated ${file} -> ${result.secure_url}`);
      } catch (err) {
        console.error(`Failed to upload ${file}:`, err);
      }
    }
  }

  console.log('Image migration complete.');
}

migrateImagesToCloudinary().catch((err) => {
  console.error('Migration script error:', err);
  process.exit(1);
});
