import { NextResponse } from 'next/server';

export interface ApiSuccessEnvelope<T = unknown> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  errors: Record<string, unknown> | unknown[] | null;
  status: number;
  timestamp: string;
}

/**
 * Generates a standardized success JSON response for Next.js Route Handlers.
 */
export function apiSuccess<T = unknown>(
  data: T,
  message: string = 'Success',
  status: number = 200,
  headers?: HeadersInit
): NextResponse<ApiSuccessEnvelope<T>> {
  const body: ApiSuccessEnvelope<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status,
    headers,
  });
}

/**
 * Generates a standardized error JSON response for Next.js Route Handlers.
 */
export function apiError(
  message: string = 'Internal Server Error',
  status: number = 500,
  errors: Record<string, unknown> | unknown[] | null = null,
  headers?: HeadersInit
): NextResponse<ApiErrorEnvelope> {
  const body: ApiErrorEnvelope = {
    success: false,
    message,
    errors,
    status,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status,
    headers,
  });
}

