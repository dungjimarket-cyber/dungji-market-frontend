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
  completedSales: number;
  remainingBids: number;
  hasUnlimitedBids: boolean;
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
