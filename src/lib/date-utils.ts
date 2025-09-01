/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 백엔드에서 받은 KST 시간 문자열을 Date 객체로 변환
 * 백엔드는 USE_TZ=False와 TIME_ZONE="Asia/Seoul"을 사용하므로
 * 타임존 정보 없이 KST 시간을 보냄
 */
export function parseKSTDate(dateStr: string | Date): Date {
  // 이미 Date 객체인 경우
  if (dateStr instanceof Date) {
    return dateStr;
  }
  
  const str = String(dateStr);
  
  // 타임존 정보 체크
  if (str.includes('T') && !str.includes('Z') && !str.includes('+') && !str.includes('-')) {
    // ISO 형식이지만 타임존 정보가 없는 경우 (예: "2024-01-01T12:00:00")
    // 백엔드가 KST를 사용하므로 KST로 해석
    return new Date(str + '+09:00');
  } else if (!str.includes('T')) {
    // ISO 형식이 아닌 경우 (예: "2024-01-01 12:00:00")
    // 공백을 T로 바꾸고 KST 타임존 추가
    const isoFormat = str.replace(' ', 'T') + '+09:00';
    return new Date(isoFormat);
  } else {
    // 이미 올바른 형식인 경우 (Z, +, - 포함)
    return new Date(str);
  }
}

/**
 * 두 날짜 사이의 시간 차이 계산 (밀리초)
 */
export function getTimeDifference(endDate: string | Date, startDate: Date = new Date()): number {
  const end = parseKSTDate(endDate).getTime();
  const start = startDate.getTime();
  return end - start;
}

/**
 * 시간이 만료되었는지 확인
 */
export function isExpired(endDate: string | Date): boolean {
  return getTimeDifference(endDate) <= 0;
}

/**
 * 날짜를 한국 형식으로 포맷팅
 */
export function formatKoreanDate(date: string | Date): string {
  const d = parseKSTDate(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 날짜를 간단한 한국 형식으로 포맷팅 (날짜만)
 */
export function formatSimpleKoreanDate(date: string | Date): string {
  const d = parseKSTDate(date);
  return d.toLocaleDateString('ko-KR');
}