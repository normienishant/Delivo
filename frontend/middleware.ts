import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 🧹 Wipe all cached data (service workers, etc.) on next load
  response.headers.set('Clear-Site-Data', '"cookies", "storage", "cache"');

  // 🔒 Permanently block the related‑apps prompt
  response.headers.set('Permissions-Policy', 'get-installed-related-apps=()');

  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};