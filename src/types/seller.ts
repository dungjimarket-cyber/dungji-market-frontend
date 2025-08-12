/**
 * 판매자 프로필 정보 타입
 */
export interface SellerProfile {
  name: string;
  profileImage: string;
  isVip: boolean;
  rating: number;
  activeBids: number;
  pendingSelection: number;
  pendingSales: number;
  confirmedSales?: number;  // 판매확정 수
  completedSales: number;
  remainingBids: number;  // single_tokens 개수
  hasUnlimitedBids: boolean;  // unlimited_subscription 여부
  unlimited_expires_at?: string | null;  // 무제한 구독권 만료일
  // 판매자 설정 페이지에 필요한 추가 필드
  description?: string;
  phone?: string;
  address?: string;
  email?: string;
  notificationEnabled?: boolean;
  nickname?: string;
  username?: string;
  businessNumber?: string;
  isRemoteSales?: boolean;
  remoteSalesCertification?: string | null;
  remoteSalesVerified?: boolean;
  remoteSalesStatus?: 'pending' | 'approved' | 'rejected' | null;
  remoteSalesRejectionReason?: string | null;
  addressRegion?: {
    code: string;
    name: string;
    full_name: string;
  };
}

/**
 * 판매 확정 상세 정보 타입
 */
export interface SaleConfirmation {
  id: number;
  productName: string;
  provider: string; // 통신사
  plan: string; // 요금제
  tradeNumber: string;
  confirmationDate: string;
  subsidyAmount: number; // 지원금
  buyerInfo: {
    name: string;
    contact: string;
  }[];
  status: 'pending' | 'confirmed';
}

/**
 * 판매자 입찰 요약 정보 타입
 */
export interface BidSummary {
  totalBids: number;
  activeBids: number;
  completedBids: number;
  acceptedBids: number;
  rejectedBids: number;
}
