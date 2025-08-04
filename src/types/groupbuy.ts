/**
 * 공구 관련 타입 정의
 */

// 상품 상세 정보 타입
export interface GroupBuyProduct {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  category_name?: string;
  image_url?: string;
  
  // 통신 관련 필드 (타입 호환을 위해 추가)
  carrier?: string;
  registration_type?: string;
  plan_info?: string;
  contract_info?: string;
  
  // 상세 객체 참조
  telecom_detail?: TelecomDetail;
  electronics_detail?: ElectronicsDetail;
  rental_detail?: RentalDetail;
  subscription_detail?: SubscriptionDetail;
  release_date?: string;
}

// 통신 상품 상세 정보
export interface TelecomDetail {
  carrier?: string;
  registration_type?: string;
  plan_info?: string;
  contract_info?: string;
}

// 가전 상품 상세 정보
export interface ElectronicsDetail {
  manufacturer?: string;
  warranty_period?: string;
}

// 렌탈 상품 상세 정보
export interface RentalDetail {
  rental_period?: string;
}

// 구독 상품 상세 정보
export interface SubscriptionDetail {
  payment_cycle?: string;
}

// 공구 정보 타입
export interface GroupBuy {
  id: number;
  title: string;
  description: string;
  status: 'recruiting' | 'bidding' | 'final_selection_buyers' | 'final_selection_seller' | 'completed' | 'cancelled';
  current_participants: number;
  min_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  final_selection_end?: string; // 구매자 최종선택 종료 시간
  seller_selection_end?: string; // 판매자 최종선택 종료 시간
  product: number; // product ID
  product_details: GroupBuyProduct; // 상세 제품 정보
  product_name?: string; // 상품명 백업 필드
  creator: number; // 판매자(생성자) ID
  creator_name: string; // 판매자(생성자) 이름
  region_type?: string; // 지역 유형 (local, nationwide)
  region?: string; // 지역명 (서울, 부산 등)
  region_name?: string; // 지역 상세명 (서울특별시, 부산광역시 등)
  
  // 통신 관련 공구 정보 (명시적 필드)
  telecom_carrier?: string; // 통신사 (SKT, KT, LGU, MVNO)
  subscription_type?: string; // 가입유형 (new, transfer, change)
  plan_info?: string; // 요금제 (5G_basic, 5G_standard, 5G_premium, 5G_special, 5G_platinum)
  
  // 통신 상세 정보 (중첩 객체)
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    subscription_type_korean?: string;
    plan_info: string;
    contract_period?: string;
  };
  
  // 가전제품 상세 정보
  electronics_detail?: {
    manufacturer: string;
    warranty_period?: string;
    power_consumption?: string;
    dimensions?: string;
  };
  
  // 다중 지역 정보
  regions?: Array<{
    id: number;
    name: string;
    parent?: string;
  }>;
}

// 참여 상태 정보
export interface ParticipationStatus {
  is_participating: boolean;
  has_bids: boolean;
  can_leave: boolean;
}

// 참여자 동의 관련 타입
export interface ParticipantConsent {
  id: number;
  participation: number;
  bid: number;
  status: 'pending' | 'agreed' | 'disagreed' | 'expired';
  agreed_at: string | null;
  disagreed_at: string | null;
  consent_deadline: string;
  created_at: string;
  participant_name: string;
  groupbuy_title: string;
  bid_amount: number;
  bid_type: string;
  remaining_time: string | null;
}

export interface ConsentStatus {
  summary: {
    total: number;
    agreed: number;
    disagreed: number;
    pending: number;
    expired: number;
    all_agreed: boolean;
    can_proceed: boolean;
  };
  details: Array<{
    user: string;
    status: '동의' | '거부' | '만료' | '대기중';
    agreed_at: string | null;
    disagreed_at: string | null;
  }>;
}
