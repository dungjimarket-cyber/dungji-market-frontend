/**
 * 중고폰 거래 완료 및 평가 시스템 타입 정의
 */

// ============================================
// 거래 관련 타입
// ============================================

/**
 * 거래 상태
 */
export type TransactionStatus = 'reserved' | 'completed' | 'cancelled';

/**
 * 거래 기록
 */
export interface UsedPhoneTransaction {
  id: number;
  phone: number;
  offer: number;
  seller: number;
  buyer: number;
  status: TransactionStatus;

  // 거래 완료 확인
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  seller_confirmed_at?: string;
  buyer_confirmed_at?: string;

  // 거래 정보
  final_price: number;
  meeting_date?: string;
  meeting_location?: string;

  // 관계 데이터
  phone_model?: string;
  seller_username?: string;
  buyer_username?: string;

  // 타임스탬프
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * 거래 완료 요청
 */
export interface CompleteTradeRequest {
  phoneId: number;
}

/**
 * 거래 완료 응답
 */
export interface CompleteTradeResponse {
  message: string;
  status: string;
  transaction_id?: number;
  seller_confirmed?: boolean;
  buyer_confirmed?: boolean;
}

// ============================================
// 평가/리뷰 관련 타입
// ============================================

/**
 * 평점
 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/**
 * 거래 후기
 */
export interface UsedPhoneReview {
  id: number;
  transaction: number;
  reviewer: number;
  reviewee: number;

  // 평가 내용
  rating: Rating;
  comment?: string;

  // 평가 항목
  is_punctual?: boolean;
  is_friendly?: boolean;
  is_honest?: boolean;
  is_fast_response?: boolean;

  // 관계 데이터
  reviewer_username?: string;
  reviewee_username?: string;

  // 타임스탬프
  created_at: string;
  updated_at: string;
}

/**
 * 리뷰 작성 요청
 */
export interface CreateReviewRequest {
  transaction: number;
  rating: Rating;
  comment?: string;
  is_punctual?: boolean;
  is_friendly?: boolean;
  is_honest?: boolean;
  is_fast_response?: boolean;
}

/**
 * 사용자 평가 통계
 */
export interface UserReviewStats {
  avg_rating: number | null;
  total_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  is_punctual_count: number;
  is_friendly_count: number;
  is_honest_count: number;
  is_fast_response_count: number;
}

// ============================================
// 거래 취소 관련 타입
// ============================================

/**
 * 거래 취소 사유
 */
export type CancellationReason =
  // 구매자 취소 사유
  | 'change_mind'
  | 'found_better'
  | 'seller_no_response'
  | 'condition_mismatch'
  | 'price_disagreement'
  | 'seller_cancel_request'
  // 판매자 취소 사유
  | 'product_sold'
  | 'buyer_no_response'
  | 'buyer_no_show'
  | 'payment_issue'
  | 'buyer_unreasonable'
  | 'buyer_cancel_request'
  | 'personal_reason'
  // 공통
  | 'schedule_conflict'
  | 'location_issue'
  | 'other';

/**
 * 거래 취소 기록
 */
export interface TradeCancellation {
  id: number;
  phone: number;
  offer: number;
  cancelled_by: 'seller' | 'buyer';
  canceller: number;
  reason: CancellationReason;
  custom_reason?: string;
  created_at: string;
}

/**
 * 거래 취소 요청
 */
export interface CancelTradeRequest {
  phoneId: number;
  reason: CancellationReason;
  custom_reason?: string;
  return_to_sale?: boolean; // 판매자의 경우 판매중으로 전환 여부
}

// ============================================
// 상수 정의
// ============================================

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  // 구매자 취소 사유
  'change_mind': '단순 변심',
  'found_better': '다른 상품 구매 결정',
  'seller_no_response': '판매자 연락 두절',
  'condition_mismatch': '상품 상태가 설명과 다름',
  'price_disagreement': '추가 비용 요구',
  'seller_cancel_request': '판매자 취소 요청',
  // 판매자 취소 사유
  'product_sold': '다른 경로로 판매됨',
  'buyer_no_response': '구매자 연락 두절',
  'buyer_no_show': '구매자 약속 불이행',
  'payment_issue': '결제 문제 발생',
  'buyer_unreasonable': '구매자 무리한 요구',
  'buyer_cancel_request': '구매자 취소 요청',
  'personal_reason': '개인 사정으로 판매 불가',
  // 공통
  'schedule_conflict': '거래 일정 조율 실패',
  'location_issue': '거래 장소 문제',
  'other': '기타'
};

export const RATING_LABELS: Record<Rating, string> = {
  5: '매우 만족',
  4: '만족',
  3: '보통',
  2: '불만족',
  1: '매우 불만족'
};