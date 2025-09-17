/**
 * 중고폰 관련 타입 정의
 * 공구와 동일한 필드명 사용
 */

// 중고폰 이미지 타입
export interface UsedPhoneImage {
  id: number;
  image?: string;
  image_url?: string;
  imageUrl?: string; // 호환성
  thumbnail?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string; // 호환성
  is_main: boolean;
  order: number;
  width?: number;
  height?: number;
  file_size?: number;
}

// 판매자 정보
export interface Seller {
  id: number;
  username: string;
  email?: string;
  nickname?: string;
}

// 지역 정보 (공구와 동일)
export interface Region {
  code: string;
  name: string;
  full_name: string;
}

// 중고폰 정보
export interface UsedPhone {
  id: number;
  
  // 판매자 정보
  seller?: Seller;
  seller_id?: number;
  
  // 기본 정보
  brand: 'apple' | 'samsung' | 'lg' | 'xiaomi' | 'other';
  model: string;
  storage?: number;
  color?: string;
  
  // 가격 정보
  price: number;
  min_offer_price?: number;
  accept_offers: boolean;
  
  // 상태 정보
  condition_grade: 'A' | 'B' | 'C';
  condition_description?: string;
  battery_status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  
  // 구성품
  body_only: boolean;
  has_box?: boolean;
  has_charger?: boolean;
  has_earphones?: boolean;
  
  // 상품 설명
  description?: string;
  
  // 지역 정보 (공구와 동일한 필드명)
  region_type?: string; // 'local' 고정
  region?: string; // 지역 코드
  region_name?: string; // 지역명 백업
  regions?: Region[]; // 다중 지역
  meeting_place?: string;
  
  // 구버전 호환 (삭제 예정)
  sido?: string;
  sigungu?: string;
  
  // 상태 및 통계
  status: 'active' | 'trading' | 'sold' | 'deleted';
  view_count: number;
  favorite_count: number;
  offer_count: number;

  // 거래 정보
  buyer_id?: number;
  
  // 이미지
  images?: UsedPhoneImage[];
  
  // 찜 여부
  is_favorite?: boolean;
  
  // 타임스탬프
  created_at: string;
  updated_at?: string;
  sold_at?: string;
}

// 가격 제안
export interface UsedPhoneOffer {
  id: number;
  phone: number;
  buyer: Seller;
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'cancelled';
  seller_message?: string;
  created_at: string;
  updated_at: string;
}

// 찜 정보
export interface UsedPhoneFavorite {
  id: number;
  phone: UsedPhone;
  created_at: string;
}