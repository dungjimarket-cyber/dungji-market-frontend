/**
 * 중고거래 통합 타입 정의
 * 휴대폰과 전자제품 거래를 통합 관리하기 위한 타입
 */

import type { UsedPhone, PHONE_BRANDS } from './used';
import type { UsedElectronics } from './electronics';

// 아이템 타입 구분자
export type MarketItemType = 'phone' | 'electronics';

// 공통 필드 인터페이스
export interface BaseMarketItem {
  id: number;
  price: number;
  status: 'active' | 'trading' | 'sold' | 'deleted';
  description: string;
  view_count: number;
  offer_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  seller?: number;
  seller_info?: {
    id: number;
    username?: string;
    nickname: string;
    sell_count?: number;
  };
  images?: Array<{
    id?: number;
    image?: string;
    image_url?: string;
    imageUrl?: string;
    is_main?: boolean;
    is_primary?: boolean;
    order?: number;
  }>;
  regions?: Array<{
    id: number;
    name: string;
    sido?: string;
    sigungu?: string;
    dong?: string;
  }>;
  meeting_place?: string;
  accept_offers?: boolean;
  min_offer_price?: number;
  is_favorited?: boolean;
  is_mine?: boolean;
  has_my_offer?: boolean;
}

// 휴대폰 아이템 (타입 구분자 포함)
export type PhoneItem = UsedPhone & { itemType: 'phone' };

// 전자제품 아이템 (타입 구분자 포함)
export type ElectronicsItem = UsedElectronics & { itemType: 'electronics' };

// 통합 마켓 아이템 타입
export type UnifiedMarketItem = PhoneItem | ElectronicsItem;

// 타입 가드 함수들
export function isPhoneItem(item: UnifiedMarketItem): item is PhoneItem {
  // itemType이 있으면 우선 사용, 없으면 필드 체크
  if ('itemType' in item && item.itemType) {
    return item.itemType === 'phone';
  }
  // 휴대폰만 가지는 필드로 판별
  return 'model' in item && 'storage' in item && !('model_name' in item);
}

export function isElectronicsItem(item: UnifiedMarketItem): item is ElectronicsItem {
  // itemType이 있으면 우선 사용, 없으면 필드 체크
  if ('itemType' in item && item.itemType) {
    return item.itemType === 'electronics';
  }
  // 전자제품만 가지는 필드로 판별
  return 'model_name' in item && 'subcategory' in item;
}

// 아이템에서 메인 이미지 URL 가져오기
export function getMainImageUrl(item: UnifiedMarketItem): string {
  // 이미지 배열이 없거나 비어있으면 기본 이미지
  if (!item.images || item.images.length === 0) {
    return '/images/no-image.png';
  }

  // 휴대폰과 전자제품의 이미지 필드명이 다를 수 있음
  const firstImage = item.images[0];

  if (isPhoneItem(item)) {
    // 휴대폰: image_url 사용
    return (firstImage as any).image_url || (firstImage as any).image || '/images/no-image.png';
  } else {
    // 전자제품: imageUrl 사용
    return (firstImage as any).imageUrl || (firstImage as any).image_url || (firstImage as any).image || '/images/no-image.png';
  }
}

// 아이템 제목 생성
export function getItemTitle(item: UnifiedMarketItem): string {
  if (isPhoneItem(item)) {
    const storage = item.storage ? `${item.storage}GB` : '';
    // 휴대폰 브랜드를 한글로 변환
    const koreanBrand = item.brand && PHONE_BRANDS[item.brand] ? PHONE_BRANDS[item.brand] : item.brand;
    return `${koreanBrand} ${item.model} ${storage}`.trim();
  } else {
    return `${item.brand} ${item.model_name}`.trim();
  }
}

// 판매자 닉네임 가져오기
export function getSellerNickname(item: UnifiedMarketItem): string {
  // seller 필드 체크 (휴대폰과 전자제품 모두 동일)
  if ('seller' in item && item.seller) {
    return (item.seller as any).nickname || (item.seller as any).username || '알 수 없음';
  }
  return '알 수 없음';
}

// 아이템 상세 URL 생성
export function getItemDetailUrl(item: UnifiedMarketItem): string {
  if (isPhoneItem(item)) {
    return `/used/${item.id}`;
  } else {
    return `/used-electronics/${item.id}`;
  }
}

// 아이템 수정 URL 생성
export function getItemEditUrl(item: UnifiedMarketItem): string {
  if (isPhoneItem(item)) {
    return `/used/${item.id}/edit`;
  } else {
    return `/used-electronics/${item.id}/edit`;
  }
}

// 페이징 헬퍼
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function calculatePagination(
  items: any[],
  currentPage: number,
  itemsPerPage: number
): PaginationInfo {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

export function paginateItems<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
): T[] {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return items.slice(startIndex, endIndex);
}

// 날짜순 정렬 헬퍼
export function sortByDate<T extends { created_at: string }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

// API 응답 통합 헬퍼
export interface ApiListResponse<T> {
  results?: T[];
  items?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export function normalizeApiResponse<T>(response: ApiListResponse<T>): T[] {
  return response.results || response.items || [];
}

// 상태별 필터링 헬퍼
export function filterByStatus<T extends { status: string }>(
  items: T[],
  status: string | string[]
): T[] {
  const statuses = Array.isArray(status) ? status : [status];
  return items.filter(item => statuses.includes(item.status));
}

// 제안 관련 타입
export interface UnifiedOffer {
  id: number;
  itemType: MarketItemType;
  item_id: number;
  buyer: {
    id: number;
    nickname: string;
    profile_image?: string;
  };
  offered_price: number;
  offer_price?: number; // 전자제품용
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

// 찜 관련 타입
export interface UnifiedFavorite {
  id: number;
  itemType: MarketItemType;
  item: UnifiedMarketItem;
  created_at: string;
}

// 거래 관련 타입
export interface UnifiedTransaction {
  id: number;
  itemType: MarketItemType;
  item_id: number;
  seller: {
    id: number;
    nickname: string;
  };
  buyer: {
    id: number;
    nickname: string;
  };
  final_price: number;
  status: string;
  created_at: string;
  completed_at?: string;
}