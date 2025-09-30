/**
 * 끌올 기능 API
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 요청 헤더 설정
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
});

export interface BumpStatus {
  can_bump: boolean;
  bump_type: 'free' | 'paid';
  remaining_free_bumps_today: number;
  next_bump_available_at: string | null;
  total_bump_count: number;
  last_bumped_at: string | null;
  reason?: string;
}

export interface BumpResult {
  success: boolean;
  message: string;
  bump_type: 'free' | 'paid';
  remaining_free_bumps_today: number;
  next_bump_available_at: string;
  total_bump_count: number;
  bumped_at: string;
}

export interface TodayBumpCount {
  today_count: number;
  remaining: number;
  max_free_per_day: number;
}

class BumpAPI {
  /**
   * 끌올 가능 상태 조회
   */
  async getStatus(itemType: 'phone' | 'electronics', itemId: number): Promise<BumpStatus> {
    const endpoint = itemType === 'phone'
      ? `/api/used/phones/${itemId}/bump/status/`
      : `/api/used/electronics/${itemId}/bump/status/`;

    const response = await axios.get(
      `${API_BASE_URL}${endpoint}`,
      { headers: getHeaders() }
    );
    return response.data;
  }

  /**
   * 끌올 실행
   */
  async performBump(itemType: 'phone' | 'electronics', itemId: number): Promise<BumpResult> {
    const endpoint = itemType === 'phone'
      ? `/api/used/phones/${itemId}/bump/`
      : `/api/used/electronics/${itemId}/bump/`;

    const response = await axios.post(
      `${API_BASE_URL}${endpoint}`,
      {},
      { headers: getHeaders() }
    );
    return response.data;
  }

  /**
   * 오늘 사용한 끌올 횟수 조회
   */
  async getTodayCount(): Promise<TodayBumpCount> {
    const response = await axios.get(
      `${API_BASE_URL}/api/used/bump/today-count/`,
      { headers: getHeaders() }
    );
    return response.data;
  }

  /**
   * 다음 끌올 가능 시간까지 남은 시간 계산
   */
  getTimeUntilNextBump(nextAvailableAt: string | null): string {
    if (!nextAvailableAt) return '';

    const now = new Date();
    const next = new Date(nextAvailableAt);
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) return '지금 가능';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 후`;
    }
    return `${minutes}분 후`;
  }

  /**
   * 마지막 끌올 시간 포맷팅
   */
  formatLastBumpTime(lastBumpedAt: string | null): string {
    if (!lastBumpedAt) return '';

    const now = new Date();
    const bumped = new Date(lastBumpedAt);
    const diff = now.getTime() - bumped.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return bumped.toLocaleDateString('ko-KR');
  }
}

export const bumpAPI = new BumpAPI();
export default bumpAPI;