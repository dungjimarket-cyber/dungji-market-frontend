/**
 * 지역 업체 정보 API
 */
import { LocalBusinessCategory, LocalBusinessList, LocalBusinessDetail } from '@/types/localBusiness';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 업종 카테고리 목록 조회
 */
export async function fetchCategories(): Promise<LocalBusinessCategory[]> {
  const response = await fetch(`${API_URL}/local-business-categories/`);

  if (!response.ok) {
    throw new Error('카테고리 조회 실패');
  }

  return response.json();
}

/**
 * 업체 목록 조회
 */
export async function fetchBusinesses(params?: {
  category?: number;
  region?: string;
  search?: string;
  ordering?: string;
  is_new?: boolean;
  is_verified?: boolean;
}): Promise<LocalBusinessList[]> {
  const searchParams = new URLSearchParams();

  if (params?.category) searchParams.append('category', params.category.toString());
  if (params?.region) searchParams.append('region', params.region);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.ordering) searchParams.append('ordering', params.ordering);
  if (params?.is_new !== undefined) searchParams.append('is_new', params.is_new.toString());
  if (params?.is_verified !== undefined) searchParams.append('is_verified', params.is_verified.toString());

  const url = `${API_URL}/local-businesses/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('업체 목록 조회 실패');
  }

  return response.json();
}

/**
 * 업체 상세 조회
 */
export async function fetchBusinessDetail(id: number): Promise<LocalBusinessDetail> {
  const response = await fetch(`${API_URL}/local-businesses/${id}/`);

  if (!response.ok) {
    throw new Error('업체 상세 조회 실패');
  }

  return response.json();
}

/**
 * 지역+업종별 상위 업체 조회
 */
export async function fetchBusinessesByRegionCategory(
  regionCode: string,
  categoryId: number,
  limit: number = 5
): Promise<LocalBusinessList[]> {
  const response = await fetch(
    `${API_URL}/local-businesses/by_region_category/?region=${regionCode}&category=${categoryId}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('업체 조회 실패');
  }

  return response.json();
}

/**
 * 인기 업체 조회
 */
export async function fetchPopularBusinesses(
  categoryId?: number,
  limit: number = 10
): Promise<LocalBusinessList[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (categoryId) params.append('category', categoryId.toString());

  const response = await fetch(`${API_URL}/local-businesses/popular/?${params.toString()}`);

  if (!response.ok) {
    throw new Error('인기 업체 조회 실패');
  }

  return response.json();
}

/**
 * 신규 업체 조회
 */
export async function fetchNewBusinesses(
  categoryId?: number,
  limit: number = 10
): Promise<LocalBusinessList[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (categoryId) params.append('category', categoryId.toString());

  const response = await fetch(`${API_URL}/local-businesses/new/?${params.toString()}`);

  if (!response.ok) {
    throw new Error('신규 업체 조회 실패');
  }

  return response.json();
}
