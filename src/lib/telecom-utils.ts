/**
 * 통신사 관련 유틸리티 함수들
 */

/**
 * 통신사 코드를 한글 표시명으로 변환
 */
export const getCarrierDisplay = (carrier: string): string => {
  switch(carrier) {
    case 'SKT': return 'SKT';
    case 'KT': return 'KT';
    case 'LGU': return 'LG U+';
    case 'MVNO': return '알뜰폰';
    default: return carrier;
  }
};

/**
 * 가입 유형 코드를 한글 표시명으로 변환
 */
export const getSubscriptionTypeDisplay = (type: string): string => {
  switch(type) {
    case 'new': return '신규가입';
    case 'transfer': return '번호이동';
    case 'change': return '기기변경';
    default: return type;
  }
};

/**
 * 요금제 코드를 한글 표시명으로 변환
 * 시스템 코드(예: 5G_basic_plus)를 사용자 친화적인 표시명으로 변환
 */
export const getPlanDisplay = (plan: string): string => {
  // 요금제 정보가 객체나 JSON 문자열로 올 수 있음
  if (!plan || typeof plan !== 'string') {
    return '요금제 정보 없음';
  }

  // JSON 형태로 저장된 경우 파싱 시도
  if (plan.startsWith('{') || plan.startsWith('[')) {
    try {
      const parsed = JSON.parse(plan);
      if (parsed.name) return parsed.name;
      if (parsed.plan_name) return parsed.plan_name;
    } catch (e) {
      // JSON 파싱 실패시 그대로 진행
    }
  }

  // 시스템 코드를 사용자 친화적인 표시명으로 변환
  const planMap: Record<string, string> = {
    // 5G 요금제
    '5G_basic': '5G 베이직 (3만원대)',
    '5G_standard': '5G 스탠다드 (5만원대)',
    '5G_basic_plus': '5G 베이직 플러스 (6만원대)',
    '5G_premium': '5G 프리미엄 (7만원대)',
    '5G_premium_plus': '5G 프리미엄 플러스 (8만원대)',
    '5G_special': '5G 스페셜 (9만원대)',
    '5G_platinum': '5G 플래티넘 (10만원 이상)',
    
    // LTE 요금제
    'LTE_basic': 'LTE 베이직 (2만원대)',
    'LTE_standard': 'LTE 스탠다드 (3만원대)',
    'LTE_premium': 'LTE 프리미엄 (5만원대)',
    
    // 시니어/키즈 요금제
    'senior_basic': '시니어 베이직',
    'senior_premium': '시니어 프리미엄',
    'kids_basic': '키즈 베이직',
    'kids_premium': '키즈 프리미엄',
    
    // 데이터 무제한 요금제
    'unlimited_basic': '데이터 무제한 베이직',
    'unlimited_premium': '데이터 무제한 프리미엄',
    'unlimited_special': '데이터 무제한 스페셜',
  };

  // 매핑된 표시명이 있으면 반환
  if (planMap[plan]) {
    return planMap[plan];
  }

  // 가격대만 있는 경우 (예: "3만원대", "5만원대")
  if (plan.includes('만원')) {
    return plan;
  }

  // 알뜰폰 요금제 (예: "알뜰폰 1GB", "알뜰폰 3GB")
  if (plan.toLowerCase().includes('알뜰')) {
    return plan;
  }

  // 그 외의 경우 원본 반환 (하지만 언더스코어는 공백으로 변환)
  return plan.replace(/_/g, ' ');
};

/**
 * 계약 기간을 한글로 표시
 */
export const getContractPeriodDisplay = (period?: number): string => {
  if (!period) return '약정 없음';
  if (period === 0) return '약정 없음';
  if (period === 24) return '24개월 약정';
  if (period === 12) return '12개월 약정';
  return `${period}개월 약정`;
};

/**
 * 통신 상품 전체 정보를 포맷팅
 */
export interface TelecomInfo {
  carrier?: string;
  subscription_type?: string;
  plan_info?: string;
  contract_period?: number;
}

export const formatTelecomInfo = (info: TelecomInfo): string => {
  const parts = [];
  
  if (info.carrier) {
    parts.push(getCarrierDisplay(info.carrier));
  }
  
  if (info.subscription_type) {
    parts.push(getSubscriptionTypeDisplay(info.subscription_type));
  }
  
  if (info.plan_info) {
    parts.push(getPlanDisplay(info.plan_info));
  }
  
  if (info.contract_period !== undefined) {
    parts.push(getContractPeriodDisplay(info.contract_period));
  }
  
  return parts.join(' · ');
};