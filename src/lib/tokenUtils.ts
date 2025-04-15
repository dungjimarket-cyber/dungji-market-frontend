'use client';

import { getSession } from 'next-auth/react';

/**
 * 인증 토큰 관련 유틸리티 함수
 */
export const tokenUtils = {
  /**
   * 현재 세션에서 액세스 토큰을 가져옵니다.
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      const session = await getSession();
      if (!session?.user) {
        console.error('세션이 없습니다.');
        return null;
      }
      
      const accessToken = session.jwt?.access || session.user?.jwt?.access || (session.user as any).accessToken;
      if (!accessToken) {
        console.error('액세스 토큰이 없습니다:', session);
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
