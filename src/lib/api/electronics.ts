/**
 * 전자제품/가전 API 서비스
 */
import axios from 'axios';
import type {
  UsedElectronics,
  ElectronicsFormData,
  ElectronicsListResponse,
  ElectronicsCheckLimitResponse,
  ElectronicsOffer,
  ElectronicsFavorite
} from '@/types/electronics';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com/api';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: `${API_URL}/used/electronics`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================================
// 상품 관련 API
// ============================================

/**
 * 전자제품 목록 조회
 */
export const getElectronicsList = async (params?: {
  subcategory?: string;
  min_price?: number;
  max_price?: number;
  condition?: string;
  region?: number | string;  // 문자열도 허용 (지역명)
  page?: number;
  search?: string;
  ordering?: string;
  status?: string;  // status 파라미터 추가
}): Promise<ElectronicsListResponse> => {
  const response = await api.get('/', { params });
  return response.data;
};

/**
 * 전자제품 상세 조회
 */
export const getElectronicsDetail = async (id: number): Promise<UsedElectronics> => {
  const response = await api.get(`/${id}/`);
  return response.data;
};

/**
 * 전자제품 등록
 */
export const createElectronics = async (data: ElectronicsFormData): Promise<UsedElectronics> => {
  const formData = new FormData();

  // 이미지를 제외한 모든 필드 추가
  Object.keys(data).forEach(key => {
    if (key !== 'images' && key !== 'regions') {
      const value = (data as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }
  });

  // 지역 추가
  if (data.regions && data.regions.length > 0) {
    data.regions.forEach(regionId => {
      formData.append('regions', regionId.toString());
    });
  }

  // 이미지 추가
  if (data.images && data.images.length > 0) {
    data.images.forEach(image => {
      formData.append('images', image);
    });
  }

  const response = await api.post('/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * 전자제품 수정
 */
export const updateElectronics = async (
  id: number,
  data: Partial<ElectronicsFormData>
): Promise<UsedElectronics> => {
  const formData = new FormData();

  Object.keys(data).forEach(key => {
    if (key !== 'images' && key !== 'regions') {
      const value = (data as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    }
  });

  if (data.regions) {
    data.regions.forEach(regionId => {
      formData.append('regions', regionId.toString());
    });
  }

  if (data.images) {
    data.images.forEach(image => {
      formData.append('images', image);
    });
  }

  const response = await api.patch(`/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * 전자제품 삭제
 */
export const deleteElectronics = async (id: number): Promise<void> => {
  await api.delete(`/${id}/`);
};

/**
 * 내 상품 목록
 */
export const getMyElectronics = async (params?: {
  status?: string;
  page?: number;
}): Promise<ElectronicsListResponse> => {
  const response = await api.get('/my_list/', { params });
  return response.data;
};

/**
 * 등록 제한 체크
 */
export const checkRegistrationLimit = async (): Promise<ElectronicsCheckLimitResponse> => {
  const response = await api.get('/check_limit/');
  return response.data;
};

// ============================================
// 가격제안 관련 API
// ============================================

/**
 * 가격 제안하기
 */
export const createOffer = async (
  electronicsId: number,
  data: {
    offered_price: number;  // 백엔드와 일치하도록 변경
    message?: string;
  }
): Promise<ElectronicsOffer> => {
  const response = await api.post(`/${electronicsId}/offer/`, data);
  return response.data;
};

/**
 * 내 제안 조회
 */
export const getMyOffer = async (electronicsId: number): Promise<ElectronicsOffer | null> => {
  const response = await api.get(`/${electronicsId}/my_offer/`);
  // 백엔드에서 offer가 없을 때 {message: 'No offer found', offer: null} 반환
  if (response.data.message === 'No offer found') {
    return null;
  }
  return response.data;
};

/**
 * 제안 목록 조회 (판매자용)
 */
export const getOffers = async (electronicsId: number): Promise<ElectronicsOffer[]> => {
  const response = await api.get(`/${electronicsId}/offers/`);
  return response.data;
};

/**
 * 제안 수락
 */
export const acceptOffer = async (
  electronicsId: number,
  offerId: number
): Promise<{ message: string }> => {
  const response = await api.post(`/${electronicsId}/accept_offer/`, { offer_id: offerId });
  return response.data;
};

// ============================================
// 판매자 관련 API
// ============================================

/**
 * 내 판매 상품 목록 조회
 */
export const getMyListings = async (params?: {
  status?: string;
  page?: number;
}): Promise<any> => {
  const response = await api.get('/my-listings/', { params });
  return response.data;
};

/**
 * 받은 제안 목록 조회
 */
export const getReceivedOffers = async (electronicsId?: number): Promise<any> => {
  const url = electronicsId
    ? `/${electronicsId}/offers/`
    : '/offers/received/';
  const response = await api.get(url);
  return response.data;
};

/**
 * 제안 응답 (수락/거절)
 */
export const respondToOffer = async (offerId: number, action: 'accept' | 'reject', message?: string): Promise<any> => {
  const response = await api.post(`/offers/${offerId}/respond/`, {
    action,
    message,
  });
  return response.data;
};

/**
 * 거래 진행 (수락된 제안을 거래중으로 전환)
 */
export const proceedTrade = async (offerId: number): Promise<any> => {
  const response = await api.post(`/offers/${offerId}/proceed-trade/`);
  return response.data;
};

/**
 * 상품 상태 변경
 */
export const updateListingStatus = async (electronicsId: number, status: string): Promise<any> => {
  const response = await api.patch(`/${electronicsId}/`, { status });
  return response.data;
};

/**
 * 구매자 정보 조회 (거래중인 판매자용)
 */
export const getBuyerInfo = async (electronicsId: number): Promise<any> => {
  const response = await api.get(`/${electronicsId}/buyer-info/`);
  return response.data;
};

// ============================================
// 찜하기 관련 API
// ============================================

/**
 * 찜하기 토글
 */
export const toggleFavorite = async (electronicsId: number, isFavorited?: boolean): Promise<{ status: string; message: string }> => {
  // isFavorited가 제공되면 그 값을 사용, 아니면 POST(찜하기)로 시도
  const method = isFavorited ? 'delete' : 'post';
  const response = await api[method](`/${electronicsId}/favorite/`);
  return response.data;
};

/**
 * 찜 목록 조회
 */
export const getFavorites = async (params?: {
  page?: number;
}): Promise<{ results: ElectronicsFavorite[] }> => {
  const response = await api.get('/favorites/', { params });
  return response.data;
};

// ============================================
// 거래 관련 API
// ============================================

/**
 * 거래 완료 (판매자용)
 */
export const completeTransaction = async (electronicsId: number): Promise<{ message: string }> => {
  const response = await api.post(`/${electronicsId}/complete_transaction/`);
  return response.data;
};

/**
 * 구매 완료 (구매자용)
 */
export const buyerCompleteTransaction = async (electronicsId: number): Promise<{ message: string }> => {
  const response = await api.post(`/${electronicsId}/buyer-complete/`);
  return response.data;
};

/**
 * 거래 취소
 */
export const cancelTrade = async (electronicsId: number, data: {
  reason: string;
  custom_reason?: string;
}): Promise<{ message: string }> => {
  const response = await api.post(`/${electronicsId}/cancel-trade/`, data);
  return response.data;
};

/**
 * 거래 정보 조회 (후기 작성용)
 */
export const getTransactionInfo = async (electronicsId: number): Promise<any> => {
  const response = await api.get(`/${electronicsId}/transaction-info/`);
  return response.data;
};

// ============================================
// 구매자 관련 API
// ============================================

/**
 * 내가 보낸 제안 목록 조회
 */
export const getMySentOffers = async (params?: {
  page?: number;
  status?: string;
}): Promise<{ results: ElectronicsOffer[] }> => {
  const response = await api.get('/my-offers/', { params });
  return response.data;
};

/**
 * 내 거래중 목록 조회
 */
export const getMyTradingItems = async (params?: {
  page?: number;
}): Promise<{ results: any[] }> => {
  const response = await api.get('/my-trading/', { params });
  return response.data;
};

/**
 * 제안 취소
 */
export const cancelOffer = async (offerId: number): Promise<{ message: string }> => {
  // 백엔드 URL 패턴에 맞게 수정 - ViewSet의 action 경로
  const response = await api.post(`/offers/${offerId}/cancel/`);
  return response.data;
};

/**
 * 판매자 정보 조회
 */
export const getSellerInfo = async (electronicsId: number): Promise<any> => {
  const response = await api.get(`/${electronicsId}/seller-info/`);
  return response.data;
};

// ============================================
// 리뷰 관련 API
// ============================================

/**
 * 리뷰 작성
 */
export const createReview = async (transactionId: number, data: {
  rating: number;
  comment: string;
  is_punctual?: boolean;
  is_friendly?: boolean;
  is_honest?: boolean;
  is_fast_response?: boolean;
}): Promise<any> => {
  // 휴대폰과 동일한 simple 엔드포인트 사용
  const response = await api.post('/reviews/simple/', {
    transaction: transactionId,
    ...data,
  });
  return response.data;
};

/**
 * 받은 리뷰 목록
 */
export const getReceivedReviews = async (): Promise<{ results: any[] }> => {
  const response = await api.get('/reviews/received/');
  return response.data;
};

/**
 * 작성한 리뷰 목록
 */
export const getWrittenReviews = async (): Promise<{ results: any[] }> => {
  const response = await api.get('/reviews/written/');
  return response.data;
};

/**
 * 리뷰 통계
 */
export const getUserStats = async (): Promise<any> => {
  const response = await api.get('/reviews/user-stats/');
  return response.data;
};

// 판매자 API 그룹
export const sellerAPI = {
  getMyListings,
  getReceivedOffers,
  respondToOffer,
  proceedTrade,
  updateListingStatus,
  getBuyerInfo,
  getTransactionInfo,
};

// 구매자 API 그룹
export const buyerAPI = {
  getMySentOffers,
  getMyTradingItems,
  cancelOffer,
  getSellerInfo,
  buyerCompleteTransaction,
  cancelTrade,
};

export default {
  // 기본 CRUD
  getElectronicsList,
  getElectronicsDetail,
  createElectronics,
  updateElectronics,
  deleteElectronics,
  getMyElectronics,
  checkRegistrationLimit,
  // 가격제안
  createOffer,
  getMyOffer,
  getOffers,
  acceptOffer,
  // 판매자
  getMyListings,
  getReceivedOffers,
  respondToOffer,
  proceedTrade,
  updateListingStatus,
  getBuyerInfo,
  // 구매자
  getMySentOffers,
  getMyTradingItems,
  cancelOffer,
  getSellerInfo,
  // 찜하기
  toggleFavorite,
  getFavorites,
  // 거래
  completeTransaction,
  buyerCompleteTransaction,
  cancelTrade,
  getTransactionInfo,
  // 리뷰
  createReview,
  getReceivedReviews,
  getWrittenReviews,
  getUserStats,
};