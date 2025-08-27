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
export const fetchWithAuth = async (
  url: string,
  options: RequestInit & { skipAuthRedirect?: boolean } = {}
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
        
        // 토큰 만료 오류인 경우 (skipAuthRedirect가 true가 아닐 때만 리다이렉트)
        if (response.status === 401 && 
            errorData?.code === 'token_not_valid' && 
            typeof window !== 'undefined' &&
            !options.skipAuthRedirect) {
          console.error('토큰이 만료되었습니다. 로그인 페이지로 이동합니다.');
          window.location.href = '/login';
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
