/**
 * 커스텀 공구 중복 등록 체크 API
 */

interface DuplicateCheckResult {
  hasActiveDeal: boolean;
  message?: string;
}

/**
 * 진행 중인 커스텀 공구가 있는지 체크
 * @returns {Promise<DuplicateCheckResult>}
 */
export async function checkActiveCustomDeals(): Promise<DuplicateCheckResult> {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return { hasActiveDeal: false };
    }

    // status 필터 제거 - 모든 상태를 가져와서 프론트에서 필터링
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?seller=me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      return { hasActiveDeal: false };
    }

    const data = await response.json();

    // 모집중 또는 판매자 확정 대기 상태의 공구가 있는지 확인
    if (data.results && data.results.length > 0) {
      const hasActiveDeals = data.results.some(
        (deal: any) => deal.status === 'recruiting' || deal.status === 'pending_seller'
      );

      if (hasActiveDeals) {
        return {
          hasActiveDeal: true,
          message: '현재 진행중인 공구가 있습니다.\n\n기존 공구가 마감된 후에 새로운 공구를 등록할 수 있습니다.'
        };
      }
    }

    return { hasActiveDeal: false };
  } catch (error) {
    console.error('활성 공구 체크 실패:', error);
    return { hasActiveDeal: false }; // 에러 시 등록 진행
  }
}
