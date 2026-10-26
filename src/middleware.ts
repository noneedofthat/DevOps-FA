import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'c8d9e2a1b4f70356821e905a3b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public authentication pages, API endpoints, Next.js internals, and static assets
  if (
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Strict Cryptographic RBAC protection for administrative routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    const adminJwtToken = request.cookies.get('admin_jwt')?.value;

    // Fail closed if cryptographic token is missing
    if (!adminJwtToken) {
      const redirectUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    try {
      // Cryptographically verify signature and expiration time
      const { payload } = await jwtVerify(adminJwtToken, JWT_SECRET);

      if (payload.role !== 'FACULTY_ADMIN') {
        const redirectUrl = new URL('/team', request.url);
        return NextResponse.redirect(redirectUrl);
      }

      return NextResponse.next();
    } catch {
      // Token is forged, expired, or tampered with
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_jwt');
      response.cookies.delete('admin_session');
      return response;
    }
  }

  // 3. Global participant route protection (/, /team, /submit, /leaderboard, /judge/*)
  const nextAuthToken = request.cookies.get('next-auth.session-token');
  const secureNextAuthToken = request.cookies.get('__Secure-next-auth.session-token');
  const participantSession = request.cookies.get('participant_session');
  const adminJwt = request.cookies.get('admin_jwt');

  const isAuthenticated = 
    Boolean(nextAuthToken?.value) ||
    Boolean(secureNextAuthToken?.value) ||
    participantSession?.value === 'true' ||
    Boolean(adminJwt?.value);

  // If unauthenticated, redirect immediately to /login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Intercept all application routes:
     * - Participant routes (/, /team, /submit, /leaderboard, /judge/:path*)
     * - Admin routes (/admin/:path*)
     * Excluding static assets and next internals
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
