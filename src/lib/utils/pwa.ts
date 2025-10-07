/**
 * PWA 환경 감지 유틸리티
 * 앱이 PWA(Progressive Web App)로 실행 중인지 확인합니다.
 */

/**
 * PWA 환경인지 확인
 * @returns PWA 환경이면 true, 일반 웹/모바일 웹이면 false
 */
export const isPWA = (): boolean => {
  // 서버 사이드에서는 false 반환
  if (typeof window === 'undefined') {
    return false;
  }

  // Android/Desktop PWA 감지
  // PWA로 설치되어 standalone 모드로 실행 중인지 확인
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari PWA 감지
  // "홈 화면에 추가"로 설치된 경우
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // 두 조건 중 하나라도 true면 PWA 환경
  return isStandalone || isIOSStandalone;
};

/**
 * 현재 플랫폼 정보 반환 (디버깅용)
 */
export const getPlatformInfo = () => {
  if (typeof window === 'undefined') {
    return {
      isPWA: false,
      platform: 'server',
      userAgent: '',
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  let platform = 'web';

  if (/iphone|ipad|ipod/.test(userAgent)) {
    platform = isPWA() ? 'pwa_ios' : 'web_ios';
  } else if (/android/.test(userAgent)) {
    platform = isPWA() ? 'pwa_android' : 'web_android';
  } else {
    platform = isPWA() ? 'pwa_desktop' : 'web_desktop';
  }

  return {
    isPWA: isPWA(),
    platform,
    userAgent: window.navigator.userAgent,
  };
};
