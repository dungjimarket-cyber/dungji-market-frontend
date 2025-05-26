'use client';

import { useEffect, useCallback } from 'react';
import { getUserRole, triggerAuthEvent } from '@/utils/auth';

/**
 * 인증 데이터 동기화 컴포넌트
 * 쿠키나 다른 저장소에 있는 인증 데이터를 로컬 스토리지로 동기화합니다.
 * 모든 페이지에서 작동하며 소셜 로그인 데이터를 처리합니다.
 */
export default function AuthDataSync() {
  /**
   * JWT 토큰 파싱 함수
   * @param token JWT 토큰
   * @returns 파싱된 페이로드 또는 null
   */
  const parseJwt = useCallback((token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error('JWT 토큰 파싱 오류:', error);
      return null;
    }
  }, []);

  /**
   * 쿠키 값 추출 함수
   * @param name 쿠키 이름
   * @returns 쿠키 값 또는 null
   */
  const getCookie = useCallback((name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return value;
    }
    return null;
  }, []);

  /**
   * 인증 데이터를 로컬 스토리지에 저장하는 함수
   * @param accessToken 액세스 토큰
   * @param refreshToken 리프레시 토큰 (선택적)
   * @param userData 사용자 데이터 (선택적)
   */
  const saveAuthData = useCallback((accessToken: string, refreshToken?: string, userData?: any) => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    try {
      // 1. 토큰 저장 - 모든 호환 키에 저장
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('dungji_auth_token', accessToken); 
      localStorage.setItem('auth.token', accessToken);
      localStorage.setItem('auth.status', 'authenticated');
      
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // 2. 사용자 정보 저장 (직접 제공된 경우)
      if (userData) {
        // 역할 정보 표준화 - 유틸리티 함수 사용
        const standardRole = getUserRole(userData);
        
        // 표준화된 역할 정보로 사용자 객체 확장
        const enhancedUserData = {
          ...userData,
          role: standardRole
        };
        
        localStorage.setItem('user', JSON.stringify(enhancedUserData));
        localStorage.setItem('auth.user', JSON.stringify(enhancedUserData));
        localStorage.setItem('userRole', standardRole);
        localStorage.setItem('isSeller', standardRole === 'seller' ? 'true' : 'false');
        return true;
      }

      // 3. 토큰에서 사용자 정보 추출 (userData가 없는 경우)
      const tokenData = parseJwt(accessToken);
      if (tokenData) {
        // 기본 사용자 정보 추출
        const userId = tokenData.user_id || tokenData.sub || '';
        let userEmail = tokenData.email || '';
        
        // 카카오 사용자 처리
        if (!userEmail && tokenData.sns_id) {
          userEmail = `${tokenData.sns_id}@kakao.user`;
        }
        
        // 역할 정보 추출 - 유틸리티 함수 사용
        const userRole = getUserRole(tokenData, userEmail);
        
        // 사용자 객체 구성
        const user = {
          id: userId,
          email: userEmail,
          role: userRole,
          token: accessToken
        };
        
        // 로컬 스토리지에 저장
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('auth.user', JSON.stringify(user));
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('isSeller', userRole === 'seller' ? 'true' : 'false');
        
        console.log('✅ 토큰에서 사용자 정보 추출 완료:', { userRole });
      }
      
      // 저장 완료 알림 - 유틸리티 함수 사용하여 여러 시점에 이벤트 발생
      triggerAuthEvent();
      return true;
    } catch (error) {
      console.error('인증 데이터 저장 실패:', error);
      return false;
    }
  }, [parseJwt]);

  // 페이지 로드 시 쿠키에서 토큰 확인 및 로컬 스토리지 동기화
  useEffect(() => {
    // 이미 로컬 스토리지에 토큰이 있으면 건너뜀
    const hasLocalToken = localStorage.getItem('dungji_auth_token') || 
                          localStorage.getItem('accessToken');
    
    if (hasLocalToken) {
      console.log('이미 로컬 스토리지에 토큰이 있습니다.');
      return;
    }
    
    // 가능한 모든 쿠키 토큰 확인
    const cookieTokens = {
      dungji: getCookie('dungji_auth_token'),
      access: getCookie('accessToken'),
      refresh: getCookie('refreshToken'),
      next: getCookie('next-auth.session-token')
    };
    
    // 유효한 토큰 찾기
    const mainToken = cookieTokens.dungji || cookieTokens.access || null;
    const refreshToken = cookieTokens.refresh || null;
    
    if (mainToken) {
      console.log('쿠키에서 토큰을 발견했습니다. 로컬 스토리지로 동기화합니다.');
      // refreshToken이 null인 경우 undefined로 변환하여 호환성 유지
      saveAuthData(mainToken, refreshToken || undefined);
      
      // 사용자 정보가 있는지 확인하고 이벤트 발생
      setTimeout(() => {
        const user = localStorage.getItem('user');
        console.log('동기화 후 상태 확인:', { 
          hasToken: !!localStorage.getItem('dungji_auth_token'),
          hasUser: !!user 
        });
        
        // 토큰은 있지만 사용자 정보가 없는 경우 재시도
        if (!user && mainToken) {
          console.log('사용자 정보가 누락되었습니다. 토큰에서 정보 추출 재시도...');
          saveAuthData(mainToken, refreshToken || undefined);
        }
      }, 100);
    }
  }, [getCookie, saveAuthData]);

  // 소셜 로그인 후 URL 파라미터 처리
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // URL에서 토큰 파라미터 확인 (소셜 로그인 콜백에서 전달될 수 있음)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const refreshParam = urlParams.get('refresh_token');
    
    if (tokenParam) {
      console.log('URL 파라미터에서 토큰을 발견했습니다. 저장합니다.');
      saveAuthData(tokenParam, refreshParam || undefined);
      
      // 토큰 파라미터 제거 (보안상 이유로)
      const cleanUrl = window.location.pathname + 
                     (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [saveAuthData]);
  
  // 이벤트 리스너 추가 - 브라우저 탭 간 동기화
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      // 다른 탭에서 인증 상태 변경 감지 시 처리
      if (event.key?.includes('token') || event.key?.includes('auth')) {
        console.log('다른 탭에서 인증 상태 변경 감지:', event.key);
        
        // 페이지 새로고침 대신 데이터만 동기화
        const hasToken = localStorage.getItem('dungji_auth_token');
        if (!hasToken) {
          console.log('토큰 제거 감지 - 로그아웃 상태로 동기화');
          // 토큰 관련 모든 항목 제거
          localStorage.removeItem('user');
          localStorage.removeItem('auth.user');
          localStorage.removeItem('userRole');
          localStorage.removeItem('isSeller');
        }
      }
    };
    
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // 빈 요소 반환 (렌더링 결과 없음)
  return null;
}
