'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { tokenUtils } from '@/lib/tokenUtils';
import { WelcomeModal } from '@/components/auth/WelcomeModal';

/**
 * 소셜 로그인 콜백 처리 페이지
 * 쿠키에서 JWT 토큰을 로컬스토리지로 옮기고 NextAuth 세션 설정
 */
// 서스펜스로 감싸진 컴포넌트
function SocialCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('처리 중...');
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userRole, setUserRole] = useState<'user' | 'seller'>('user');
  
  // 콜백 URL 파라미터 추출 (리다이렉트 목적지)
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  // 신규 사용자 여부 확인
  const isNewUser = searchParams.get('is_new_user') === 'true';
  
  useEffect(() => {
    /**
     * 소셜 로그인 콜백 처리 함수
     * JWT 토큰을 localStorage에 저장하고 NextAuth 세션 설정
     */
    const handleCallback = async () => {
      try {
        setStatus('토큰 정보 확인 중...');
        
        // URL 파라미터에서 토큰 확인 (backend kakao callback에서 직접 리다이렉트된 경우)
        let accessToken = searchParams.get('access_token');
        let refreshToken = searchParams.get('refresh_token');
        
        // URL에 토큰이 없으면 쿠키에서 확인
        if (!accessToken) {
          // 쿠키에서 JWT 토큰 정보 가져오기
          const getCookie = (name: string) => {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
              const [key, value] = cookie.trim().split('=');
              if (key === name) return value;
            }
            return null;
          };
          
          accessToken = getCookie('accessToken');
          refreshToken = getCookie('refreshToken');
        }
        
        if (!accessToken) {
          setError('로그인 정보를 찾을 수 없습니다.');
          return;
        }
        
        // JWT 토큰 디코딩
        const parseJwt = (token: string) => {
          try {
            return JSON.parse(atob(token.split('.')[1]));
          } catch (e) {
            return null;
          }
        };
        
        const tokenData = parseJwt(accessToken);
        console.log('토큰 데이터:', tokenData);
        
        if (!tokenData) {
          setError('토큰에서 사용자 정보를 추출할 수 없습니다.');
          return;
        }
        
        // 토큰 데이터에서 사용자 정보 추출
        const userId = tokenData.user_id || tokenData.userId || tokenData.sub || '';
        const userEmail = tokenData.email || tokenData.user_email || '';
        const userRole = tokenData.role || tokenData.user_role || 'user';
        setUserRole(userRole === 'seller' ? 'seller' : 'user');
        
        console.log('추출된 사용자 정보:', { userId, userEmail, userRole });
        
        // 1. 로컬스토리지에 토큰 저장 - 강화된 방식
        try {
          console.log('토큰 저장 시작 - 값 확인:', { 
            accessToken: accessToken ? (accessToken.substring(0, 15) + '...') : 'null', 
            hasRefreshToken: !!refreshToken,
            userId,
            userRole 
          });
          
          // window 객체 사용 - 로컬스토리지 직접 접근
          if (typeof window !== 'undefined' && window.localStorage) {
            // tokenUtils 사용
            tokenUtils.saveToken(accessToken);
            
            // 각 키를 각기 저장하여 오류 시 다음 키 저장 계속 진행
            try { window.localStorage.setItem('accessToken', accessToken); } catch (e) { console.error(e); }
            try { window.localStorage.setItem('dungji_auth_token', accessToken); } catch (e) { console.error(e); }
            try { window.localStorage.setItem('auth.token', accessToken); } catch (e) { console.error(e); }
            try { window.localStorage.setItem('auth.status', 'authenticated'); } catch (e) { console.error(e); }
            
            if (refreshToken) {
              try { window.localStorage.setItem('refreshToken', refreshToken); } catch (e) { console.error(e); }
            }
            
            // 사용자 정보 저장
            // URL에서 소셜 로그인 타입 추출
            const provider = window.location.pathname.includes('kakao') ? 'kakao' : 
                           window.location.pathname.includes('google') ? 'google' : 
                           window.location.pathname.includes('naver') ? 'naver' : 
                           tokenData.provider || tokenData.sns_type || null;
                           
            console.log('소셜 로그인 제공자 추출:', { provider, pathname: window.location.pathname });
            
            const authUser = {
              id: userId,
              email: userEmail,
              role: userRole, 
              name: tokenData.name || tokenData.user_name || '',
              token: accessToken,
              sns_type: provider, // 소셜 로그인 타입 추가
              provider: provider  // 호환성을 위해 provider 필드도 추가
            };
            
            const userJson = JSON.stringify(authUser);
            try { window.localStorage.setItem('auth.user', userJson); } catch (e) { console.error(e); }
            try { window.localStorage.setItem('user', userJson); } catch (e) { console.error(e); }
            try { window.localStorage.setItem('userRole', userRole); } catch (e) { console.error(e); }
            try { window.localStorage.setItem('isSeller', userRole === 'seller' ? 'true' : 'false'); } catch (e) { console.error(e); }
            
            // 검증 - 30ms 후 저장 완료 확인
            setTimeout(() => {
              const savedToken = window.localStorage.getItem('dungji_auth_token');
              const savedUser = window.localStorage.getItem('user');
              console.log('저장 후 확인:', { 
                hasToken: !!savedToken, 
                hasUser: !!savedUser,
                userRole: window.localStorage.getItem('userRole')
              });
            }, 30);
            
            console.log('✅ 로컬스토리지에 토큰 및 사용자 정보 저장 완료');
          } else {
            console.warn('인증 정보 저장 불가: window 혹은 localStorage 없음');
          }
        } catch (error) {
          // 오류를 Error 타입으로 처리
          const storageError = error as Error;
          console.error('로컬스토리지 저장 오류:', storageError);
          console.error('오류 상세정보:', {
            name: storageError?.name || 'UnknownError',
            message: storageError?.message || '알 수 없는 오류',
            stack: storageError?.stack ? storageError.stack.substring(0, 150) : '스택 없음'
          });
        }
        
        // 2. NextAuth 세션 설정
        setStatus('NextAuth 세션 설정 중...');
        
        try {
          // NextAuth 세션 설정
          const signInResult = await signIn('credentials', {
            redirect: false,
            token: accessToken,
            userId: userId,
            email: userEmail,
            role: userRole,
            name: tokenData.name || tokenData.user_name || '',
            callbackUrl,
          });
          
          if (signInResult?.error) {
            console.error('NextAuth 세션 설정 실패:', signInResult.error);
          } else {
            console.log('NextAuth 세션 설정 성공:', signInResult);
          }
          
          // NextAuth 호환 형식으로 저장
          try {
            localStorage.setItem('next-auth.session-token', accessToken);
            sessionStorage.setItem('next-auth.session-token', accessToken);
            
            // 세션 데이터 저장
            const fakeSession = {
              user: {
                name: tokenData.name || userEmail,
                email: userEmail,
                id: userId,
                role: userRole,
                image: tokenData.profile_image || ''
              },
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            
            localStorage.setItem('next-auth.session', JSON.stringify(fakeSession));
            sessionStorage.setItem('next-auth.session', JSON.stringify(fakeSession));
            
            // 추가 CSRF 토큰 설정
            localStorage.setItem('next-auth.csrf-token', `${Date.now()}|${accessToken}`);
            
            console.log('✅ NextAuth 호환 세션 저장 완료');
          } catch (sessionError) {
            console.error('NextAuth 세션 저장 오류:', sessionError);
          }
          
          // 세션 변경 이벤트 발생
          try {
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('session-change'));
            
            // 강제로 이벤트 발생 유도
            const forceEvent = new Array(20).fill('force-event');
            localStorage.setItem('__force_storage_event__', JSON.stringify(forceEvent));
            localStorage.removeItem('__force_storage_event__');
            
            console.log('✅ 세션 변경 이벤트 발생 완료');
          } catch (eventError) {
            console.error('이벤트 발생 오류:', eventError);
          }
        } catch (authError) {
          console.error('NextAuth 세션 설정 중 오류:', authError);
          // 여기서 실패해도 계속 진행
        }
        
        // 3. 리다이렉트 전 로컬 스토리지 저장 확인 및 추가 작업
        setStatus('로그인 성공! 리다이렉트 준비 중...');
        
        try {
          if (typeof window !== 'undefined') {
            // 토큰 저장 최종 확인 (만약 누락되었다면 다시 시도)
            const savedToken = localStorage.getItem('dungji_auth_token');
            if (!savedToken && accessToken) {
              console.log('토큰이 저장되지 않았습니다. 마지막 시도로 다시 저장합니다.');
              
              // 모든 토큰 저장
              localStorage.setItem('dungji_auth_token', accessToken);
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('auth.token', accessToken);
              localStorage.setItem('auth.status', 'authenticated');
              
              if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
              }
              
              // 사용자 정보 저장
              const authUser = {
                id: userId,
                email: userEmail,
                role: userRole,
                token: accessToken
              };
              
              localStorage.setItem('auth.user', JSON.stringify(authUser));
              localStorage.setItem('user', JSON.stringify(authUser));
              localStorage.setItem('userRole', userRole);
              localStorage.setItem('isSeller', userRole === 'seller' ? 'true' : 'false');
            }
            
            // 안정적인 저장을 위한 추가 확인
            localStorage.setItem('__auth_time', Date.now().toString());
            
            // 알림 및 세션 리프레시 이벤트 발생
            window.dispatchEvent(new Event('storage'));
          }
          
          // 쿠키에도 저장 (백업)
          document.cookie = `dungji_auth_token=${accessToken}; path=/; max-age=86400`;
        } catch (storageError) {
          console.error('리다이렉트 전 스토리지 작업 오류:', storageError);
          // 오류가 나도 리다이렉트는 계속 진행
        }
        
        // 토큰 저장 및 세션 설정을 위한 짧은 지연
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3.5. 신규 사용자인 경우 환영 모달 표시
        if (isNewUser) {
          setStatus('환영합니다! 회원가입이 완료되었습니다.');
          setShowWelcomeModal(true);
          return; // 모달이 닫힐 때까지 대기
        }
        
        // 4. 최종 리다이렉트
        try {
          // 로컬 스토리지에 저장된 원래 URL 확인 (공구 등록 화면 등)
          const originalUrl = typeof window !== 'undefined' ? 
            localStorage.getItem('dungji_redirect_url') : null;
          
          // 원래 URL이 있으면 그곳으로, 아니면 콜백 URL 또는 홈으로 리다이렉트
          const redirectUrl = originalUrl || callbackUrl || '/';
          console.log('최종 리다이렉트 URL:', redirectUrl);
          
          // 저장된 리다이렉트 URL 삭제 (일회성 사용)
          if (originalUrl && typeof window !== 'undefined') {
            localStorage.removeItem('dungji_redirect_url');
          }
          
          // 페이지 전환
          router.push(redirectUrl);
        } catch (redirectError) {
          console.error('리다이렉트 오류:', redirectError);
          // 오류 발생시 단순 리다이렉트로 대체
          const fallbackUrl = typeof window !== 'undefined' ? 
            (localStorage.getItem('dungji_redirect_url') || callbackUrl || '/') : 
            (callbackUrl || '/');
          window.location.href = fallbackUrl;
        }
      } catch (error) {
        console.error('소셜 로그인 콜백 처리 오류:', error);
        setError('로그인 처리 중 오류가 발생했습니다.');
      }
    };
    
    handleCallback();
  }, [callbackUrl, router, searchParams, isNewUser]);
  
  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    // 모달이 닫힌 후 리다이렉트 진행
    try {
      // 로컬 스토리지에 저장된 원래 URL 확인 (공구 등록 화면 등)
      const originalUrl = typeof window !== 'undefined' ? 
        localStorage.getItem('dungji_redirect_url') : null;
      
      // 원래 URL이 있으면 그곳으로, 아니면 콜백 URL 또는 홈으로 리다이렉트
      const redirectUrl = originalUrl || callbackUrl || '/';
      console.log('모달 닫힘 후 리다이렉트 URL:', redirectUrl);
      
      // 저장된 리다이렉트 URL 삭제 (일회성 사용)
      if (originalUrl && typeof window !== 'undefined') {
        localStorage.removeItem('dungji_redirect_url');
      }
      
      // 페이지 전환
      router.push(redirectUrl);
    } catch (redirectError) {
      console.error('리다이렉트 오류:', redirectError);
      // 오류 발생시 단순 리다이렉트로 대체
      const fallbackUrl = typeof window !== 'undefined' ? 
        (localStorage.getItem('dungji_redirect_url') || callbackUrl || '/') : 
        (callbackUrl || '/');
      window.location.href = fallbackUrl;
    }
  };
  
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">소셜 로그인 처리 중</h1>
          
          {error ? (
            <div className="text-red-500 mb-4">
              <p className="font-bold">오류 발생</p>
              <p>{error}</p>
              <button 
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                로그인 페이지로 돌아가기
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
              <p>{status}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 환영 모달 */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleWelcomeModalClose}
        userRole={userRole}
      />
    </>
  );
}

// 메인 페이지 컴포넌트
export default function SocialCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">소셜 로그인 처리 중</h1>
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p>로그인 정보 로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <SocialCallbackContent />
    </Suspense>
  );
}
