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
  nickname?: string;
  roles?: string[];
  role?: string;
  address_region?: {
    code: string;
    name: string;
    full_name: string;
    level: number;
  };
  phone_number?: string;
  sns_type?: string;
  business_number?: string;
  is_business_verified?: boolean;
  is_remote_sales?: boolean;
  user_type?: string;
  birth_date?: string;
  gender?: string;
  first_name?: string;
  region?: string;
  penalty_info?: {
    is_active: boolean;
    penalty_type?: string;
    type?: string;
    reason: string;
    count: number;
    start_date?: string;
    end_date?: string;
    remaining_hours?: number;
    remaining_minutes?: number;
    remaining_text?: string;
  };
  penaltyInfo?: {
    isActive: boolean;
    penaltyType?: string;
    type?: string;
    reason: string;
    count: number;
    startDate?: string;
    endDate?: string;
    remainingHours?: number;
    remainingMinutes?: number;
    remainingText?: string;
  };
}
