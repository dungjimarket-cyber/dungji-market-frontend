import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Origin', 'https://api.dungjimarket.com');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: response.headers
      });
    }

    return response;
  }

  // Check authentication for protected routes
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isSeller = token?.role === 'SELLER';

  // Protected routes that require authentication
  if (request.nextUrl.pathname.startsWith('/mypage') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Seller dashboard access
  if (request.nextUrl.pathname.startsWith('/seller-dashboard') && !isSeller) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/mypage/:path*',
    '/seller-dashboard/:path*'
  ],
};
