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

    // 모집중 또는 판매자 확정 대기 상태의 공구 개수 확인 (최대 5개)
    if (data.results && data.results.length > 0) {
      const activeDealCount = data.results.filter(
        (deal: any) => deal.status === 'recruiting' || deal.status === 'pending_seller'
      ).length;

      if (activeDealCount >= 5) {
        return {
          hasActiveDeal: true,
          message: `최대 5개의 공구까지 동시 진행 가능합니다.\n\n현재 ${activeDealCount}개의 공구가 진행 중입니다.`
        };
      }
    }

    return { hasActiveDeal: false };
  } catch (error) {
    console.error('활성 공구 체크 실패:', error);
    return { hasActiveDeal: false }; // 에러 시 등록 진행
  }
}
