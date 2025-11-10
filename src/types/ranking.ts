// Google Places API 기반 랭킹 타입 정의

export interface PlaceRanking {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  userRatingCount: number;
  types: string[];
  latitude: number;
  longitude: number;
  googleMapsUrl: string;      // Google Maps 링크 (지도 보기)
  popularityScore: number;     // rating × log10(reviews + 1)
  photoUrl?: string;           // 매장 대표 사진
}

export type SortType = 'rating' | 'reviews' | 'popularity';

export interface RankingFilters {
  region: string;
  city: string;
  category: string;
  minRating: number;
  sortBy: SortType;
}

// 카테고리 정의
export interface CategoryInfo {
  id: string;
  label: string;
  icon: string;
  placeType: string; // Google Places type
}

export const POPULAR_CATEGORIES: CategoryInfo[] = [
  { id: 'restaurant', label: '식당', icon: '🍽️', placeType: 'restaurant' },
  { id: 'cafe', label: '카페', icon: '☕', placeType: 'cafe' },
  { id: 'beauty', label: '미용/에스테틱', icon: '💅', placeType: 'beauty_salon' },
  { id: 'hospital', label: '병원', icon: '🏥', placeType: 'hospital' },
  { id: 'fitness', label: '건강/피트니스', icon: '🏋️', placeType: 'gym' },
  { id: 'shopping', label: '쇼핑', icon: '🛍️', placeType: 'shopping_mall' },
];

// 지역별 중심 좌표 (서울 25개구 + 주요 도시)
export const REGION_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  // 서울 25개구
  '강남구': { latitude: 37.5172, longitude: 127.0473 },
  '강동구': { latitude: 37.5301, longitude: 127.1238 },
  '강북구': { latitude: 37.6398, longitude: 127.0256 },
  '강서구': { latitude: 37.5509, longitude: 126.8495 },
  '관악구': { latitude: 37.4781, longitude: 126.9515 },
  '광진구': { latitude: 37.5384, longitude: 127.0822 },
  '구로구': { latitude: 37.4954, longitude: 126.8874 },
  '금천구': { latitude: 37.4568, longitude: 126.8956 },
  '노원구': { latitude: 37.6542, longitude: 127.0568 },
  '도봉구': { latitude: 37.6688, longitude: 127.0471 },
  '동대문구': { latitude: 37.5744, longitude: 127.0396 },
  '동작구': { latitude: 37.5124, longitude: 126.9393 },
  '마포구': { latitude: 37.5663, longitude: 126.9019 },
  '서대문구': { latitude: 37.5791, longitude: 126.9368 },
  '서초구': { latitude: 37.4837, longitude: 127.0324 },
  '성동구': { latitude: 37.5634, longitude: 127.0368 },
  '성북구': { latitude: 37.5894, longitude: 127.0167 },
  '송파구': { latitude: 37.5145, longitude: 127.1059 },
  '양천구': { latitude: 37.5170, longitude: 126.8664 },
  '영등포구': { latitude: 37.5264, longitude: 126.8962 },
  '용산구': { latitude: 37.5384, longitude: 126.9654 },
  '은평구': { latitude: 37.6027, longitude: 126.9291 },
  '종로구': { latitude: 37.5735, longitude: 126.9788 },
  '중구': { latitude: 37.5638, longitude: 126.9979 },
  '중랑구': { latitude: 37.6063, longitude: 127.0925 },

  // 경기도 주요 도시
  '수원시': { latitude: 37.2636, longitude: 127.0286 },
  '성남시': { latitude: 37.4200, longitude: 127.1267 },
  '고양시': { latitude: 37.6584, longitude: 126.8320 },
  '용인시': { latitude: 37.2410, longitude: 127.1776 },
  '부천시': { latitude: 37.5034, longitude: 126.7660 },
  '안산시': { latitude: 37.3219, longitude: 126.8309 },
  '안양시': { latitude: 37.3943, longitude: 126.9568 },
  '남양주시': { latitude: 37.6361, longitude: 127.2168 },
  '화성시': { latitude: 37.1995, longitude: 126.8311 },
  '평택시': { latitude: 36.9922, longitude: 127.1128 },

  // 부산
  '해운대구': { latitude: 35.1631, longitude: 129.1635 },
  '부산진구': { latitude: 35.1628, longitude: 129.0530 },
  '동래구': { latitude: 35.2047, longitude: 129.0782 },
  '남구': { latitude: 35.1365, longitude: 129.0846 },
  '서구': { latitude: 35.0978, longitude: 129.0243 },

  // 기타 광역시
  '대구광역시': { latitude: 35.8714, longitude: 128.6014 },
  '인천광역시': { latitude: 37.4563, longitude: 126.7052 },
  '광주광역시': { latitude: 35.1595, longitude: 126.8526 },
  '대전광역시': { latitude: 36.3504, longitude: 127.3845 },
  '울산광역시': { latitude: 35.5384, longitude: 129.3114 },
  '세종특별자치시': { latitude: 36.4800, longitude: 127.2890 },
};
