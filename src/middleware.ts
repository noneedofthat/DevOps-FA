import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
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

  // 2. Strict RBAC protection for administrative routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    const adminSessionCookie = request.cookies.get('admin_session');

    // If no verified admin session cookie, redirect immediately to /team
    if (!adminSessionCookie || adminSessionCookie.value !== 'true') {
      const redirectUrl = new URL('/team', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  // 3. Global participant route protection (/, /team, /submit, /leaderboard, /judge/*)
  const nextAuthToken = request.cookies.get('next-auth.session-token');
  const secureNextAuthToken = request.cookies.get('__Secure-next-auth.session-token');
  const participantSession = request.cookies.get('participant_session');
  const adminSession = request.cookies.get('admin_session');

  const isAuthenticated = 
    Boolean(nextAuthToken?.value) ||
    Boolean(secureNextAuthToken?.value) ||
    participantSession?.value === 'true' ||
    adminSession?.value === 'true';

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
