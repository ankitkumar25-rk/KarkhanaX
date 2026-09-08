import { cookies } from 'next/headers';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge?: number;
}

const isProduction = process.env.NODE_ENV === 'production';

export const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

/**
 * Sets httpOnly access token cookie in response headers.
 */
export async function setAuthCookies(accessToken: string, refreshToken?: string): Promise<void> {
  const cookieStore = await cookies();

  // Set 1-hour Access Token Cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...DEFAULT_COOKIE_OPTIONS,
    maxAge: 60 * 60, // 1 hour
  });

  if (refreshToken) {
    // Set 30-day Refresh Token Cookie
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...DEFAULT_COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  }
}

/**
 * Clears authentication cookies upon logout.
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Retrieves access token from request cookies.
 */
export async function getAccessTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

/**
 * Retrieves refresh token from request cookies.
 */
export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

