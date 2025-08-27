import { fetchWithAuth } from '@/lib/api/fetch';

interface TokenRefreshResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    is_superuser: boolean;
  };
}

interface TokenVerifyResponse {
  user_id: number;
  username: string;
  token_role: string;
  db_role: string;
  role_match: boolean;
  is_superuser: boolean;
  message: string;
}

/**
 * JWT 토큰의 role 정보와 DB의 role 정보를 검증
 */
export async function verifyTokenRole(): Promise<TokenVerifyResponse> {
  const response = await fetchWithAuth('/api/auth/token/verify-role/', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('토큰 검증 실패');
  }

  return response.json();
}

/**
 * 현재 사용자의 JWT 토큰을 강제로 갱신
 * role이 잘못된 경우 사용
 */
export async function refreshUserToken(): Promise<TokenRefreshResponse> {
  const response = await fetchWithAuth('/api/auth/token/refresh-force/', {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('토큰 갱신 실패');
  }

  const data = await response.json();
  
  // 새로운 토큰을 세션 스토리지에 저장 (NextAuth 세션 업데이트 필요)
  if (data.access) {
    // NextAuth 세션 업데이트 로직 필요
    console.log('새로운 토큰 발급됨:', data.user);
  }
  
  return data;
}

/**
 * 사용자 role이 'user'인 경우 자동으로 토큰 갱신
 */
export async function checkAndRefreshTokenIfNeeded(userRole: string): Promise<boolean> {
  if (userRole === 'user') {
    try {
      // 먼저 토큰 검증
      const verifyResult = await verifyTokenRole();
      
      if (!verifyResult.role_match && verifyResult.db_role !== 'user') {
        // DB role이 'user'가 아닌데 토큰이 'user'인 경우 갱신
        console.log('토큰 role 불일치 감지, 토큰 갱신 시작...');
        await refreshUserToken();
        return true; // 갱신됨
      }
    } catch (error) {
      console.error('토큰 검증/갱신 실패:', error);
    }
  }
  return false; // 갱신 안됨
}