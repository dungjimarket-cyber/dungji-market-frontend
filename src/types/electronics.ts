/**
 * 전자제품/가전 중고거래 타입 정의
 */

// ============================================
// 기본 Enum 타입
// ============================================

export type ElectronicsSubcategory = 'laptop' | 'tv' | 'game' | 'camera' | 'audio' | 'home' | 'etc';
export type ConditionGrade = 'S' | 'A' | 'B' | 'C';
export type PurchasePeriod = '1month' | '3months' | '6months' | '1year' | 'over' | 'custom';  // custom 추가 for 자유 입력
export type ElectronicsStatus = 'active' | 'trading' | 'sold' | 'deleted';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

// ============================================
// 메인 엔티티 타입
// ============================================

/**
 * 전자제품/가전 상품
 */
export interface UsedElectronics {
  id: number;
  seller: number;

  // 카테고리
  subcategory: ElectronicsSubcategory;
  subcategory_display?: string;

  // 제품 정보
  brand: string;
  model_name: string;

  // 상태 정보
  purchase_period?: string;  // 자유 텍스트 입력
  usage_period?: string;     // 사용기간
  is_unused: boolean;        // 미개봉
  condition_grade: ConditionGrade;
  condition_display?: string;

  // 구성품
  has_box: boolean;
  has_charger: boolean;
  has_manual: boolean;
  other_accessories?: string;

  // 추가 정보
  has_receipt?: boolean;
  has_warranty_card?: boolean;
  serial_number?: string;
  warranty_end_date?: string;
  purchase_date?: string;
  extra_specs?: Record<string, any>;

  // 가격 정보
  price: number;
  accept_offers: boolean;
  min_offer_price?: number;

  // 상품 설명
  description: string;

  // 거래 정보
  region?: any;
  regions?: ElectronicsRegion[];
  region_name?: string;
  meeting_place: string;  // 거래 요청사항

  // 상태 관리
  status: ElectronicsStatus;
  view_count: number;
  offer_count: number;
  favorite_count: number;

  // 관계 데이터
  images?: ElectronicsImage[];
  seller_info?: SellerInfo;
  buyer?: SellerInfo;  // 거래중/완료 상태일 때 구매자 정보
  buyer_id?: number;   // 거래중일 때 구매자 ID
  transaction_id?: number;  // 거래 ID
  is_favorited?: boolean;
  is_mine?: boolean;
  has_my_offer?: boolean;

  // 타임스탬프
  created_at: string;
  updated_at: string;
}

/**
 * 전자제품 이미지
 */
export interface ElectronicsImage {
  id: number;
  image?: string;
  imageUrl?: string;
  is_primary: boolean;
  order: number;
}

/**
 * 거래 지역
 */
export interface ElectronicsRegion {
  code: string;
  name: string;
  full_name?: string;
}

/**
 * 판매자 정보
 */
export interface SellerInfo {
  id: number;
  username: string;
  nickname: string;
  sell_count?: number;
}

/**
 * 가격 제안
 */
export interface ElectronicsOffer {
  id: number;
  electronics: number;
  buyer: number | SellerInfo;
  offer_price: number;
  message?: string;
  status: OfferStatus;
  created_at: string;
  electronics_info?: {
    id: number;
    brand: string;
    model_name: string;
    price: number;
    status: string;
  };
}

/**
 * 찜하기
 */
export interface ElectronicsFavorite {
  id: number;
  user: number;
  electronics: UsedElectronics;
  created_at: string;
}

// ============================================
// 폼 관련 타입
// ============================================

/**
 * 전자제품 등록/수정 폼 데이터
 */
export interface ElectronicsFormData {
  subcategory: ElectronicsSubcategory;
  brand: string;
  model_name: string;
  purchase_period?: string;  // 자유 텍스트 입력
  usage_period?: string;  // 사용기간 추가
  is_unused?: boolean;    // 미사용 여부 추가
  condition_grade: ConditionGrade;
  has_box: boolean;
  has_charger: boolean;
  other_accessories?: string;
  has_warranty_card?: boolean;
  price: string;  // string으로 변경 (폰과 통일)
  accept_offers: boolean;
  min_offer_price?: string;  // string으로 변경 (폰과 통일)
  description: string;
  regions: string[];  // number[] -> string[] (지역 코드 배열)
  meeting_place: string;
  images?: File[];
}

// ============================================
// API 응답 타입
// ============================================

export interface ElectronicsListResponse {
  results: UsedElectronics[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ElectronicsCheckLimitResponse {
  active_count: number;
  can_register: boolean;
  penalty_end: string | null;
}

// ============================================
// 상수
// ============================================

export const ELECTRONICS_SUBCATEGORIES = {
  laptop: '노트북/컴퓨터',
  tv: 'TV/모니터',
  game: '게임기',
  camera: '카메라',
  audio: '음향기기',
  home: '생활가전',
  etc: '기타',
} as const;

// 번개장터/당근마켓 스타일로 명확하게 정리
export const CONDITION_GRADES = {
  S: '미개봉',           // 포장 미개봉 새제품
  A: '거의 새것',        // 사용감 없거나 1-2회 사용
  B: '사용감 적음',      // 깨끗하게 사용, 생활기스 정도
  C: '사용감 많음',      // 사용감 있지만 기능 정상
} as const;

export const PURCHASE_PERIODS = {
  '1month': '1개월 이내',
  '3months': '3개월',
  '6months': '6개월',
  '1year': '1년',
  'over': '1년 이상',
} as const;

export const ELECTRONICS_STATUS = {
  active: '판매중',
  trading: '거래중',
  sold: '판매완료',
  deleted: '삭제됨',
} as const;