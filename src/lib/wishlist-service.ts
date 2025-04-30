/**
 * @file wishlist-service.ts
 * @description 찜하기 기능 관련 API 서비스
 */

import { tokenUtils } from './tokenUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 특정 공구의 찜하기 여부를 확인합니다.
 * @param groupbuyId - 확인할 공구의 ID
 * @returns 찜 여부를 나타내는 객체
 * @example
 * const { is_wished } = await checkWishStatus(5);
 * console.log(is_wished ? '찜한 상품입니다' : '찜하지 않은 상품입니다');
 */
export const checkWishStatus = async (groupbuyId: number | string): Promise<{is_wished: boolean}> => {
  try {
    const response = await tokenUtils.fetchWithAuth(`${API_URL}/wishlists/check_wished/?groupbuy_id=${groupbuyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response as {is_wished: boolean};
  } catch (error) {
    console.error('찜하기 상태 확인 중 오류 발생:', error);
    return { is_wished: false };
  }
};

/**
 * 찜하기 상태를 토글(추가/삭제)합니다.
 * @param groupbuyId - 토글할 공구의 ID
 * @returns 토글 결과 정보
 * @example
 * const result = await toggleWish(5);
 * if (result.status === 'wished') {
 *   console.log('찜하기 추가됨');
 * } else {
 *   console.log('찜하기 취소됨');
 * }
 */
export const toggleWish = async (groupbuyId: number | string): Promise<{
  status: 'wished' | 'unwished';
  message: string;
  data?: any;
}> => {
  try {
    const response = await tokenUtils.fetchWithAuth(`${API_URL}/wishlists/toggle_wish/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupbuy_id: groupbuyId }),
    });
    return response as {status: 'wished' | 'unwished'; message: string; data?: any};
  } catch (error) {
    console.error('찜하기 토글 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 찜 목록을 가져옵니다.
 * @returns 찜 목록 배열
 * @example
 * const wishlist = await getMyWishlist();
 * console.log(`${wishlist.length}개의 찜한 공구가 있습니다`);
 */
export const getMyWishlist = async (): Promise<any[]> => {
  try {
    const response = await tokenUtils.fetchWithAuth(`${API_URL}/wishlists/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response as any[];
  } catch (error) {
    console.error('찜 목록 가져오기 중 오류 발생:', error);
    return [];
  }
};
