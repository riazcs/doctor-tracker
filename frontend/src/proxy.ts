import { jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route protection (first line of defence — the API enforces auth on every request too).
 * Verifies the session JWT signature + expiry before any protected page renders, so
 * unauthenticated users never see a flash of the app shell.
 */
const COOKIE = 'dt_session';
const PUBLIC_PATHS = ['/login'];
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '');

async function isValidSession(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret, { issuer: 'doctor-tracker', algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const authed = await isValidSession(request.cookies.get(COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!authed && !isPublic) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    const res = NextResponse.redirect(url);
    if (request.cookies.has(COOKIE)) res.cookies.delete(COOKIE); // clear expired/tampered cookie
    return res;
  }
  if (authed && (isPublic || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API (proxied to Express, which does its own auth), Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
