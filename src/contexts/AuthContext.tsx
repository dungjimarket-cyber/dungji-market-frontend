'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * 사용자 정보 타입 정의
 */
type User = {
  id: string;
  email: string;
  role?: string;
  roles?: string[];
};

/**
 * 인증 컨텍스트 타입 정의
 */
type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// 인증 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * JWT 토큰에서 페이로드를 디코딩하는 유틸리티 함수
 * @param token JWT 토큰 문자열
 * @returns 디코딩된 페이로드 객체 또는 null
 */
const decodeJwtPayload = (token: string): any | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error('JWT 디코딩 오류:', error);
    return null;
  }
};

/**
 * 전역 인증 상태를 제공하는 Provider 컴포넌트
 * 
 * @example
 * ```tsx
 * // _app.tsx 또는 layout.tsx에서 사용
 * <AuthProvider>
 *   <Component {...pageProps} />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 브라우저 환경에서만 localStorage 접근
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const refresh = localStorage.getItem('refreshToken');
      
      if (token) {
        setAccessToken(token);
        
        // JWT에서 사용자 정보 추출
        const payload = decodeJwtPayload(token);
        if (payload) {
          // JWT 페이로드에 따라 사용자 정보 설정
          const userId = payload.user_id || '0';
          const email = payload.email || '';
          
          // 역할 정보 처리: roles 배열 또는 role 값
          let role = '';
          let roles: string[] = [];
          
          // roles 배열이 있는 경우 (우선)
          if (Array.isArray(payload.roles) && payload.roles.length > 0) {
            roles = payload.roles;
            role = payload.roles[0]; // 첫 번째 역할을 기본 역할로 사용
          } 
          // role 문자열이 있는 경우
          else if (payload.role && typeof payload.role === 'string') {
            role = payload.role;
            roles = [payload.role];
          }
          // 테스트 계정 인식
          else if (email.toLowerCase() === 'seller@test.com') {
            role = 'seller';
            roles = ['seller'];
          }
          // 기본값
          else {
            role = 'user';
            roles = ['user'];
          }
          
          // 사용자 정보 설정
          setUser({
            id: userId.toString(),
            email,
            role,
            roles
          });
        }
      }
      
      if (refresh) {
        setRefreshToken(refresh);
      }
      
      setIsLoading(false);
    }
  }, []);

  /**
   * 사용자 로그인 처리 함수
   * 
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @returns 로그인 성공 여부
   * 
   * @example
   * ```tsx
   * const { login } = useAuth();
   * 
   * const handleLogin = async () => {
   *   const success = await login('user@example.com', 'password123');
   *   if (success) {
   *     // 로그인 성공 처리
   *   }
   * };
   * ```
   */
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 백엔드 로그인 API 호출
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login/`;
      console.log('로그인 요청 URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: email, // 백엔드가 username 필드 기대
          password 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || '로그인 요청 실패');
      }
      
      const data = await response.json();
      console.log('백엔드 로그인 API 응답:', data);
      
      // 토큰 저장
      const access = data.access || '';
      const refresh = data.refresh || '';
      
      // localStorage에 토큰 저장 (클라이언트 사이드)
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('dungji_auth_token', access); // 기존 코드와의 호환성 유지
      
      // 쿠키에도 토큰 저장 (서버 컴포넌트에서 사용)
      document.cookie = `accessToken=${access}; path=/; max-age=86400; SameSite=Lax`;  // 1일 만료
      document.cookie = `refreshToken=${refresh}; path=/; max-age=604800; SameSite=Lax`; // 7일 만료
      
      setAccessToken(access);
      setRefreshToken(refresh);
      
      // 사용자 정보 설정 (JWT에서 추출)
      const payload = decodeJwtPayload(access);
      console.log('JWT 토큰 페이로드:', payload);
      
      // 사용자 ID 추출 (다양한 필드명 고려)
      const userId = payload?.user_id || payload?.id || payload?.sub || '0';
      
      // 역할 정보 추출 - 백엔드와 일치하도록 수정
      // 역할 확인 방법 강화
      let userRole = 'user';
      
      // 1. JWT 페이로드에서 역할 확인
      if (payload?.role) {
        userRole = payload.role;
      } else if (payload?.roles && Array.isArray(payload.roles) && payload.roles.includes('seller')) {
        userRole = 'seller';
      } 
      
      // 2. seller@test.com 계정인지 확인 (외부 API에서 후처리 시)
      if (email && email.toLowerCase() === 'seller@test.com') {
        console.log('판매회원 이메일 확인:', email);
        userRole = 'seller';
      }
      
      // 사용자 이메일 추출
      const userEmail = payload?.email || email || '';
      
      console.log('사용자 정보 추출 결과:', {
        userId,
        userEmail,
        userRole
      });
      
      const userInfo = {
        id: userId.toString(),
        email: userEmail,
        role: userRole,
        // roles 배열은 호환성을 위해 추가
        roles: [userRole]
      };
      
      // 로컬 스토리지에 사용자 정보를 저장하여 SSR/CSR 간 상태를 유지
      try {
        localStorage.setItem('user', JSON.stringify(userInfo));
        localStorage.setItem('userRole', userRole);
        
        // seller@test.com 계정인 경우 특별 처리
        if (userEmail.toLowerCase() === 'seller@test.com') {
          localStorage.setItem('isSeller', 'true');
          console.log('판매회원 계정 특별 처리:', userEmail);
        }
      } catch (error) {
        console.error('로컬 스토리지 저장 오류:', error);
      }
      
      setUser(userInfo);
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('로그인 오류:', error);
      setIsLoading(false);
      return false;
    }
  };

  /**
   * 사용자 로그아웃 처리 함수
   * 
   * @example
   * ```tsx
   * const { logout } = useAuth();
   * 
   * const handleLogout = () => {
   *   logout();
   *   // 로그아웃 후 처리
   * };
   * ```
   */
  /**
   * 사용자 로그아웃 처리 함수
   * localStorage와 쿠키에서 토큰을 제거합니다.
   */
  const logout = () => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      // localStorage에서 토큰 제거
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('dungji_auth_token');
      
      // 쿠키에서 토큰 제거 (만료 시간을 과거 시간으로 설정)
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 인증 상태 및 기능에 접근하기 위한 훅
 * 
 * @returns 인증 컨텍스트 객체
 * 
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>로그인이 필요합니다</div>;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>프로필: {user?.email}</h1>
 *       <button onClick={logout}>로그아웃</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
