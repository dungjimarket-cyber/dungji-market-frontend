'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { tokenUtils } from '@/lib/tokenUtils';

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
  
  // 콜백 URL 파라미터 추출 (리다이렉트 목적지)
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  useEffect(() => {
    /**
     * 소셜 로그인 콜백 처리 함수
     * JWT 토큰을 localStorage에 저장하고 NextAuth 세션 설정
     */
    const handleCallback = async () => {
      try {
        setStatus('토큰 정보 확인 중...');
        
        // 쿠키에서 JWT 토큰 정보 가져오기
        const getCookie = (name: string) => {
          const cookies = document.cookie.split(';');
          for (let cookie of cookies) {
            const [key, value] = cookie.trim().split('=');
            if (key === name) return value;
          }
          return null;
        };
        
        const accessToken = getCookie('accessToken');
        const refreshToken = getCookie('refreshToken');
        
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
        
        console.log('추출된 사용자 정보:', { userId, userEmail, userRole });
        
        // 1. 로컬스토리지에 토큰 저장
        try {
          // tokenUtils 사용
          tokenUtils.saveToken(accessToken);
          
          // 다양한 저장소에 중복 저장하여 안정성 확보
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('dungji_auth_token', accessToken);
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
            name: tokenData.name || tokenData.user_name || '',
            token: accessToken
          };
          
          localStorage.setItem('auth.user', JSON.stringify(authUser));
          localStorage.setItem('user', JSON.stringify(authUser));
          localStorage.setItem('userRole', userRole);
          
          console.log('✅ 로컬스토리지에 토큰 및 사용자 정보 저장 완료');
        } catch (storageError) {
          console.error('로컬스토리지 저장 오류:', storageError);
          // 오류가 발생해도 계속 진행
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
        
        // 3. 리다이렉트 준비
        setStatus('인증 완료! 리다이렉트 준비 중...');
        
        // 리다이렉트 전 마지막 설정
        setTimeout(() => {
          try {
            // 세션 변경 이벤트 여러번 발생시키기
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('visibilitychange'));
            window.dispatchEvent(new Event('focus'));
            
            // 마지막 스토리지 업데이트
            localStorage.setItem('__auth_time', Date.now().toString());
            
            // 페이지 전환
            router.push(callbackUrl);
          } catch (redirectError) {
            console.error('리다이렉트 오류:', redirectError);
            // 오류 발생시 단순 리다이렉트로 대체
            window.location.href = callbackUrl;
          }
        }, 1500); // 1.5초 후 리다이렉트
        
      } catch (error) {
        console.error('소셜 로그인 콜백 처리 오류:', error);
        setError('로그인 처리 중 오류가 발생했습니다.');
      }
    };
    
    handleCallback();
  }, [callbackUrl, router]);
  
  return (
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
