/**
 * 금액 마스킹 유틸리티
 * 구성표 기준에 따른 최종 낙찰 금액 표시 규칙
 */

/**
 * 금액을 마스킹 처리합니다.
 * @param amount - 마스킹할 금액
 * @returns 마스킹된 금액 문자열
 */
export function maskAmount(amount: number): string {
  const amountStr = amount.toString();
  const length = amountStr.length;
  
  if (length <= 1) {
    return amountStr;
  }
  
  // 첫 자리만 보이고 나머지는 * 표시
  return amountStr[0] + "*".repeat(length - 1);
}

/**
 * 사용자 상태에 따라 금액을 표시합니다.
 * @param amount - 표시할 금액
 * @param userRole - 사용자 역할 (buyer, seller, null)
 * @param isParticipant - 공구 참여 여부
 * @param isWinner - 낙찰자 여부 (판매자용)
 * @param isBuyerConfirmed - 구매확정 여부 (구매자용)
 * @returns 포맷된 금액 문자열
 */
export function formatAmountByUserStatus(
  amount: number,
  userRole: 'buyer' | 'seller' | null,
  isParticipant: boolean = false,
  isWinner: boolean = false,
  isBuyerConfirmed: boolean = false
): string {
  // 비회원
  if (!userRole) {
    return maskAmount(amount);
  }
  
  // 판매회원이면서 낙찰자
  if (userRole === 'seller' && isWinner) {
    return amount.toLocaleString();
  }
  
  // 구매회원이면서 구매확정한 참여자
  if (userRole === 'buyer' && isParticipant && isBuyerConfirmed) {
    return amount.toLocaleString();
  }
  
  // 구매회원이지만 미참여 또는 구매확정 안함
  if (userRole === 'buyer' && !isParticipant) {
    return maskAmount(amount);
  }
  
  // 기본: 정상 표기
  return amount.toLocaleString();
}

/**
 * 입찰 내역 표시 규칙
 * @param amount - 입찰 금액
 * @param isMyBid - 본인 입찰 여부
 * @param rank - 순위 (1-10위는 정상 표기)
 * @returns 포맷된 금액 문자열
 */
export function formatBidAmount(
  amount: number,
  isMyBid: boolean = false,
  rank: number = 999
): string {
  // 본인 입찰은 항상 정상 표기
  if (isMyBid) {
    return amount.toLocaleString();
  }
  
  // 1위부터 10위까지는 정상 표기
  if (rank >= 1 && rank <= 10) {
    return amount.toLocaleString();
  }
  
  // 11위 이하는 마스킹
  return maskAmount(amount);
}