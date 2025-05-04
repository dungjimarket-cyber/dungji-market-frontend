'use client';

/**
 * JWT 토큰 사용자 타입 정의
 */
interface JwtUser {
  id: number;
  email: string;
  username: string;
  name?: string;
  image?: string;
  role?: string;   // Django의 role 필드에 해당
  roles?: string[]; // 역호환성을 위해 유지
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
   * 토큰을 로컬 스토리지에서 제거합니다.
   */
  removeToken: (): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        console.log('토큰이 로컬 스토리지에서 제거되었습니다.');
      }
    } catch (error) {
      console.error('토큰 제거 오류:', error);
    }
  },
  
  /**
   * JWT 액세스 토큰을 가져옵니다.
   * 클라이언트와 서버 양쪽에서 동작합니다.
   */
  getAccessToken: async (): Promise<string | null> => {
    try {
      // 클라이언트 사이드일 경우 로컬 스토리지에서 토큰 확인
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          return storedToken;
        }

        // 실패한 경우 쿠키에서 확인 - 서버 컴포넌트에서 설정한 쿠키를 클라이언트에서 읽을 수 있도록
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'accessToken') {
            return decodeURIComponent(value);
          }
        }
      }
      
      // 토큰을 찾지 못한 경우
      return null;
    } catch (error) {
      console.error('토큰 가져오기 오류:', error);
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
        
        // JSON으로 파싱 시도
        let errorData;
        try {
          errorData = JSON.parse(responseText);
          
          // 토큰 만료 오류인 경우
          if (response.status === 401 && 
              errorData?.code === 'token_not_valid' && 
              typeof window !== 'undefined') {
            console.error('토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/login';
          }
        } catch (e) {
          // 응답이 JSON이 아닌 경우
        }
        
        throw new Error(`API request failed: ${response.status}`);
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
  
  /**
   * JWT 토큰에서 페이로드를 디코딩합니다.
   */
  decodeToken: (token: string): JwtUser | null => {
    try {
      // JWT는 header.payload.signature 형태
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      // 페이로드(두 번째 부분) 디코딩
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload) as JwtUser;
    } catch (error) {
      console.error('JWT 디코딩 오류:', error);
      return null;
    }
  },
  
  /**
   * 사용자 역할을 확인합니다. JWT 토큰, 로컬 스토리지 등 여러 소스에서 확인
   * 백엔드의 JWT 토큰에 role 필드가 없는 경우를 고려함
   */
  hasRole: async (role: string): Promise<boolean> => {
    // 1. JWT 토큰에서 역할 확인
    const token = await tokenUtils.getAccessToken();
    if (!token) return false;
    
    const decoded = tokenUtils.decodeToken(token);
    console.log('토큰 디코딩 결과:', decoded);
    
    // JWT 토큰에서 역할 확인
    let hasRoleInToken = false;
    if (decoded?.role === role || (decoded?.roles && Array.isArray(decoded.roles) && decoded.roles.includes(role))) {
      hasRoleInToken = true;
    }
    
    // 2. 로컬 스토리지에서 역할 확인
    let hasRoleInStorage = false;
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === role || (Array.isArray(user.roles) && user.roles.includes(role))) {
            hasRoleInStorage = true;
          }
        }
      } catch (error) {
        console.error('로컬 스토리지 역할 확인 오류:', error);
      }
    }
    
    // 3. seller@test.com 계정 특별 처리 (fallback)
    let hasRoleByEmail = false;
    
    // JWT 토큰에서 email 확인 (현재 백엔드에서는 제공하지 않지만 확장성 고려)
    if (role === 'seller' && decoded?.email === 'seller@test.com') {
      console.log('JWT에서 seller@test.com 확인');
      hasRoleByEmail = true;
    }
    
    // 로컬 스토리지에서 특별 확인
    try {
      if (role === 'seller') {
        // 로컬 스토리지에서 사용자 이메일 확인
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.email === 'seller@test.com') {
            console.log('로컬 스토리지에서 seller@test.com 확인');
            hasRoleByEmail = true;
          }
        }
        
        // 특별 플래그 확인
        const isSeller = localStorage.getItem('isSeller');
        if (isSeller === 'true') {
          console.log('로컬 스토리지 isSeller 플래그 확인');
          hasRoleByEmail = true;
        }
      }
    } catch (error) {
      console.error('로컬 스토리지 확인 오류:', error);
    }
    
    const result = hasRoleInToken || hasRoleInStorage || hasRoleByEmail;
    
    console.log('판매회원 역할 확인 결과:', {
      role,
      hasRoleInToken,
      hasRoleInStorage,
      hasRoleByEmail,
      result
    });
    
    return result;
  }
};
