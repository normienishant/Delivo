import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Force a fresh load by adding a version query parameter (only once per session)
  const url = request.nextUrl.clone();
  if (!url.searchParams.has('v')) {
    url.searchParams.set('v', '20260506'); // change this date if you ever update the fix
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  // 🔒 Permanently block the related‑apps prompt
  response.headers.set('Permissions-Policy', 'get-installed-related-apps=()');
  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};