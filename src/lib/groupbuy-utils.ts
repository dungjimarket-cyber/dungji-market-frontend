/**
 * 공구 상태를 계산하는 유틸리티 함수들
 */

import { GroupBuy } from '@/types/groupbuy';

/**
 * 공구의 실제 상태를 계산합니다.
 * 백엔드에서 받은 상태와 시작/마감 시간을 고려하여 실제 상태를 결정합니다.
 * 
 * @param status 백엔드에서 받은 상태 (recruiting, bidding, final_selection 등)
 * @param startTimeStr 공구 시작 시간
 * @param endTimeStr 공구 마감 시간
 * @returns 실제 공구 상태
 */
export function calculateGroupBuyStatus(status: string, startTimeStr: string, endTimeStr: string): string {
  // 이미 완료된 상태들은 그대로 반환
  if (['completed', 'cancelled'].includes(status)) {
    return status;
  }
  
  const now = new Date();
  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);
  
  // 공구 마감 시간이 지났으면 최종선택중 또는 종료 상태로
  if (now >= endTime) {
    // seller_confirmation과 final_selection은 최종선택중으로 표시
    if (['seller_confirmation', 'final_selection'].includes(status)) {
      return 'final_selection';
    }
    // 그 외는 종료로 표시
    return 'completed';
  }
  
  // 마감 시간 전이면 백엔드 상태를 그대로 사용
  // recruiting: 입찰이 없는 상태 (모집중)
  // bidding: 입찰이 있는 상태 (입찰중)
  return status;
}

/**
 * 공구 상태에 따른 표시 텍스트를 반환합니다.
 * 
 * @param status 공구 상태
 * @returns 표시할 텍스트
 */
export function getStatusText(status: string): string {
  switch (status) {
    case 'recruiting':
      return '모집중';
    case 'bidding':
      return '입찰중';
    case 'final_selection':
      return '최종선택중';
    case 'seller_confirmation':
      return '판매자확정대기';
    case 'completed':
      return '공구종료';
    case 'cancelled':
      return '취소됨';
    case 'expired':
      return '기간만료';
    default:
      return '알 수 없음';
  }
}

/**
 * 공구 상태에 따른 스타일 클래스를 반환합니다.
 * 
 * @param status 공구 상태
 * @returns 적용할 스타일 클래스
 */
export function getStatusClass(status: string): string {
  switch (status) {
    case 'recruiting':
      return 'bg-blue-100 text-blue-800';
    case 'bidding':
      return 'bg-purple-100 text-purple-800';
    case 'final_selection':
      return 'bg-orange-100 text-orange-800';
    case 'seller_confirmation':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * 가입유형 코드를 한글로 변환하는 유틸리티 함수
 * @param registrationType 가입유형 코드 (NEW, MNP, CHANGE 등)
 * @returns 한글로 변환된 가입유형 텍스트
 */
export function getRegistrationTypeText(registrationType: string | undefined): string {
  if (!registrationType) return '-';
  
  switch (registrationType.toUpperCase()) {
    case 'NEW':
      return '신규가입';
    case 'MNP':
      return '번호이동';
    case 'CHANGE':
      return '기기변경';
    default:
      return registrationType; // 알 수 없는 유형은 원래 값 반환
  }
}

/**
 * 가입유형을 표시하는 유틸리티 함수
 * @param groupBuy 공구 정보
 * @returns 가입유형 텍스트
 */
export function getSubscriptionTypeText(groupBuy: any): string {
  // 다양한 소스에서 가입유형 정보를 처리하기 위한 로직
  
  // 1. 직접 registration_type에서 처리
  const directType = groupBuy.product_details?.registration_type;
  
  // 2. telecom_detail에서 처리
  const telecomType = groupBuy.product_details?.telecom_detail?.registration_type;
  
  // 3. attributes 속성에서 처리 (추가 가능성)
  const attributesType = groupBuy.product_details?.attributes?.registration_type;
  
  // 4. 상품 속성에서 처리 (추가 가능성)
  const productType = groupBuy.product?.registration_type;
  
  // 가장 우선순위가 높은 값을 사용
  const registrationType = directType || telecomType || attributesType || productType;
  
  // 디버깅: 로그로 어떤 소스에서 가져왔는지 확인 (console.log 사용은 개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[getSubscriptionTypeText] 가입유형 데이터 확인:', { 
      directType, 
      telecomType, 
      attributesType,
      productType,
      groupBuy: JSON.stringify(groupBuy)
    });
  }
  
  // 가입유형 결과 반환
  if (registrationType) {
    // 백엔드의 Product 모델에 정의된 가입유형에 맞게 변환 (대소문자 구분 없이 처리)
    const typeUpper = registrationType.toUpperCase();
    
    if (typeUpper === 'MNP' || typeUpper === 'TRANSFER') return '번호이동';
    if (typeUpper === 'NEW') return '신규가입';
    if (typeUpper === 'CHANGE') return '기기변경';
    
    // 추가: 이미 한글로 된 가입유형이 전달되었을 수 있음
    if (registrationType === '번호이동' || 
        registrationType === '신규가입' || 
        registrationType === '기기변경') {
      return registrationType;
    }
    
    // 그 외의 값은 그대로 반환 (이미 표시용 텍스트일 수 있음)
    return registrationType;
  }
  
  return '';
}

/**
 * 공구 타이틀을 표준 형식으로 포맷팅하는 함수
 * @param groupBuy 공구 정보
 * @param includeDetails 통신사, 가입유형, 요금제 정보를 포함할지 여부 (목록에서는 true, 상세페이지에서는 false)
 * @returns 포맷팅된 타이틀
 */
export function formatGroupBuyTitle(groupBuy: any, includeDetails: boolean = true): string {
  // 다양한 GroupBuy 객체 구조를 처리하기 위해 any 타입 사용
  
  // 상품명: product_name 또는 product_details.name 사용
  const productName = groupBuy.product_name || groupBuy.product_details?.name || '상품명 없음';
  
  // 상세 정보를 포함하지 않으면 상품명만 반환
  if (!includeDetails) {
    return productName;
  }
  
  // 통신사 정보 처리
  let carrier = '';
  // 1. 직접 carrier 속성
  if (groupBuy.product_details?.carrier) {
    carrier = groupBuy.product_details.carrier;
  } 
  // 2. telecom_detail 내부 carrier
  else if (groupBuy.product_details?.telecom_detail?.carrier) {
    carrier = groupBuy.product_details.telecom_detail.carrier;
  }
  // 3. 속성에서 처리 가능성
  else if (groupBuy.product_details?.attributes?.carrier) {
    carrier = groupBuy.product_details.attributes.carrier;
  }
  
  // 가입유형: getSubscriptionTypeText 함수로 계산 (확장된 로직)
  const subscriptionType = getSubscriptionTypeText(groupBuy);
  
  // 요금제 정보 처리
  let planInfo = '';
  // 1. 직접 plan_info 속성
  const planInfoRaw = groupBuy.product_details?.plan_info || 
                    groupBuy.product_details?.telecom_detail?.plan_info ||
                    groupBuy.product_details?.attributes?.plan_info;
  
  if (planInfoRaw) {
    planInfo = `요금제 ${planInfoRaw}`;
  }
  
  // 디버깅: 출력되는 정보 확인 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('[formatGroupBuyTitle] 타이틀 정보:', {
      productName,
      subscriptionType, // 순서 변경: 가입유형을 통신사 앞으로
      carrier,
      planInfo,
      components: [productName, subscriptionType, carrier, planInfo].filter(Boolean)
    });
  }
  
  // 필터링하여 빈 문자열은 제외하고 조합 (순서 변경: 제품+가입유형+통신사+요금제)
  return [productName, subscriptionType, carrier, planInfo].filter(Boolean).join(' ');
}

/**
 * 남은 시간을 계산하여 포맷팅된 문자열로 반환합니다.
 * 
 * @param endTime 마감 시간
 * @returns 포맷팅된 남은 시간 문자열
 */
export function getRemainingTime(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const timeDiff = end.getTime() - now.getTime();
  
  if (timeDiff <= 0) {
    return '종료됨';
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}일 ${hours}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else {
    return `${minutes}분`;
  }
}
