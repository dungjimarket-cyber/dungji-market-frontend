/**
 * 커스텀 공구 등록 전 체크 함수
 * - 패널티 체크
 * - 중복 등록 체크
 * - 프로필 체크 (연락처)
 */

import { checkCustomActivePenalty, CustomPenalty } from './penaltyApi';
import { checkActiveCustomDeals } from './duplicateCheck';

export interface CreateDealCheckResult {
  canProceed: boolean;
  penaltyInfo?: CustomPenalty;
  duplicateMessage?: string;
  missingFields?: string[];
}

/**
 * 커스텀 공구 등록 가능 여부 체크
 * @param user - 현재 사용자 정보
 * @returns 체크 결과
 */
export async function checkCanCreateCustomDeal(user: any): Promise<CreateDealCheckResult> {
  // 1. 패널티 체크
  try {
    const response = await checkCustomActivePenalty();
    if (response.has_active_penalty && response.penalty) {
      return {
        canProceed: false,
        penaltyInfo: response.penalty,
      };
    }
  } catch (error) {
    console.error('패널티 체크 실패:', error);
    // 패널티 체크 실패 시에도 계속 진행
  }

  // 2. 중복 등록 체크 (seller10 계정은 예외)
  if (user?.username !== 'seller10') {
    try {
      const duplicateCheck = await checkActiveCustomDeals();
      if (duplicateCheck.hasActiveDeal) {
        return {
          canProceed: false,
          duplicateMessage: duplicateCheck.message,
        };
      }
    } catch (error) {
      console.error('중복 체크 실패:', error);
      // 중복 체크 실패 시에도 계속 진행
    }
  }

  // 3. 프로필 체크 (연락처만)
  if (user) {
    const missing: string[] = [];
    if (!user.phone_number) {
      missing.push('연락처');
    }

    if (missing.length > 0) {
      return {
        canProceed: false,
        missingFields: missing,
      };
    }
  }

  // 모든 체크 통과
  return { canProceed: true };
}
