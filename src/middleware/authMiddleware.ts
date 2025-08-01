import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('dungji_auth_token')?.value || 
                request.cookies.get('accessToken')?.value ||
                request.cookies.get('auth.token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register');
  
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/group-purchases/create') ||
                          request.nextUrl.pathname.startsWith('/mypage') ||
                          request.nextUrl.pathname.startsWith('/bid-tickets');

  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated and trying to access auth pages, redirect to home
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}