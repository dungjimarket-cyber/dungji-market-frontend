/**
 * 지역 업체 정보 타입 정의
 */

export interface LocalBusinessCategory {
  id: number;
  name: string;
  name_en: string;
  icon: string;
  google_place_type: string;
  description: string;
  order_index: number;
  is_active: boolean;
}

export interface LocalBusinessLink {
  id: number;
  link_type: 'news' | 'blog' | 'review' | 'community';
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  created_at: string;
}

export interface LocalBusinessList {
  id: number;
  name: string;
  address: string;
  phone_number: string | null;
  category_name: string;
  category_icon: string;
  region_name: string;
  rating: number | null;
  review_count: number;
  popularity_score: number;
  rank_in_region: number;
  is_verified: boolean;
  is_new: boolean;
  has_photo: boolean;  // photo_url 존재 여부
  photo_url: string | null;  // Google Places 이미지 URL
  custom_photo_url: string | null;  // 커스텀 업로드 이미지 URL (우선순위 높음)
  view_count: number;
  editorial_summary: string | null;  // AI/Google 요약
  created_at: string;
}

export interface LocalBusinessDetail extends LocalBusinessList {
  category: LocalBusinessCategory;
  region_full_name: string;
  google_place_id: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  last_synced_at: string | null;
  links: LocalBusinessLink[];
  updated_at: string;
}
