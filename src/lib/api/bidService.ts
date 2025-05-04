/**
 * 입찰 관련 API 서비스
 */

import axios from 'axios';
import { tokenUtils } from '@/lib/tokenUtils';

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')}`;

/**
 * TokenUtils의 getAuthHeaders를 Axios에 맞게 변환
 * HeadersInit 형식을 Axios 헤더 형식으로 변환
 */
const getAxiosAuthHeaders = async () => {
  const headers = await tokenUtils.getAuthHeaders();
  // HeadersInit을 일반 객체로 변환
  const authHeader = headers instanceof Headers 
    ? { Authorization: headers.get('Authorization') }
    : Array.isArray(headers)
      ? Object.fromEntries(headers)
      : headers;
  
  return authHeader;
};

export interface BidData {
  id: number;
  groupbuy: number;
  seller?: number; // 판매자 ID
  seller_name?: string; // 판매자 이름
  seller_id?: number; // 이전 버전 호환성 위해 유지
  groupbuy_title: string;
  product_name: string;
  bid_type: 'price' | 'support';
  amount: number;
  message: string;
  status: 'pending' | 'selected' | 'rejected';
  created_at: string;
  updated_at: string;
  deadline: string;
  participants_count: number;
}

export interface CreateBidRequest {
  groupbuy_id: number;
  bid_type: 'price' | 'support';
  amount: number;
  message?: string;
  seller_id?: number; // 옵션으로 판매자 ID 추가
}

export interface SettlementData {
  id: number;
  groupbuy_id: number;
  groupbuy_title: string;
  product_name: string;
  total_amount: number;
  fee_amount: number;
  net_amount: number;
  participants_count: number;
  settlement_date: string;
  payment_status: 'pending' | 'completed' | 'failed';
  receipt_url?: string;
}

/**
 * 판매회원 입찰 목록 조회
 * @returns 판매자의 모든 입찰 목록
 * @example
 * const bids = await getSellerBids();
 * console.log(bids);
 */
export const getSellerBids = async (): Promise<BidData[]> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/bids/seller/`, { headers });
    return response.data;
  } catch (error) {
    console.error('입찰 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 공구의 입찰 기록 조회
 * @param groupBuyId 공구 ID
 * @returns 해당 공구의 모든 입찰 기록
 * @example
 * const bids = await getGroupBuyBids(123);
 * console.log(bids);
 */
export const getGroupBuyBids = async (groupBuyId: number): Promise<BidData[]> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/groupbuys/${groupBuyId}/bids/`, { headers });
    return response.data;
  } catch (error) {
    console.error('공구 입찰 기록 조회 오류:', error);
    throw error;
  }
};

/**
 * 새로운 입찰 생성
 * @param data 입찰 데이터 
 * @returns 생성된 입찰 정보
 * @example
 * const newBid = await createBid({
 *   groupbuy_id: 123,
 *   bid_type: 'price',
 *   amount: 50000,
 *   message: '좋은 조건으로 제공해 드리겠습니다.'
 * });
 */
export const createBid = async (data: CreateBidRequest): Promise<BidData> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const token = await tokenUtils.getAccessToken();
    console.log('토큰 값:', token?.substring(0, 20) + '...');
    
    // JWT 기본 디코딩
    const decoded = tokenUtils.decodeToken(token || '');
    console.log('JWT 디코딩 결과:', decoded);
    
    // 라이브러리를 사용하지 않고 직접 JWT payload 파싱
    let rawPayload: Record<string, any> = {};
    try {
      if (token) {
        const base64Payload = token.split('.')[1];
        const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
        rawPayload = JSON.parse(payload);
        console.log('원시 JWT 페이로드:', rawPayload);
      }
    } catch (e) {
      console.error('JWT 파싱 오류:', e);
    }
    
    // 여러 가능한 소스에서 사용자 ID 추출 시도
    const userId = decoded?.id || rawPayload?.user_id || data.seller_id;
    
    if (!userId) {
      throw new Error('사용자 정보를 찾을 수 없습니다. 로그인 상태를 확인해주세요.');
    }
    
    // API 요청 데이터 준비
    const requestData = {
      groupbuy: data.groupbuy_id,
      bid_type: data.bid_type,
      amount: data.amount,
      message: data.message || '',
      seller: userId // JWT 토큰에서 추출한 user_id 추가
    };
    
    console.log('입찰 요청 데이터:', requestData);
    console.log('API 호출 URL:', `${API_URL}/bids/`);
    console.log('인증 헤더:', headers);
    
    const response = await axios.post(`${API_URL}/bids/`, requestData, { headers });
    return response.data;
  } catch (error: any) {
    console.error('입찰 생성 오류:', error.response?.data);
    console.error('오류 상태 코드:', error.response?.status);
    throw error;
  }
};

/**
 * 입찰 확정 처리
 * @param bidId 입찰 ID
 * @returns 업데이트된 입찰 정보
 * @example
 * const confirmedBid = await confirmBid(45);
 */
export const confirmBid = async (bidId: number): Promise<BidData> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.post(`${API_URL}/bids/${bidId}/confirm/`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error('입찰 확정 오류:', error);
    throw error;
  }
};

/**
 * 입찰 포기 처리
 * @param bidId 입찰 ID
 * @returns 업데이트된 입찰 정보
 * @example
 * const rejectedBid = await rejectBid(45);
 */
export const rejectBid = async (bidId: number): Promise<BidData> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.post(`${API_URL}/bids/${bidId}/reject/`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error('입찰 포기 오류:', error);
    throw error;
  }
};

/**
 * 정산 내역 조회
 * @returns 판매자의 모든 정산 내역
 * @example
 * const settlements = await getSettlements();
 * console.log(settlements);
 */
export const getSettlements = async (): Promise<SettlementData[]> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/settlements/`, { headers });
    return response.data;
  } catch (error) {
    console.error('정산 내역 조회 오류:', error);
    throw error;
  }
};
