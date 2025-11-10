// 네이버 플레이스 검색 링크 생성 유틸리티

/**
 * 업체명과 주소를 기반으로 네이버 플레이스 검색 링크 생성
 *
 * @param businessName 업체명
 * @param address 주소
 * @returns 네이버 플레이스 검색 URL (리뷰 확인용)
 */
export function generateNaverPlaceSearchUrl(
  businessName: string,
  address: string
): string {
  // 주소에서 시/구 정보 추출하여 검색어 정확도 향상
  const searchQuery = `${businessName} ${address}`;
  const encodedQuery = encodeURIComponent(searchQuery);

  // 네이버 검색 결과 페이지 (플레이스 탭)
  // 사용자가 직접 업체를 선택하여 리뷰를 볼 수 있음
  return `https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodedQuery}`;
}

/**
 * 간단한 네이버 검색 링크 (업체명만)
 */
export function generateNaverSearchUrl(businessName: string): string {
  const encodedQuery = encodeURIComponent(businessName);
  return `https://search.naver.com/search.naver?where=nexearch&query=${encodedQuery}`;
}

/**
 * Google Maps 링크 생성
 */
export function generateGoogleMapsUrl(
  businessName: string,
  coords: { lat: number; lng: number }
): string {
  // Google Maps로 직접 이동 (리뷰 포함)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName)}&query_place_id=${coords.lat},${coords.lng}`;
}

/**
 * 좌표 기반 Google Maps 링크
 */
export function generateGoogleMapsCoordUrl(coords: { lat: number; lng: number }, zoom: number = 17): string {
  return `https://www.google.com/maps/@${coords.lat},${coords.lng},${zoom}z`;
}
