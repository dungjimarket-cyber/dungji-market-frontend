/**
 * 판매자 관련 API 서비스
 */

import axios from 'axios';
import { tokenUtils } from '@/lib/tokenUtils';
import { SellerProfile, SaleConfirmation, BidSummary } from '@/types/seller';

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')}`;

/**
 * TokenUtils의 getAuthHeaders를 Axios에 맞게 변환
 */
/**
 * Axios 요청에 사용할 인증 헤더를 가져옵니다.
 * @returns {Promise<Record<string, string>>} 인증 헤더 객체
 */
const getAxiosAuthHeaders = async () => {
  const headers = await tokenUtils.getAuthHeaders();
  
  // HeadersInit을 일반 객체로 변환
  const authHeader = headers instanceof Headers 
    ? { Authorization: headers.get('Authorization') }
    : Array.isArray(headers)
      ? Object.fromEntries(headers)
      : headers;
  
  console.log('인증 헤더:', authHeader);
  return authHeader;
};


/**
 * 판매자 프로필 정보를 조회합니다.
 * @returns 판매자 프로필 정보
 * @example
 * const profile = await getSellerProfile();
 * console.log(profile.name); // 판매자 이름
 */
export const getSellerProfile = async (): Promise<SellerProfile> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/users/me/seller-profile/`, { headers });
    return response.data;
  } catch (error: any) {
    console.error('판매자 프로필 조회 오류:', error.response?.data);
    throw error;
  }
};

/**
 * 판매자의 입찰 요약 정보를 조회합니다.
 * @returns 입찰 요약 정보
 * @example
 * const summary = await getBidSummary();
 * console.log(summary.activeBids); // 진행 중인 입찰 수
 */
export const getBidSummary = async (): Promise<BidSummary> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/users/me/bids/summary/`, { headers });
    return response.data;
  } catch (error: any) {
    console.error('입찰 요약 정보 조회 오류:', error.response?.data);
    throw error;
  }
};

/**
 * 판매 확정 목록을 조회합니다.
 * @param params 조회 옵션 (날짜 필터, 검색어 등)
 * @returns 판매 확정 목록
 * @example
 * const sales = await getSellerSales({ page: 1, search: '갤럭시' });
 */
export const getSellerSales = async (params: {
  page?: number;
  search?: string;
  status?: 'pending' | 'confirmed';
}): Promise<{
  results: SaleConfirmation[];
  count: number;
  next: string | null;
  previous: string | null;
}> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/users/me/sales/`, { 
      headers,
      params
    });
    return response.data;
  } catch (error: any) {
    console.error('판매 확정 목록 조회 오류:', error.response?.data);
    throw error;
  }
};

/**
 * 특정 판매 확정 상세 정보를 조회합니다.
 * @param id 판매 확정 ID
 * @returns 판매 확정 상세 정보
 * @example
 * const sale = await getSellerSaleDetail(123);
 * console.log(sale.productName); // 상품명
 */
export const getSellerSaleDetail = async (id: number): Promise<SaleConfirmation> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/users/me/sales/${id}/`, { headers });
    return response.data;
  } catch (error: any) {
    console.error('판매 확정 상세 조회 오류:', error.response?.data);
    throw error;
  }
};

/**
 * 판매자 프로필 정보를 업데이트합니다.
 * @param data 업데이트할 프로필 데이터
 * @returns 업데이트된 프로필 정보
 * @example
 * const updatedProfile = await updateSellerProfile({
 *   nickname: '새 닉네임',
 *   description: '판매자 소개'
 * });
 */
export const updateSellerProfile = async (data: {
  name?: string;
  nickname?: string;
  description?: string;
  phone?: string;
  address?: string;
  address_detail?: string;
  address_region_id?: string;
  business_number?: string;
  business_reg_number?: string;
  is_remote_sales?: boolean;
  is_remote_sales_enabled?: boolean;
  notification_enabled?: boolean;
  profile_image?: string;
}): Promise<SellerProfile> => {
  try {
    const headers = await getAxiosAuthHeaders();
    // API 호출 전에 데이터 매핑
    const apiData = {
      ...data,
      username: data.nickname || data.name,
      business_reg_number: data.business_reg_number || data.business_number,
      is_remote_sales_enabled: data.is_remote_sales_enabled || data.is_remote_sales,
      address_detail: data.address_detail || data.address
    };
    const response = await axios.patch(`${API_URL}/users/me/seller-profile/`, apiData, { headers });
    return response.data;
  } catch (error: any) {
    console.error('판매자 프로필 업데이트 오류:', error.response?.data);
    throw error;
  }
};

/**
 * 판매자의 입찰 목록을 조회합니다.
 * @param params 조회 옵션 (페이지, 검색어, 상태 필터)
 * @returns 입찰 목록 및 페이지네이션 정보
 * @example
 * const bids = await getSellerBids({ page: 1, status: 'pending' });
 */
export const getSellerBids = async (params?: {
  page?: number;
  search?: string;
  status?: 'pending' | 'selected' | 'confirmed' | 'rejected';
}): Promise<{
  results: any[];
  count: number;
  next: string | null;
  previous: string | null;
}> => {
  try {
    const headers = await getAxiosAuthHeaders();
    
    const response = await axios.get(`${API_URL}/bids/seller/`, {
      headers,
      params
    });
    
    return {
      results: response.data,
      count: response.data.length,
      next: null,
      previous: null
    };
  } catch (error: any) {
    console.error('입찰 목록 조회 중 오류 발생:', error.response?.data);
    throw error;
  }
};
