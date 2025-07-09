import tokenUtils from './tokenUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface BidTokenPurchase {
  id: number;
  token_type: string;
  token_type_display: string;
  quantity: number;
  total_price: number;
  purchase_date: string;
}

export interface BidTokenResponse {
  standard_tokens: number;
  premium_tokens: number;
  unlimited_tokens: number;
  total_tokens: number;
  recent_purchases: BidTokenPurchase[];
}

export interface PurchaseBidTokenRequest {
  token_type: 'standard' | 'premium' | 'unlimited';
  quantity: number;
}

export interface PurchaseBidTokenResponse {
  purchase_id: number;
  token_type: string;
  quantity: number;
  total_price: number;
  tokens_created: number;
  expires_at: string;
}

/**
 * 입찰권 관련 서비스 함수들을 제공하는 객체
 */
const bidTokenService = {
  /**
   * 입찰권 목록 조회
   * @returns 입찰권 정보 및 최근 구매 내역
   */
  async getBidTokens(): Promise<BidTokenResponse> {
    try {
      const response = await tokenUtils.fetchWithAuth<BidTokenResponse>(
        `${API_URL}/bid-tokens/`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch bid tokens');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching bid tokens:', error);
      throw error;
    }
  },
  
  /**
   * 입찰권 구매
   * @param data 구매할 입찰권 정보
   * @returns 구매 결과
   */
  async purchaseBidTokens(data: PurchaseBidTokenRequest): Promise<PurchaseBidTokenResponse> {
    try {
      const response = await tokenUtils.fetchWithAuth<PurchaseBidTokenResponse>(
        `${API_URL}/bid-tokens/purchase/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to purchase bid tokens');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error purchasing bid tokens:', error);
      throw error;
    }
  },
};

export default bidTokenService;
