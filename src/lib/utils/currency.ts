/**
 * 통화 관련 유틸리티 함수
 */

/**
 * 가격을 한국 원화 형식으로 포맷팅
 * @param price - 가격 (숫자)
 * @param showCurrency - 통화 단위 표시 여부 (기본값: true)
 * @returns 포맷팅된 가격 문자열
 */
export function formatKRW(price: number | string, showCurrency: boolean = true): string {
  const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;

  if (isNaN(numPrice)) {
    return showCurrency ? '0원' : '0';
  }

  const formatted = numPrice.toLocaleString('ko-KR');
  return showCurrency ? `${formatted}원` : formatted;
}

/**
 * 가격을 원화 기호와 함께 표시 (HTML entity 사용)
 * @param price - 가격 (숫자)
 * @returns HTML entity를 사용한 원화 표시
 */
export function formatKRWWithSymbol(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;

  if (isNaN(numPrice)) {
    return '0원';
  }

  // HTML entity 사용 (₩ 대신)
  return `${numPrice.toLocaleString('ko-KR')}원`;
}

/**
 * 가격 범위 표시 (최저가 ~ 최고가)
 * @param minPrice - 최저가
 * @param maxPrice - 최고가
 * @returns 포맷팅된 가격 범위
 */
export function formatPriceRange(minPrice: number, maxPrice: number): string {
  if (minPrice === maxPrice) {
    return formatKRW(minPrice);
  }
  return `${formatKRW(minPrice, false)} ~ ${formatKRW(maxPrice)}`;
}