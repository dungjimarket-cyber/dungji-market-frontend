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
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <button
          onClick={handleLogout}
          className="btn-animated btn-outline"
        >
          로그아웃
        </button>
      ) : (
        <>
          <button
            onClick={handleLogin}
            className="btn-animated btn-outline"
          >
            로그인
          </button>
          <Link
            href="/register"
            className="btn-animated btn-outline"
          >
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
