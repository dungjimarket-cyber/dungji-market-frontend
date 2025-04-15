/**
 * 공구 상태를 계산하는 유틸리티 함수들
 */

/**
 * 공구의 실제 상태를 계산합니다.
 * 백엔드에서 받은 상태와 마감 시간을 고려하여 실제 상태를 결정합니다.
 * 
 * @param status 백엔드에서 받은 상태 (recruiting, confirmed, completed 등)
 * @param endTime 공구 마감 시간
 * @returns 실제 공구 상태
 */
export function calculateGroupBuyStatus(status: string, endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  
  // 이미 종료된 상태라면 그대로 반환
  if (status === 'completed') {
    return 'completed';
  }
  
  // 확정된 상태라면 그대로 반환
  if (status === 'confirmed') {
    return 'confirmed';
  }
  
  // 모집 중이지만 마감 시간이 지났다면 'expired' 상태로 변경
  if (status === 'recruiting' && end < now) {
    return 'expired';
  }
  
  // 그 외의 경우는 원래 상태 유지
  return status;
}

/**
 * 공구 상태에 따른 표시 텍스트를 반환합니다.
 * 
 * @param status 공구 상태
 * @returns 표시할 텍스트
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'recruiting':
      return '모집중';
    case 'confirmed':
      return '확정';
    case 'completed':
      return '종료';
    case 'expired':
      return '기간만료';
    default:
      return '알 수 없음';
  }
}

/**
 * 공구 상태에 따른 스타일 클래스를 반환합니다.
 * 
 * @param status 공구 상태
 * @returns 적용할 스타일 클래스
 */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'recruiting':
      return 'bg-blue-100 text-blue-800';
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'expired':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * 남은 시간을 계산하여 포맷팅된 문자열로 반환합니다.
 * 
 * @param endTime 마감 시간
 * @returns 포맷팅된 남은 시간 문자열
 */
export function getRemainingTime(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const timeDiff = end.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return '종료됨';
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}일 ${hours}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
}
