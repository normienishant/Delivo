import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Force a fresh load by redirecting with a nocache parameter (only once)
  const url = request.nextUrl.clone();
  if (!url.searchParams.has('nocache')) {
    url.searchParams.set('nocache', '1');
    const response = NextResponse.redirect(url);
    // When the browser follows this redirect, it will get the Clear-Site-Data header
    response.headers.set('Clear-Site-Data', '"cookies", "storage", "cache"');
    response.headers.set('Permissions-Policy', 'get-installed-related-apps=()');
    return response;
  }

  // After the redirect, continue normally, but still send the blocking header
  const response = NextResponse.next();
  response.headers.set('Permissions-Policy', 'get-installed-related-apps=()');
  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};