import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic rate limiting stub and admin route protection
export function middleware(request: NextRequest) {
  // Protect dashboard routes in production
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Logic for auth check goes here
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};