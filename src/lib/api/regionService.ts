/**
 * 지역 관련 API 서비스
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
      ? { Authorization: headers.find(([key]) => key.toLowerCase() === 'authorization')?.[1] }
      : { Authorization: headers.Authorization || '' };
  
  return authHeader;
};

export interface Region {
  code: string;
  name: string;
  full_name: string;
  level: number;
  is_active: boolean;
}

export interface RegionWithChildren extends Region {
  children: Region[];
}

export interface RegionTree extends Region {
  ancestors: Region[];
  children: Region[];
}

/**
 * 지역 목록을 가져오는 함수
 * @param params 필터링 파라미터 (level, parent_code 등)
 * @returns 지역 목록
 */
export const getRegions = async (params?: {
  level?: number;
  parent_code?: string;
  root_only?: boolean;
  search?: string;
}): Promise<Region[]> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/regions/`, { 
      params,
      headers
    });
    return response.data;
  } catch (error) {
    console.error('지역 데이터 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 특정 지역 정보를 가져오는 함수
 * @param code 지역 코드
 * @returns 지역 정보 (하위 지역 포함)
 */
export const getRegion = async (code: string): Promise<RegionWithChildren> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/regions/${code}/`, { headers });
    return response.data;
  } catch (error) {
    console.error('지역 정보 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 특정 지역의 하위 지역 목록을 가져오는 함수
 * @param code 지역 코드
 * @returns 하위 지역 목록
 */
export const getRegionChildren = async (code: string): Promise<Region[]> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/regions/${code}/children/`, { headers });
    return response.data;
  } catch (error) {
    console.error('지역 하위 정보 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 특정 지역의 계층 구조를 가져오는 함수 (상위 및 하위 지역)
 * @param code 지역 코드
 * @returns 지역 계층 구조
 */
export const getRegionTree = async (code: string): Promise<RegionTree> => {
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/regions/${code}/tree/`, { headers });
    return response.data;
  } catch (error) {
    console.error('지역 트리 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 지역명으로 지역을 검색하는 함수
 * @param name 검색할 지역명 (2글자 이상)
 * @returns 검색된 지역 목록
 */
export const searchRegionsByName = async (name: string): Promise<Region[]> => {
  if (name.length < 2) {
    throw new Error('검색어는 2글자 이상이어야 합니다.');
  }
  
  try {
    const headers = await getAxiosAuthHeaders();
    const response = await axios.get(`${API_URL}/regions/search_by_name/`, {
      params: { name },
      headers
    });
    return response.data;
  } catch (error) {
    console.error('지역 검색 오류:', error);
    throw error;
  }
};
