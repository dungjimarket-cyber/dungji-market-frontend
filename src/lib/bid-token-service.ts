import { tokenUtils } from '@/lib/tokenUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface BidTokenPurchase {
  id: number;
  token_type: string;
  token_type_display: string;
  quantity: number;
  total_price: number;
  purchase_date: string;
}

export interface ExpiringToken {
  id?: number;
  type: string;
  type_display: string;
  expires_at: string;
  days_remaining: number;
  quantity: number;
}

export interface BidTokenResponse {
  single_tokens: number;
  unlimited_subscription: boolean;
  unlimited_expires_at: string | null;
  total_tokens: number;
  recent_purchases: BidTokenPurchase[];
  expiring_tokens: ExpiringToken[];
}

export interface PurchaseBidTokenRequest {
  token_type: 'single' | 'unlimited';  // 백엔드 API와 일치하도록 'unlimited'로 수정
  quantity: number;
}

export interface PurchaseBidTokenResponse {
  purchase_id: number;
  token_type: string;
  quantity: number;
  total_price: number;
  tokens_created: number;
  expires_at: string | null;
}

export interface PendingPayment {
  id: number;
  order_id: string;
  amount: number;
  product_name: string;
  vbank_name: string;
  vbank_num: string;
  vbank_holder: string;
  vbank_date: string;
  created_at: string;
}

/**
 * 입찰권 관련 서비스 함수들을 제공하는 객체
 * 
 * 입찰권은 다음 두 가지로 구분됩니다:
 * - 입찰권 단품(single): 1,990원, 유효기간 없이 1회 입찰 가능한 입찰권
 * - 무제한 구독권(unlimited): 29,900원, 30일간 모든 공구에 무제한으로 입찰 가능한 구독제
 */
const bidTokenService = {
  /**
   * 입찰권 목록 조회
   * @returns 입찰권 정보 및 최근 구매 내역
   * @example
   * // 입찰권 정보 조회
   * const bidTokens = await bidTokenService.getBidTokens();
   * console.log(`단품 견적 이용권: ${bidTokens.single_tokens}개`);
   * console.log(`무제한 구독: ${bidTokens.unlimited_subscription ? '활성화' : '비활성화'}`);
   * if (bidTokens.unlimited_subscription) {
   *   console.log(`만료일: ${bidTokens.unlimited_expires_at}`);
   * }
   */
  async getBidTokens(): Promise<BidTokenResponse> {
    try {
      const data = await tokenUtils.fetchWithAuth<BidTokenResponse>(
        `${API_URL}/bid-tokens/`,
        { method: 'GET' }
      );
      
      return data;
    } catch (error) {
      console.error('Error fetching bid tokens:', error);
      throw error;
    }
  },
  
  /**
   * 입찰권 구매
   * @param data 구매할 입찰권 정보
   * @returns 구매 결과
   * @example
   * // 단품 입찰권 구매
   * const result = await bidTokenService.purchaseBidTokens({
   *   token_type: 'single',
   *   quantity: 5
   * });
   * 
   * // 무제한 구독제 구매
   * const result = await bidTokenService.purchaseBidTokens({
   *   token_type: 'unlimited-subscription',
   *   quantity: 1
   * });
   */
  async purchaseBidTokens(data: PurchaseBidTokenRequest): Promise<PurchaseBidTokenResponse> {
    try {
      const responseData = await tokenUtils.fetchWithAuth<PurchaseBidTokenResponse>(
        `${API_URL}/bid-tokens/purchase/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      
      return responseData;
    } catch (error) {
      console.error('Error purchasing bid tokens:', error);
      throw error;
    }
  },
  
  /**
   * 사용 가능한 입찰권이 있는지 확인합니다.
   * @returns 입찰권 보유 여부
   * @example
   * // 입찰권 보유 여부 확인
   * const canBid = await bidTokenService.hasAvailableBidTokens();
   * if (canBid) {
   *   // 입찰 가능한 경우 처리
   * }
   */
  async hasAvailableBidTokens(): Promise<boolean> {
    try {
      const tokens = await this.getBidTokens();
      
      // 무제한 구독이 활성화되어 있거나, 단품 입찰권이 있으면 입찰 가능
      return tokens.unlimited_subscription || tokens.single_tokens > 0;
    } catch (error) {
      console.error('입찰권 확인 중 오류 발생:', error);
      return false; // 오류 발생 시 기본적으로 입찰 불가능으로 처리
    }
  },

  /**
   * 입금 대기 중인 결제 내역을 조회합니다.
   * @returns 입금 대기 중인 결제 목록
   * @example
   * // 입금 대기 내역 조회
   * const pendingPayments = await bidTokenService.getPendingPayments();
   * console.log(`대기 중인 결제: ${pendingPayments.length}건`);
   */
  async getPendingPayments(): Promise<PendingPayment[]> {
    try {
      const response = await tokenUtils.fetchWithAuth<{
        success: boolean;
        pending_payments: PendingPayment[];
        count: number;
      }>(
        `${API_URL}/payments/pending/`,
        { method: 'GET' }
      );
      
      return response.pending_payments || [];
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
  },
};



export default bidTokenService;
