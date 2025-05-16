'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  redirectToLogin?: boolean;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * NextAuth 세션 및 로컬스토리지 토큰을 사용하여 인증 여부 결정
 * @param children 보호할 컴포넌트
 * @param redirectToLogin 인증 실패 시 로그인 페이지로 리다이렉트 여부
 */
export default function RequireAuth({ 
  children, 
  redirectToLogin = true 
}: RequireAuthProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      // NextAuth 세션이 로딩 중인 경우
      if (status === 'loading') {
        return;
      }

      // NextAuth 세션으로 인증 성공
      if (status === 'authenticated' && session) {
        console.log('✅ NextAuth 세션 인증 성공:', session.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // NextAuth 세션은 없지만 로컬스토리지에 토큰이 있는지 확인
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('dungji_auth_token');
        
        if (token) {
          console.log('✅ 로컬스토리지 토큰 확인 성공');
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // 쿠키에서 확인
        const getCookie = (name: string): string | null => {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
              const [key, value] = cookie.trim().split('=');
              if (key === name) return value;
            }
            return null;
          };
          
        const cookieToken = getCookie('dungji_auth_token');
          
        if (cookieToken) {
          console.log('✅ 쿠키 토큰 확인 성공');
          localStorage.setItem('dungji_auth_token', cookieToken);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
        
      // 인증 실패 시 로그인 페이지로 리다이렉트
        if (redirectToLogin) {
        console.log('⚠️ 인증 실패, 로그인 페이지로 리다이렉트');
        const callbackUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?callbackUrl=${callbackUrl}`);
      }
      
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkAuth();
  }, [session, status, router, redirectToLogin]);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">인증 확인 중...</span>
      </div>
    );
  }

  // 인증에 성공한 경우에만 자식 컴포넌트 렌더링
  return isAuthenticated ? <>{children}</> : null;
}
