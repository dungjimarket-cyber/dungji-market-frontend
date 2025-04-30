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
  status: string;
  current_participants: number;
  min_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product: number; // product ID
  product_details: GroupBuyProduct; // 상세 제품 정보
  creator: number; // 판매자(생성자) ID
  creator_name: string; // 판매자(생성자) 이름
  region_type?: string; // 지역 유형 (local, nationwide)
  
  // 통신 관련 공구 정보 (명시적 필드)
  telecom_carrier?: string; // 통신사 (SKT, KT, LGU, MVNO)
  subscription_type?: string; // 가입유형 (new, transfer, change)
  plan_info?: string; // 요금제 (5G_basic, 5G_standard, 5G_premium, 5G_special, 5G_platinum)
}

// 참여 상태 정보
export interface ParticipationStatus {
  is_participating: boolean;
  has_bids: boolean;
  can_leave: boolean;
}
