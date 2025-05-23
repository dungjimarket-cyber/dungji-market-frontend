'use client';

import { useEffect, useState, ReactNode, useRef } from 'react';
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
  
  // 중복 세션 체크 방지
  const authCheckCompletedRef = useRef<boolean>(false);
  const authCheckAttemptRef = useRef<number>(0);

  // 인증 상태 확인
  useEffect(() => {
    // 이미 완료된 상태이거나 너무 많은 시도가 있었으면 중단
    if (authCheckCompletedRef.current || authCheckAttemptRef.current > 3) {
      return;
    }

    const checkAuth = async () => {
      // 확인 시도 횟수 증가
      authCheckAttemptRef.current += 1;
      console.log(`🔍 인증 시도 ${authCheckAttemptRef.current}회`);
      
      // NextAuth 세션이 로딩 중인 경우
      if (status === 'loading') {
        return;
      }

      // 이미 인증 확인 완료된 경우 중복 처리 방지
      if (authCheckCompletedRef.current) {
        return;
      }

      // NextAuth 세션으로 인증 성공
      if (status === 'authenticated' && session) {
        console.log('✅ NextAuth 세션 인증 성공:', session.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        authCheckCompletedRef.current = true;
        return;
      }

      // NextAuth 세션은 없지만 로컬스토리지에 토큰이 있는지 확인
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('dungji_auth_token');
        
        if (token) {
          console.log('✅ 로컬스토리지 토큰 확인 성공');
          setIsAuthenticated(true);
          setIsLoading(false);
          authCheckCompletedRef.current = true;
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
          
        // 모든 가능한 토큰 이름 확인
        const cookieTokens = {
          dungji: getCookie('dungji_auth_token'),
          access: getCookie('accessToken'),
          refresh: getCookie('refreshToken')
        };
        
        // 토큰 중 하나라도 있는지 확인
        const mainToken = cookieTokens.dungji || cookieTokens.access || null;
          
        if (mainToken) {
          console.log('✅ 쿠키 토큰 확인 성공');
          
          // 1. 토큰 저장
          localStorage.setItem('dungji_auth_token', mainToken);
          localStorage.setItem('accessToken', mainToken);
          localStorage.setItem('auth.token', mainToken);
          localStorage.setItem('auth.status', 'authenticated');
          
          if (cookieTokens.refresh) {
            localStorage.setItem('refreshToken', cookieTokens.refresh);
          }
          
          // 2. JWT 토큰 디코딩하여 사용자 정보 추출
          try {
            const parseJwt = (token: string) => {
              try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                return JSON.parse(atob(base64));
              } catch (err) {
                console.error('JWT 토큰 파싱 오류:', err);
                return null;
              }
            };
            
            const tokenData = parseJwt(mainToken);
            console.log('토큰 데이터:', tokenData);
            
            if (tokenData) {
              // 사용자 ID 추출
              const userId = tokenData.user_id || tokenData.sub || '';
              
              // 이메일 추출
              let userEmail = tokenData.email || '';
              if (!userEmail && tokenData.sns_id) {
                userEmail = `${tokenData.sns_id}@kakao.user`;
              }
              
              // 역할 추출
              const userRole = tokenData.role || 'user';
              
              // 사용자 정보 저장
              const authUser = {
                id: userId,
                email: userEmail,
                role: userRole,
                token: mainToken
              };
              
              localStorage.setItem('auth.user', JSON.stringify(authUser));
              localStorage.setItem('user', JSON.stringify(authUser));
              localStorage.setItem('userRole', userRole);
              localStorage.setItem('isSeller', userRole === 'seller' ? 'true' : 'false');
              
              console.log('✅ 사용자 정보 저장 완료:', { userRole, isSeller: userRole === 'seller' });
            }
          } catch (error) {
            console.error('토큰에서 사용자 정보 추출 중 오류:', error);
          }
          
          setIsAuthenticated(true);
          setIsLoading(false);
          authCheckCompletedRef.current = true;
          return;
        }
      }

      // 모든 시도 후에도 인증 실패한 경우에만 리다이렉트 처리
      if (authCheckAttemptRef.current >= 2) {  
        // 인증 실패 시 로그인 페이지로 리다이렉트
        if (redirectToLogin) {
          console.log('⚠️ 인증 실패, 로그인 페이지로 리다이렉트');
          
          // 현재 페이지 URL 저장 (인증 후 돌아오기 위해)
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem('dungji_redirect_url', currentPath);
          console.log('현재 페이지 URL 저장:', currentPath);
          
          const callbackUrl = encodeURIComponent(window.location.pathname);
          router.push(`/login?callbackUrl=${callbackUrl}`);
        }
        
        setIsAuthenticated(false);
        setIsLoading(false);
        authCheckCompletedRef.current = true;
      }
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
