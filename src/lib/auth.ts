/**
 * JWT 기반 인증 관련 유틸리티 함수들을 제공합니다.
 */

/**
 * 사용자 정보 타입
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  image?: string;
}

/**
 * JWT 토큰 타입
 */
export interface JwtToken {
  access: string;
  refresh: string;
}

/**
 * 로그인 인증 요청 타입
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * JWT 토큰에서 페이로드를 디코딩하는 유틸리티 함수
 * @param token JWT 토큰 문자열
 * @returns 디코딩된 페이로드 객체
 */
export function decodeJwtToken(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT 디코딩 오류:', error);
    return null;
  }
}

/**
 * 사용자 이메일 주소로부터 역할을 판단하는 함수
 * @param email 사용자 이메일
 * @returns 사용자 역할 ('seller' 또는 'user')
 */
export function getRoleFromEmail(email: string): string {
  return email === 'seller@test.com' ? 'seller' : 'user';
}

/**
 * JWT 토큰에서 사용자 ID를 추출하는 함수
 * @param token JWT 토큰 문자열
 * @returns 사용자 ID 또는 에러 발생 시 'unknown'
 */
export function getUserIdFromToken(token: string): string {
  try {
    const payload = decodeJwtToken(token);
    return payload?.user_id?.toString() || 'unknown';
  } catch (error) {
    console.error('토큰에서 사용자 ID 추출 오류:', error);
    return 'unknown';
  }
}
