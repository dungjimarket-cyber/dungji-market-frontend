'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * 인증 관련 버튼 컴포넌트
 * 로그인/로그아웃 버튼을 표시합니다.
 * @param isAuthenticated 인증 여부
 */
export default function AuthButtons({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { logout } = useAuth();
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/login');
  };
  
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  
  return (
    <div className="flex items-center space-x-2 sm:space-x-4 min-h-[40px]">
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="btn-animated btn-outline whitespace-normal text-xs sm:text-sm md:text-base px-2 py-1 sm:px-4 sm:py-2 h-[32px] sm:h-[40px]"
        >
          로그아웃
        </button>
      ) : (
        <>
          <button
            onClick={handleLogin}
            className="btn-animated btn-outline whitespace-normal text-xs sm:text-sm md:text-base px-2 py-1 sm:px-4 sm:py-2 h-[32px] sm:h-[40px]"
          >
            로그인
          </button>
          <Link
            href="/register"
            className="btn-animated btn-outline whitespace-normal text-xs sm:text-sm md:text-base px-2 py-1 sm:px-4 sm:py-2 h-[32px] sm:h-[40px] inline-flex items-center"
          >
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
