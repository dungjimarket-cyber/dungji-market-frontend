/**
 * 인증 훈 - contexts/AuthContext에서 구현한 useAuth 훈을 재내보내는 파일
 * 기존 코드와의 호환성을 위해 중간 레이어 역할
 */
export { useAuth } from '@/contexts/AuthContext';

// 기존 호환성을 위한 타입 정의
export interface AuthUser {
  id: number;
  email: string;
  username: string;
  roles?: string[];
}
