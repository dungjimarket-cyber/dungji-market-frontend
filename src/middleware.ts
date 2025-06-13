import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  /**
   * JWT 토큰 인증 처리
   * 쿠키에서 JWT 토큰을 추출하고 인증 상태 확인
   */
  // 쿠키에서 JWT 토큰 추출
  const accessToken = request.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;
  
  // 판매자 역할 확인
  let isSeller = false;
  
  if (accessToken) {
    try {
      // JWT 토큰 디코딩 (단순히 페이로드 부분만 추출)
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        // Base64url 디코딩 (Node.js 환경에서는 atob 대신 Buffer 사용)
        const base64Payload = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64Payload, 'base64').toString('utf8');
        const payload = JSON.parse(jsonPayload);
        // 판매자 역할 확인
        isSeller = payload.roles?.includes('seller') || false;
      }
    } catch (error) {
      console.error('JWT 토큰 디코딩 오류:', error);
    }
  }

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
    '/seller-dashboard/:path*',
    '/group-purchases/create'
  ],
};
