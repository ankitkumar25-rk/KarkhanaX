import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  return apiSuccess(
    {
      status: 'healthy',
      service: 'KarkhanaX API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
    'KarkhanaX API service is operational'
  );
}
