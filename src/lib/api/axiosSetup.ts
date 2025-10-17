/**
 * Axios 전역 interceptor 설정
 * 백엔드 서버 장애를 자동으로 감지하고 이벤트를 발생시킵니다.
 */

import axios from 'axios';

// 서버 다운 이벤트 타입
export const SERVER_DOWN_EVENT = 'server-down';
export const SERVER_UP_EVENT = 'server-up';

// 이미 설정되었는지 체크
let isSetup = false;

export function setupAxiosInterceptors() {
  // 중복 설정 방지
  if (isSetup) return;
  isSetup = true;

  // Response Interceptor
  axios.interceptors.response.use(
    // 성공 응답 - 그대로 반환
    (response) => {
      return response;
    },
    // 에러 응답 - 서버 다운 여부 체크
    (error) => {
      // 서버 다운으로 판단하는 조건:
      // 1. 응답이 아예 없는 경우 (네트워크 오류, CORS 오류 등)
      // 2. 502 Bad Gateway (백엔드 서버 다운)
      // 3. 503 Service Unavailable (서버 점검 중)
      // 4. 504 Gateway Timeout (서버 응답 없음)
      const isServerError =
        !error.response ||
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.response?.status === 504 ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED';

      if (isServerError) {
        // 서버 다운 이벤트 발생
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(SERVER_DOWN_EVENT, {
            detail: {
              status: error.response?.status,
              code: error.code,
              message: error.message
            }
          }));
        }
      }

      // 에러는 그대로 reject (호출한 곳에서 처리)
      return Promise.reject(error);
    }
  );

  console.info('✅ [Axios Setup] Interceptor 설정 완료');
}
