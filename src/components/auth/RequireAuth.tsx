'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, getSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  redirectToLogin?: boolean;
}

/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 * NextAuth 세션 또는 로컬 스토리지 토큰을 확인하여 인증 여부 결정
 */
export default function RequireAuth({ 
  children, 
  redirectToLogin = true 
}: RequireAuthProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 세션 상태 확인
    const checkSession = async () => {
      try {
        // NextAuth 세션 확인
        const session = await getSession();
        
        if (session) {
          console.log('✅ NextAuth 세션 확인 성공:', session);
          // NextAuth 세션이 있으면 인증됨으로 처리
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // NextAuth 세션이 없으면 로컬스토리지 확인
        if (typeof window !== 'undefined') {
          // 다양한 저장소에서 토큰 확인 (우선순위 순)
          const accessToken = localStorage.getItem('accessToken');
          const dungjiToken = localStorage.getItem('dungji_auth_token');
          const authToken = localStorage.getItem('auth.token');
          const nextAuthToken = localStorage.getItem('next-auth.session-token');
          
          // 세션 스토리지도 확인
          const sessionToken = sessionStorage.getItem('next-auth.session-token');
          
          // 쿠키에서도 확인
          const getCookie = (name: string) => {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
              const [key, value] = cookie.trim().split('=');
              if (key === name) return value;
            }
            return null;
          };
          
          const cookieToken = getCookie('accessToken') || getCookie('dungji_auth_token');
          
          // 모든 가능한 소스에서 토큰 확인
          const tokenToUse = accessToken || dungjiToken || authToken || nextAuthToken || sessionToken || cookieToken;
          
          if (tokenToUse) {
            console.log('✅ 다양한 저장소에서 토큰 복원 성공');
            
            // 모든 토큰 저장소에 중복 저장하여 안정성 확보
            localStorage.setItem('accessToken', tokenToUse);
            localStorage.setItem('dungji_auth_token', tokenToUse);
            localStorage.setItem('auth.token', tokenToUse);
            localStorage.setItem('auth.status', 'authenticated');
            
            // NextAuth 형식으로도 저장
            try {
              localStorage.setItem('next-auth.session-token', tokenToUse);
              sessionStorage.setItem('next-auth.session-token', tokenToUse);
              
              // 쿠키에도 저장 (서버 컴포넌트와 호환성 유지)
              document.cookie = `accessToken=${tokenToUse}; path=/; max-age=86400; SameSite=Lax`;
            } catch (e) {
              console.error('토큰 복제 저장 오류:', e);
            }
            
            // 사용자 정보 확인 및 저장
            try {
              // 여러 소스에서 사용자 정보 확인
              const storedUser = localStorage.getItem('auth.user') || 
                                localStorage.getItem('user') || 
                                sessionStorage.getItem('next-auth.session');
              
              if (storedUser) {
                const userInfo = JSON.parse(storedUser);
                
                // 세션 데이터 형식으로 저장
                const fakeSession = {
                  user: {
                    name: userInfo.name || (userInfo.user ? userInfo.user.name : '') || '',
                    email: userInfo.email || (userInfo.user ? userInfo.user.email : '') || '',
                    id: userInfo.id || (userInfo.user ? userInfo.user.id : '') || '',
                    role: userInfo.role || (userInfo.user ? userInfo.user.role : '') || 'user',
                    image: userInfo.image || (userInfo.user ? userInfo.user.image : '') || ''
                  },
                  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                };
                
                // 세션 정보 중복 저장
                localStorage.setItem('next-auth.session', JSON.stringify(fakeSession));
                sessionStorage.setItem('next-auth.session', JSON.stringify(fakeSession));
                
                // 세션 변경 이벤트 발생
                window.dispatchEvent(new Event('storage'));
              }
            } catch (e) {
              console.error('사용자 정보 복원 오류:', e);
            }
            
            // 세션 상태 업데이트
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }
        
        // 인증 실패 처리
        console.log('⚠️ 인증 정보를 찾을 수 없음');
        setIsAuthenticated(false);
        setIsLoading(false);
        
        // 리다이렉트
        if (redirectToLogin) {
          router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
        
        if (redirectToLogin) {
          router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
        }
      }
    };
    
    checkSession();
    
    // 스토리지 이벤트 리스너 추가 - 다른 탭에서 로그인/로그아웃 시 자동 반영
    const handleStorageChange = () => {
      checkSession();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router, redirectToLogin]);

  // NextAuth 세션 상태에 따른 처리
  useEffect(() => {
    if (status === 'authenticated' && session) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      // NextAuth에서 인증되지 않았을 때 로컬 스토리지 확인은 위의 useEffect에서 처리
    }
  }, [session, status]);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">인증 확인 중...</span>
      </div>
    );
  }

  // 인증된 경우에만 자식 컴포넌트 렌더링
  return isAuthenticated ? <>{children}</> : null;
}
