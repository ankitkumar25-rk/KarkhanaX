import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from '@/lib/security-headers';
import { handleCors } from '@/lib/cors';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Create Base Response
  let response = NextResponse.next();

  // 2. Handle Multi-Domain Rewrites (Storefront vs Admin Domain)
  if (hostname.startsWith('admin.')) {
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname}`;
      response = NextResponse.rewrite(url);
    }
  }

  // 3. Apply CORS Headers
  handleCors(request, response.headers);

  // 4. Apply Security Headers
  applySecurityHeaders(response.headers);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
