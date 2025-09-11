import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
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

// 에러 핸들링 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 시 처리
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 판매 관련 API
export const sellerAPI = {
  // 내 판매 상품 목록 조회
  getMyListings: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/used/phones/my-listings/', { params });
    return response.data;
  },

  // 받은 제안 목록 조회
  getReceivedOffers: async (phoneId?: number) => {
    const url = phoneId 
      ? `/used/phones/${phoneId}/offers/` 
      : '/used/offers/received/';
    const response = await api.get(url);
    return response.data;
  },

  // 제안 응답 (수락/거절)
  respondToOffer: async (offerId: number, action: 'accept' | 'reject', message?: string) => {
    const response = await api.post(`/used/offers/${offerId}/respond/`, {
      action,
      message,
    });
    return response.data;
  },

  // 거래 진행 (수락된 제안을 거래중으로 전환)
  proceedTrade: async (offerId: number) => {
    const response = await api.post(`/used/offers/${offerId}/proceed-trade/`);
    return response.data;
  },

  // 상품 상태 변경
  updateListingStatus: async (phoneId: number, status: string) => {
    const response = await api.patch(`/used/phones/${phoneId}/`, { status });
    return response.data;
  },
  
  // 구매자 정보 조회 (거래중인 판매자용)
  getBuyerInfo: async (phoneId: number) => {
    const response = await api.get(`/used/phones/${phoneId}/buyer-info/`);
    return response.data;
  },
};

// 구매 관련 API
export const buyerAPI = {
  // 내가 보낸 제안 목록 조회
  getMySentOffers: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await api.get('/used/offers/sent/', { params });
    return response.data;
  },
  
  // 거래중인 아이템 목록 조회 (구매자용)
  getMyTradingItems: async () => {
    const response = await api.get('/used/phones/my-trading/');
    return response.data;
  },

  // 찜 목록 조회
  getFavorites: async () => {
    const response = await api.get('/used/favorites/');
    return response.data;
  },

  // 찜 추가/제거
  toggleFavorite: async (phoneId: number) => {
    try {
      const response = await api.post(`/used/phones/${phoneId}/favorite/`);
      return { added: true, ...response.data };
    } catch (error: any) {
      if (error.response?.status === 400) {
        // 이미 찜한 경우 제거
        const response = await api.delete(`/used/phones/${phoneId}/favorite/`);
        return { added: false, ...response.data };
      }
      throw error;
    }
  },

  // 가격 제안하기
  makeOffer: async (phoneId: number, offeredPrice: number, message?: string) => {
    const response = await api.post(`/used/phones/${phoneId}/offer/`, {
      offered_price: offeredPrice,
      message,
    });
    return response.data;
  },

  // 제안 취소
  cancelOffer: async (offerId: number) => {
    const response = await api.delete(`/used/offers/${offerId}/`);
    return response.data;
  },
  
  // 판매자 정보 조회 (거래중인 구매자용)
  getSellerInfo: async (phoneId: number) => {
    const response = await api.get(`/used/phones/${phoneId}/seller-info/`);
    return response.data;
  },
};

// 프로필 관련 API
export const profileAPI = {
  // 프로필 조회
  getProfile: async () => {
    const response = await api.get('/mypage/profile/');
    return response.data;
  },

  // 프로필 수정
  updateProfile: async (data: any) => {
    const response = await api.put('/mypage/profile/', data);
    return response.data;
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/mypage/profile/image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 거래 통계 조회
  getStats: async () => {
    const response = await api.get('/mypage/stats/');
    return response.data;
  },
};

// 거래 후기 API
export const reviewAPI = {
  // 받은 후기 조회
  getReceivedReviews: async () => {
    const response = await api.get('/mypage/reviews/received/');
    return response.data;
  },

  // 작성 대기 후기 조회
  getPendingReviews: async () => {
    const response = await api.get('/mypage/reviews/pending/');
    return response.data;
  },

  // 후기 작성
  createReview: async (data: any) => {
    const response = await api.post('/mypage/reviews/', data);
    return response.data;
  },
};

export default api;