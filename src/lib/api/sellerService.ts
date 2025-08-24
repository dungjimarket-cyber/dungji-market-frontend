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
 * 판매자의 평균 별점을 계산합니다.
 * @param sellerId 판매자 ID
 * @returns 평균 별점과 리뷰 개수
 */
export const getSellerAverageRating = async (sellerId?: number): Promise<{ averageRating: number; reviewCount: number }> => {
  try {
    console.log('판매자 별점 조회 시작 - sellerId:', sellerId);
    
    if (!sellerId) {
      console.log('sellerId가 없습니다');
      return { averageRating: 0, reviewCount: 0 };
    }
    
    const headers = await getAxiosAuthHeaders();
    
    // 먼저 판매자가 낙찰받은 공구 목록을 조회
    try {
      // 판매 완료된 공구들의 리뷰를 조회하는 방식으로 시도
      const groupbuysResponse = await axios.get(`${API_URL}/groupbuys/seller_completed/`, { 
        headers 
      });
      
      console.log('판매 완료 공구 응답:', groupbuysResponse.data);
      
      if (!groupbuysResponse.data || groupbuysResponse.data.length === 0) {
        console.log('판매 완료된 공구가 없습니다');
        return { averageRating: 0, reviewCount: 0 };
      }
      
      // 각 공구의 리뷰를 수집
      let allReviews: any[] = [];
      
      for (const groupbuy of groupbuysResponse.data) {
        try {
          const reviewResponse = await axios.get(`${API_URL}/reviews/groupbuy_reviews/`, {
            params: { groupbuy_id: groupbuy.id }
          });
          
          if (reviewResponse.data && reviewResponse.data.reviews) {
            allReviews = [...allReviews, ...reviewResponse.data.reviews];
          }
        } catch (err) {
          console.log(`공구 ${groupbuy.id}의 리뷰 조회 실패:`, err);
        }
      }
      
      console.log('수집된 전체 리뷰:', allReviews.length, '개');
      
      if (allReviews.length === 0) {
        return { averageRating: 0, reviewCount: 0 };
      }
      
      // 평균 별점 계산
      const totalRating = allReviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
      const averageRating = totalRating / allReviews.length;
      
      console.log('평균 별점 계산 결과:', averageRating);
      
      return { 
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: allReviews.length 
      };
      
    } catch (apiError: any) {
      console.error('API 호출 오류:', apiError.response?.data || apiError.message);
      
      // 백엔드에서 직접 평균 별점을 제공하는 경우를 위한 대체 로직
      try {
        const profileResponse = await axios.get(`${API_URL}/users/${sellerId}/public_profile/`, {
          headers
        });
        
        if (profileResponse.data?.average_rating !== undefined) {
          return {
            averageRating: profileResponse.data.average_rating,
            reviewCount: profileResponse.data.review_count || 0
          };
        }
      } catch (err) {
        console.log('대체 API도 실패:', err);
      }
      
      return { averageRating: 0, reviewCount: 0 };
    }
    
  } catch (error: any) {
    console.error('판매자 평균 별점 조회 전체 오류:', error);
    return { averageRating: 0, reviewCount: 0 };
  }
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
    // 판매자 전용 프로필 엔드포인트 사용
    const response = await axios.get(`${API_URL}/users/me/seller-profile/`, { headers });
    
    // API 응답 데이터를 그대로 반환 (백엔드에서 이미 올바른 필드명 사용)
    const data = response.data;
    console.log('판매자 프로필 데이터:', data);
    
    // 다양한 필드에서 sellerId 찾기
    const sellerId = data.id || data.user_id || data.user?.id || data.seller_id;
    console.log('추출된 sellerId:', sellerId);
    
    // 평균 별점 계산 추가
    const { averageRating, reviewCount } = await getSellerAverageRating(sellerId);
    
    return {
      ...data,
      rating: averageRating,
      reviewCount: reviewCount
    };
  } catch (error: any) {
    console.error('판매자 프로필 조회 오류:', error.response?.data);
    console.error('오류 상태 코드:', error.response?.status);
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
