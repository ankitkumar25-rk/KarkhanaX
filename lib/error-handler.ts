import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { apiError } from './api-response';

/**
 * Global exception formatter for Next.js Route Handlers.
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API_ERROR] Unhandled exception:', error);

  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return apiError('Validation error', 422, formattedErrors);
  }

  if (error instanceof Error) {
    if (error.name === 'UnauthorizedError') {
      return apiError('Unauthorized access', 401);
    }
    if (error.name === 'ForbiddenError') {
      return apiError('Forbidden resource', 403);
    }
    if (process.env.NODE_ENV === 'development') {
      return apiError(error.message, 500, { stack: error.stack });
    }
  }

  return apiError('An unexpected internal server error occurred', 500);
}
