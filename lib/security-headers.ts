export function applySecurityHeaders(headers: Headers): Headers {
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https://res.cloudinary.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; frame-src 'self' https://api.razorpay.com;"
  );

  return headers;
}
