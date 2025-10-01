import { tokenUtils } from '../tokenUtils';

/**
 * 인증이 필요한 API 요청을 수행합니다.
 * 
 * @param url - API 엔드포인트 URL
 * @param options - fetch 옵션
 * @returns 응답 객체
 * 
 * @example
 * ```ts
 * const response = await fetchWithAuth('/api/notifications/');
 * const data = await response.json();
 * ```
 */
// 토큰 갱신 중인지 추적하는 플래그
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const fetchWithAuth = async (
  url: string,
  options: RequestInit & { skipAuthRedirect?: boolean; _isRetry?: boolean } = {}
): Promise<Response> => {
  try {
    const headers = await tokenUtils.getAuthHeaders();

    // API URL 설정
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      // 응답 본문 텍스트로 받아서 확인
      const responseText = await response.text();

      // JSON으로 파싱 시도
      let errorData;
      try {
        errorData = JSON.parse(responseText);

        // 토큰 만료 오류인 경우
        if (response.status === 401 &&
            errorData?.code === 'token_not_valid' &&
            typeof window !== 'undefined' &&
            !options.skipAuthRedirect &&
            !options._isRetry) {  // 재시도가 아닐 때만

          console.log('토큰 만료 감지, 갱신 시도...');

          // 이미 갱신 중이면 기존 Promise를 기다림
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = tokenUtils.refreshAccessToken();
          }

          const newToken = await refreshPromise;
          isRefreshing = false;
          refreshPromise = null;

          if (newToken) {
            // 토큰 갱신 성공 - 원래 요청 재시도
            console.log('토큰 갱신 성공, 요청 재시도');
            return fetchWithAuth(url, { ...options, _isRetry: true });
          } else {
            // 토큰 갱신 실패 - 로그인 페이지로
            console.error('토큰 갱신 실패, 로그인 페이지로 이동');
            window.location.href = '/login';
          }
        }
      } catch (e) {
        // JSON 파싱 실패 시 원본 텍스트 사용
        console.error('API 응답 파싱 실패:', e);
      }
      
      // 다양한 형식의 에러 메시지 추출
      let errorMessage = '요청 처리 중 오류가 발생했습니다.';
      
      if (errorData) {
        // Django REST Framework 형식의 필드별 에러 처리
        if (errorData.product && typeof errorData.product === 'string') {
          errorMessage = errorData.product;
        } else if (errorData.product && Array.isArray(errorData.product)) {
          errorMessage = errorData.product[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'object') {
          // 첫 번째 필드의 첫 번째 에러 메시지 사용
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && errorData[firstKey]) {
            if (typeof errorData[firstKey] === 'string') {
              errorMessage = errorData[firstKey];
            } else if (Array.isArray(errorData[firstKey]) && errorData[firstKey].length > 0) {
              errorMessage = errorData[firstKey][0];
            }
          }
        }
      }
      
      // 에러 응답 반환
      throw new Error(errorMessage);
    }
    
    return response;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
};
