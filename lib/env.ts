import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis / Valkey Cache
  REDIS_URL: z.string().optional(),

  // PASETO Authentication
  PASETO_SECRET_KEY: z.string().min(32, 'PASETO_SECRET_KEY must be at least 32 characters').optional(),
  PASETO_ISSUER: z.string().default('karkhanax-api'),
  PASETO_AUDIENCE: z.string().default('karkhanax-app'),

  // OAuth & Third-party Credentials
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Cloudinary CDN Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Payments (Razorpay)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Transactional Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('KarkhanaX <no-reply@karkhanax.com>'),

  // Google Maps & Address Validation
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('[ENV_ERROR] Invalid environment variables:', result.error.format());
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
  }

  return result.success ? result.data : (process.env as unknown as Env);
}

export const env = parseEnv();
