import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'c8d9e2a1b4f70356821e905a3b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c'
);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * POST /api/admin/auth
 * Authenticates admin credentials & TOTP against backend, then issues an HttpOnly signed JWT cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, totp, totpCode } = body;

    const response = await fetch(`${BACKEND_URL}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, totp: totp || totpCode }),
    });

    let data: any = {};
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      return NextResponse.json(
        { success: false, error: `Backend service returned unexpected response (status ${response.status}).` },
        { status: response.status || 502 }
      );
    }

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || 'Authentication failed' },
        { status: response.status || 401 }
      );
    }

    const token = data.token;
    const cookieStore = await cookies();

    // 1. Terminate any lingering participant sessions to prevent session bleed
    cookieStore.delete('next-auth.session-token');
    cookieStore.delete('__Secure-next-auth.session-token');
    cookieStore.delete('participant_session');

    // 2. Set cryptographic HttpOnly session cookie (unreadable by client JavaScript, immune to XSS)
    cookieStore.set('admin_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 28800, // 8 hours
    });

    // 3. Set client-readable flag for local UI display hooks
    cookieStore.set('admin_session', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 28800,
    });

    return NextResponse.json({
      success: true,
      token,
      admin: data.admin,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Authentication service unreachable.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Clears administrative cryptographic cookies on logout.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_jwt');
  cookieStore.delete('admin_session');
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('participant_session');
  return NextResponse.json({ success: true, message: 'Admin session terminated.' });
}

/**
 * GET /api/admin/auth
 * Cryptographically verifies existing admin_jwt cookie.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_jwt')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== 'FACULTY_ADMIN') {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized role' }, { status: 403 });
    }
    return NextResponse.json({
      authenticated: true,
      user: payload.sub,
      role: payload.role,
      institute: payload.institute,
    });
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Invalid or expired cryptographic token' }, { status: 401 });
  }
}
