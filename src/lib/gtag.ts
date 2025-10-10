/**
 * Google Ads/Analytics 추적 유틸리티
 */

// Google Analytics 측정 ID 타입
export const GA_TRACKING_ID = 'AW-17509206142';

// gtag 함수 타입 정의
declare global {
  interface Window {
    gtag: (
      command: string,
      ...args: any[]
    ) => void;
    dataLayer: any[];
  }
}

// 페이지뷰 추적
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// 이벤트 추적
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Google Ads 전환 이벤트
export const conversionEvent = (conversionLabel: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${GA_TRACKING_ID}/${conversionLabel}`,
      ...parameters,
    });
  }
};

// 회원가입 전환 이벤트
export const trackSignupConversion = (userId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      'send_to': 'AW-17509206142/lgYiCMrmrKobEP6QhZ1B'
    });
  }
};

// 구매 전환 이벤트
export const trackPurchaseConversion = (value: number, currency: string = 'KRW', transactionId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ads_conversion___1', {
      value: value,
      currency: currency,
      transaction_id: transactionId,
      conversion_time: new Date().toISOString(),
    });
  }
};

// 공동구매 참여 전환 이벤트
export const trackGroupBuyConversion = (groupBuyId: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ads_conversion___1', {
      item_id: groupBuyId,
      value: value,
      event_category: 'group_buy_participation',
      conversion_time: new Date().toISOString(),
    });
  }
};