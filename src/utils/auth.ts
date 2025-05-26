/**
 * 인증 관련 유틸리티 함수 모음
 */

/**
 * 사용자 역할 확인 유틸리티 함수
 * 다양한 소스에서 사용자 역할을 추출하여 표준화된 문자열 반환
 * 
 * @param user 사용자 객체 (JWT 디코딩 결과 또는 세션 정보)
 * @param email 사용자 이메일 (선택적)
 * @returns 표준화된 사용자 역할 ('seller' 또는 'user')
 */
export const getUserRole = (user: any, email?: string): string => {
  // 1. 사용자 객체에서 역할 확인
  if (user?.role) return user.role;
  
  // 2. 이메일 기반 판매자 확인 (백업)
  const userEmail = email || user?.email;
  if (userEmail?.toLowerCase() === 'seller@test.com') return 'seller';
  
  // 3. 기본 역할
  return 'user';
};

/**
 * 로그인 성공 이벤트 발행 함수
 * 여러 컴포넌트에서 인증 상태 변경을 감지할 수 있도록 이벤트 발생
 */
export const triggerAuthEvent = (): void => {
  if (typeof window !== 'undefined') {
    // 여러 시점에 이벤트 발생으로 모든 컴포넌트가 동기화되도록 함
    window.dispatchEvent(new Event('storage'));
    
    // 지연된 이벤트 발생으로 비동기 처리 후에도 동기화 보장
    setTimeout(() => window.dispatchEvent(new Event('storage')), 100);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 500);
    setTimeout(() => window.dispatchEvent(new Event('storage')), 1000);
  }
};

/**
 * 로컬 스토리지에서 인증 토큰 가져오기
 * 여러 키에서 토큰을 확인하여 가장 유효한 토큰 반환
 * 
 * @returns 인증 토큰 또는 null
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // 우선순위에 따라 토큰 키 확인
  const tokenKeys = [
    'dungji_auth_token',  // 표준 키
    'accessToken',        // 레거시 키
    'auth.token'          // NextAuth 호환 키
  ];
  
  // 가장 먼저 발견된 유효한 토큰 반환
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }
  
  return null;
};

/**
 * 인증 상태 확인 함수
 * 토큰 존재 여부로 로그인 상태 판단
 * 
 * @returns 인증 상태 여부
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
