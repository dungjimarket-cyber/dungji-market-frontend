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
    offer_price: number;
    message?: string;
  }
): Promise<ElectronicsOffer> => {
  const response = await api.post(`/${electronicsId}/offer/`, data);
  return response.data;
};

/**
 * 내 제안 조회
 */
export const getMyOffer = async (electronicsId: number): Promise<ElectronicsOffer> => {
  const response = await api.get(`/${electronicsId}/my_offer/`);
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
// 찜하기 관련 API
// ============================================

/**
 * 찜하기 토글
 */
export const toggleFavorite = async (electronicsId: number): Promise<{ is_favorited: boolean }> => {
  const response = await api.post(`/${electronicsId}/favorite/`);
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
 * 거래 완료
 */
export const completeTransaction = async (electronicsId: number): Promise<{ message: string }> => {
  const response = await api.post(`/${electronicsId}/complete_transaction/`);
  return response.data;
};

export default {
  getElectronicsList,
  getElectronicsDetail,
  createElectronics,
  updateElectronics,
  deleteElectronics,
  getMyElectronics,
  checkRegistrationLimit,
  createOffer,
  getMyOffer,
  getOffers,
  acceptOffer,
  toggleFavorite,
  getFavorites,
  completeTransaction,
};