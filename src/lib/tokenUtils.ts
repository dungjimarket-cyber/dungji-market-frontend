'use client';

import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';

// NextAuth Session 타입 확장
type ExtendedSession = Session & {
  accessToken?: string;
  jwt?: {
    access?: string;
    refresh?: string;
  };
};

type ExtendedUser = {
  accessToken?: string;
  jwt?: {
    access?: string;
    refresh?: string;
  };
};

// 로컬 스토리지 키
const TOKEN_STORAGE_KEY = 'dungji_auth_token';

/**
 * 인증 토큰 관련 유틸리티 함수
 */
export const tokenUtils = {
  /**
   * 토큰을 로컬 스토리지에 저장합니다.
   */
  saveToken: (token: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        console.log('토큰이 로컬 스토리지에 저장되었습니다.');
      }
    } catch (error) {
      console.error('토큰 저장 오류:', error);
    }
  },
  
  /**
   * 현재 세션에서 액세스 토큰을 가져옵니다.
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      // 1. 먼저 로컬 스토리지에서 토큰 확인
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          console.log('로컬 스토리지에서 토큰 가져옴');
          return storedToken;
        }
      }
      
      // 2. 로컬 스토리지에 없으면 세션에서 확인
      const session = await getSession() as ExtendedSession | null;
      
      // 세션이 없는 경우
      if (!session) {
        console.error('세션이 없습니다.');
        return null;
      }
      
      // 세션 구조 디버깅 정보
      console.debug('세션 구조:', JSON.stringify(session, null, 2));
      
      // 토큰 위치 확인 (다양한 가능한 위치 시도)
      let accessToken = null;
      
      if (session.accessToken) {
        accessToken = session.accessToken;
      } else if (session.user && (session.user as ExtendedUser).accessToken) {
        accessToken = (session.user as ExtendedUser).accessToken;
      } else if (session.jwt?.access) {
        accessToken = session.jwt.access;
      } else if (session.user && (session.user as ExtendedUser).jwt?.access) {
        accessToken = (session.user as ExtendedUser).jwt?.access;
      } else if (typeof session === 'object' && Object.keys(session).length === 0) {
        // 빈 객체인 경우 - 로그인 세션이 만료됨
        console.error('세션이 비어 있습니다. 로그인 만료됨');
        return null;
      }
      
      // 세션에서 토큰을 찾았다면 로컬 스토리지에도 저장
      if (accessToken && typeof window !== 'undefined') {
        tokenUtils.saveToken(accessToken);
      }
      
      // 개발 환경일 경우, 임시 토큰 설정 (개발 중에만 사용, 실제 배포 시 제거)
      if (process.env.NODE_ENV === 'development' && !accessToken) {
        console.warn('개발 환경: 임시 토큰을 사용합니다. 실제 배포 환경에서는 제거해야 합니다.');
        const devToken = 'dev_temp_token';
        tokenUtils.saveToken(devToken);
        return devToken;
      }
      
      if (!accessToken) {
        console.error('액세스 토큰을 찾을 수 없습니다. 세션 구조:', session);
        return null;
      }
      
      return accessToken;
    } catch (error) {
      console.error('액세스 토큰 가져오기 오류:', error);
      return null;
    }
  },
  
  /**
   * 인증 헤더를 생성합니다.
   */
  getAuthHeaders: async (): Promise<HeadersInit> => {
    const accessToken = await tokenUtils.getAccessToken();
    
    if (!accessToken) {
      return {
        'Content-Type': 'application/json',
      };
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  },
  
  /**
   * 인증이 필요한 API 요청을 수행합니다.
   */
  fetchWithAuth: async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    try {
      const headers = await tokenUtils.getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
      });
      
      if (!response.ok) {
        // 응답 본문 텍스트로 받아서 확인
        const responseText = await response.text();
        
        // 응답이 HTML인지 확인
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error('API가 HTML 응답을 반환했습니다. 서버 오류가 발생했을 수 있습니다.');
          throw new Error('API returned HTML instead of JSON');
        }
        
        // JSON으로 파싱 시도
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          console.error('API 오류 데이터:', errorData);
          
          // 토큰 만료 오류인 경우
          if (response.status === 401 && 
              errorData?.code === 'token_not_valid' && 
              errorData?.messages?.[0]?.token_type === 'access') {
            console.error('토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/login';
          }
        } catch (e) {
          console.error('API 오류 응답을 파싱할 수 없습니다:', e);
        }
        
        throw new Error(`API request failed: ${response.status} ${errorData ? JSON.stringify(errorData) : responseText.substring(0, 100)}`);
      }
      
      // 응답 본문이 있는 경우에만 JSON으로 파싱
      if (response.headers.get('content-length') === '0') {
        return {} as T;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  },
};
