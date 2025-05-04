/**
 * 판매자 전용 레이아웃
 */
import { cookies } from 'next/headers';
import { decodeJwtToken } from '@/lib/auth';
import SellerSidebar from '@/components/seller/SellerSidebar';

/**
 * 판매자 대시보드 레이아웃 컴포넌트
 * 판매자 역할을 가진 사용자만 접근 가능합니다.
 * @param {object} props - 컴포넌트 프로퍼티
 * @param {React.ReactNode} props.children - 하위 컴포넌트
 */
export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 쿠키에서 JWT 토큰 확인
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  
  if (!accessToken) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // JWT 토큰 디코딩
    const decodedToken = decodeJwtToken(accessToken);
    
    // 판매자 역할 확인
    if (!decodedToken?.roles?.includes('seller')) {
      return new Response('Unauthorized: Seller role required', { status: 403 });
    }
  } catch (error) {
    console.error('JWT 토큰 검증 오류:', error);
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }
  
  return (
    <div className="flex min-h-screen">
      <SellerSidebar />
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
