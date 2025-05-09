'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import AuthButtons from '@/components/auth/AuthButtons';

/**
 * 데스크탑용 상단 네비게이션 바 컴포넌트
 */
export default function DesktopNavbar() {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="hidden md:block bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="둥지마켓" width={40} height={40} />
            <span className="text-xl font-bold">둥지마켓</span>
          </Link>
          
          <div className="flex space-x-8">
            <Link href="/group-purchases" className="text-gray-600 hover:text-gray-900">
              공구둘러보기
            </Link>          
            <Link href="/completed" className="text-gray-600 hover:text-gray-900">
              완료된 공구
            </Link>
            <Link href="/mypage" className="text-gray-600 hover:text-gray-900">
              마이페이지
            </Link>
          </div>

          <AuthButtons isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </nav>
  );
}
