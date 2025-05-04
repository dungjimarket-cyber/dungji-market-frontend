/**
 * 리뷰/별점 기능 관련 API 서비스
 */
import { tokenUtils } from './tokenUtils';

/**
 * 특정 그룹구매의 리뷰 목록을 조회합니다.
 * @param groupbuyId - 조회할 그룹구매 ID
 * @returns 리뷰 목록, 개수, 평균 평점 정보
 */
export const getGroupbuyReviews = async (groupbuyId: string | number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/groupbuy_reviews/?groupbuy_id=${groupbuyId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '리뷰 목록을 불러오는 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('리뷰 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 내가 작성한 리뷰 목록을 조회합니다.
 * @returns 내 리뷰 목록 
 */
export const getMyReviews = async () => {
  try {
    const response = await tokenUtils.fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/reviews/my_reviews/`);    
    return response;
  } catch (error) {
    console.error('내 리뷰 목록 조회 오류:', error);
    throw error;
  }
};

/**
 * 리뷰를 작성합니다.
 * @param data - 리뷰 데이터 (groupbuy, rating, content, is_purchased)
 * @param token - 인증을 위한 JWT 토큰
 * @returns 생성된 리뷰 정보
 */
export const createReview = async (
  data: {
    groupbuy: number | string;
    rating: number;
    content: string;
    is_purchased?: boolean;
  },
  token?: string
) => {
  try {
    // AccessToken이 인자로 전달되지 않은 경우 tokenUtils에서 가져오기
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // token이 없으면 tokenUtils 사용
      return await tokenUtils.fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/`, 
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`리뷰 작성 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('리뷰 작성 오류:', error);
    throw error;
  }
};

/**
 * 리뷰를 수정합니다.
 * @param reviewId - 수정할 리뷰 ID
 * @param data - 수정할 리뷰 데이터 (rating, content, is_purchased)
 * @param token - 인증을 위한 JWT 토큰
 * @returns 수정된 리뷰 정보
 */
export const updateReview = async (
  reviewId: number | string,
  data: {
    rating?: number;
    content?: string;
    is_purchased?: boolean;
  },
  token?: string
) => {
  try {
    // AccessToken이 인자로 전달되지 않은 경우 tokenUtils에서 가져오기
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      // token이 없으면 tokenUtils 사용
      return await tokenUtils.fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/`, 
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        }
      );
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`리뷰 수정 오류: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('리뷰 수정 오류:', error);
    throw error;
  }
};

/**
 * 리뷰를 삭제합니다.
 * @param reviewId - 삭제할 리뷰 ID
 */
export const deleteReview = async (reviewId: number | string) => {
  try {
    await tokenUtils.fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/`, {
      method: 'DELETE',
    });
    
    return true;
  } catch (error) {
    console.error('리뷰 삭제 오류:', error);
    throw error;
  }
};

/**
 * 리뷰를 신고합니다.
 * @param reviewId - 신고할 리뷰 ID
 * @param reason - 신고 사유
 * @returns 신고 결과
 */
export const reportReview = async (reviewId: number | string, reason: string) => {
  try {
    const response = await tokenUtils.fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/report/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    
    return response;
  } catch (error) {
    console.error('리뷰 신고 오류:', error);
    throw error;
  }
};
