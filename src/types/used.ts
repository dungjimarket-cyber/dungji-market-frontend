/**
 * 중고폰 직거래 서비스 타입 정의
 */

// ============================================
// 기본 Enum 타입
// ============================================

export type PhoneBrand = 'samsung' | 'apple' | 'lg' | 'xiaomi' | 'other';
export type PhoneSeries = 'Galaxy S' | 'Galaxy Z' | 'Galaxy A' | 'iPhone' | 'V' | 'Redmi' | string;
export type StorageSize = 64 | 128 | 256 | 512 | 1024;
export type ConditionGrade = 'S' | 'A' | 'B' | 'C';
export type BatteryStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'defective';
export type PurchasePeriod = '1' | '3' | '6' | '12' | 'over';
export type PhoneStatus = 'active' | 'trading' | 'sold' | 'completed' | 'deleted';
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
export type TransactionStatus = 'in_progress' | 'completed' | 'cancelled' | 'disputed';
export type ReportReason = 'spam' | 'fraud' | 'inappropriate' | 'duplicate' | 'price_manipulation' | 'other';

// ============================================
// 메인 엔티티 타입
// ============================================

/**
 * 중고폰 상품
 */
export interface UsedPhone {
  id: number;
  user_id: number;
  
  // 기본 정보
  brand: PhoneBrand;
  series?: string;
  model: string;
  model_name?: string; // 백엔드에서 오는 필드명
  storage?: StorageSize;
  color?: string;
  
  // 상태 정보
  condition_grade: ConditionGrade;
  condition_description?: string;
  battery_status?: BatteryStatus;
  purchase_period?: PurchasePeriod;
  manufacture_date?: string; // YYYY-MM format
  
  // 판매 정보
  price: number;
  final_price?: number; // 거래완료된 경우 실제 거래 금액
  accept_offers: boolean;
  min_offer_price?: number;
  accessories?: string[]; // ["charger", "box", "earphone", "case"]
  
  // 구성품
  has_box?: boolean;
  has_charger?: boolean;
  has_earphones?: boolean;
  body_only?: boolean;
  
  // 거래 정보
  trade_location?: string;
  meeting_place?: string;
  description?: string;
  
  // 지역 정보
  sido?: string;
  sigungu?: string;
  region_name?: string;
  regions?: any[];
  
  // 상태 관리
  status: PhoneStatus;
  view_count: number;
  offer_count: number;
  favorite_count?: number;
  
  // 관계 데이터
  images?: PhoneImage[];
  offers?: UsedOffer[];
  seller?: UserBasicInfo;
  buyer?: UserBasicInfo; // 거래중/완료 상태일 때 구매자 정보
  buyer_id?: number; // 거래중일 때 구매자 ID
  is_favorite?: boolean; // 현재 사용자가 찜했는지 여부
  is_modified?: boolean; // 견적 후 수정됨 여부
  seller_reviewed?: boolean; // 판매자가 후기를 작성했는지
  buyer_reviewed?: boolean; // 구매자가 후기를 작성했는지
  transaction_id?: number; // 거래 ID (거래중/완료 상태일 때)
  
  // 타임스탬프
  created_at: string;
  updated_at: string;
  trading_at?: string;
  sold_at?: string;
  deleted_at?: string;
}

/**
 * 상품 이미지
 */
export interface PhoneImage {
  id: number;
  phoneId: number;
  imageUrl: string;
  imageOrder: number; // 0: 대표이미지
  fileSize?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

/**
 * 가격 제안
 */
export interface UsedOffer {
  id: number;
  phoneId: number;
  userId: number;
  
  offeredPrice: number;
  message?: string;
  status: OfferStatus;
  
  // 관계 데이터
  phone?: UsedPhone;
  buyer?: UserBasicInfo;
  
  // 타임스탬프
  createdAt: string;
  respondedAt?: string;
  cancelledAt?: string;
  expiredAt?: string;
}

/**
 * 거래 내역
 */
export interface UsedTransaction {
  id: number;
  phoneId: number;
  sellerId: number;
  buyerId: number;
  offerId?: number;
  
  finalPrice: number;
  tradeMethod: 'direct' | 'safety';
  status: TransactionStatus;
  
  // 평가
  sellerRating?: number; // 1-5
  buyerRating?: number; // 1-5
  sellerReview?: string;
  buyerReview?: string;
  
  // 관계 데이터
  phone?: UsedPhone;
  seller?: UserBasicInfo;
  buyer?: UserBasicInfo;
  offer?: UsedOffer;
  
  // 타임스탬프
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

/**
 * 채팅 메시지
 */
export interface UsedChat {
  id: number;
  phoneId: number;
  offerId?: number;
  senderId: number;
  receiverId: number;
  
  message: string;
  isRead: boolean;
  messageType: 'text' | 'image' | 'system';
  
  // 관계 데이터
  sender?: UserBasicInfo;
  receiver?: UserBasicInfo;
  
  createdAt: string;
  readAt?: string;
}

/**
 * 신고
 */
export interface UsedReport {
  id: number;
  reporterId: number;
  phoneId?: number;
  reportedUserId?: number;
  
  reason: ReportReason;
  description?: string;
  evidenceUrls?: string[];
  
  status: 'pending' | 'reviewing' | 'confirmed' | 'dismissed';
  adminNote?: string;
  actionTaken?: string;
  
  createdAt: string;
  processedAt?: string;
  processedBy?: number;
}

/**
 * 알림
 */
export interface UsedNotification {
  id: number;
  userId: number;
  type: 'offer_received' | 'offer_accepted' | 'offer_rejected' | 'price_changed' | 'chat_message';
  targetId?: number;
  
  title: string;
  message: string;
  data?: Record<string, any>;
  
  isRead: boolean;
  isSent: boolean;
  
  createdAt: string;
  readAt?: string;
  sentAt?: string;
}

// ============================================
// 사용자 관련 타입
// ============================================

/**
 * 기본 사용자 정보 (기존 users 테이블 참조)
 */
export interface UserBasicInfo {
  id: number;
  name?: string;
  username?: string;
  nickname?: string; // 닉네임 추가
  email?: string;
  phone?: string;
  profileImage?: string;
  sido?: string;
  sigungu?: string;

  // 거래 통계 (선택적)
  tradeStats?: UserTradeStats;

  // 거래 횟수
  sell_count?: number;
  buy_count?: number;
  total_trade_count?: number;
}

/**
 * 사용자 거래 통계
 */
export interface UserTradeStats {
  totalListings: number;
  activeListings: number;
  soldCount: number;
  purchaseCount: number;
  avgSellerRating?: number;
  avgBuyerRating?: number;
  lastActivity?: string;
}

// ============================================
// API 요청/응답 타입
// ============================================

/**
 * 상품 목록 필터
 */
export interface PhoneListFilter {
  page?: number;
  limit?: number;
  brand?: PhoneBrand;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ConditionGrade;
  sido?: string;
  sigungu?: string;
  acceptOffers?: boolean;
  sortBy?: 'latest' | 'price_low' | 'price_high' | 'popular';
}

/**
 * 상품 등록/수정 요청
 */
export interface PhoneFormData {
  brand: PhoneBrand;
  series?: string;
  model: string;
  storage?: StorageSize;
  color?: string;
  condition_grade: ConditionGrade;
  battery_status?: BatteryStatus;
  purchase_period?: PurchasePeriod;
  manufacture_date?: string;
  price: number;
  accept_offers: boolean;
  min_offer_price?: number;
  accessories?: string[];
  trade_location?: string;
  description?: string;
  images?: File[] | string[]; // 신규 등록 시 File[], 수정 시 기존 URL string[]
  body_only?: boolean;
  has_box?: boolean;
  has_charger?: boolean;
  has_earphones?: boolean;
  meeting_place?: string;
  regions?: string[];
}

/**
 * 제안 생성 요청
 */
export interface CreateOfferRequest {
  phoneId: number;
  offeredPrice: number;
  message?: string;
}

/**
 * 제안 응답 요청
 */
export interface RespondOfferRequest {
  offerId: number;
  action: 'accept' | 'reject';
  message?: string;
}

/**
 * 거래 평가 요청
 */
export interface RateTransactionRequest {
  transactionId: number;
  rating: number; // 1-5
  review?: string;
}

/**
 * 채팅 메시지 전송 요청
 */
export interface SendChatRequest {
  phoneId: number;
  offerId?: number;
  receiverId: number;
  message: string;
  messageType?: 'text' | 'image';
}

// ============================================
// 통계 타입
// ============================================

/**
 * 인기 모델 통계
 */
export interface PopularModelStats {
  brand: string;
  series: string;
  model: string;
  listingCount: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgViews: number;
  soldCount: number;
  avgDaysToSell?: number;
}

/**
 * 지역별 통계
 */
export interface RegionStats {
  sido: string;
  sigungu: string;
  totalListings: number;
  activeListings: number;
  soldCount: number;
  avgPrice: number;
  avgDaysToSell?: number;
  uniqueSellers: number;
}

// ============================================
// 유틸리티 타입
// ============================================

/**
 * API 응답 래퍼
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * 업로드 응답
 */
export interface UploadResponse {
  url: string;
  size: number;
  width?: number;
  height?: number;
}

// ============================================
// 상수 정의
// ============================================

export const PHONE_BRANDS = {
  samsung: '삼성',
  apple: '애플',
  lg: 'LG',
  xiaomi: '샤오미',
  other: '기타'
} as const;

export const CONDITION_GRADES = {
  S: 'S급',
  A: 'A급',
  B: 'B급',
  C: 'C급'
} as const;

export const BATTERY_STATUS_LABELS = {
  'excellent': '최상',
  'good': '좋음',
  'fair': '보통',
  'poor': '나쁨',
  'defective': '불량'
} as const;

export const BATTERY_STATUS_DESCRIPTIONS = {
  'excellent': '새제품 또는 새제품 수준 • 하루 종일 충전 걱정 없음',
  'good': '하루 사용 시 충전 없이 가능 • 아침부터 저녁까지 일반 사용 OK',
  'fair': '가끔 충전 필요, 발열 시 급속 감소 • 오후에 한 번은 충전해야 함',
  'poor': '충전 자주 필요, 교체 고려 상태 • 반나절도 버티기 어려움',
  'defective': '간헐적으로 꺼짐, 교체 필요 • 갑자기 전원이 꺼지거나 불안정'
} as const;

export const PURCHASE_PERIOD_LABELS = {
  '1': '1개월 이내',
  '3': '3개월 이내',
  '6': '6개월 이내',
  '12': '1년 이내',
  'over': '1년 이상'
} as const;

export const ACCESSORIES_OPTIONS = [
  { value: 'charger', label: '충전기' },
  { value: 'box', label: '박스' },
  { value: 'earphone', label: '이어폰' },
  { value: 'case', label: '케이스' },
  { value: 's-pen', label: 'S펜' },
  { value: 'manual', label: '설명서' }
] as const;

export const MAX_IMAGES = 5;
export const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
export const DAILY_POST_LIMIT = 10;
export const OFFER_EXPIRY_DAYS = 30;