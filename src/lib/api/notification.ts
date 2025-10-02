import { fetchWithAuth } from './fetch';

/**
 * 알림 타입 정의
 */
export interface Notification {
  id: number;
  user: number;
  user_name: string;
  groupbuy: number | null;
  groupbuy_title: string;
  message: string;
  notification_type: string;
  item_type: string | null;
  item_id: number | null;
  created_at: string;
  is_read: boolean;
}

/**
 * 알림 응답 타입 정의
 */
export interface NotificationResponse {
  unread: Notification[];
  read: Notification[];
  unread_count: number;
}

/**
 * 사용자의 모든 알림을 조회합니다.
 * @returns {Promise<NotificationResponse>} 읽은 알림과 읽지 않은 알림 목록
 */
export const getNotifications = async (): Promise<NotificationResponse> => {
  const response = await fetchWithAuth('/notifications/', {
    skipAuthRedirect: true // 인증 실패 시 리다이렉트 방지
  });
  return response.json();
};

/**
 * 특정 알림을 읽음 처리합니다.
 * @param {number} id - 알림 ID
 * @returns {Promise<any>} 처리 결과
 */
export const markAsRead = async (id: number): Promise<any> => {
  const response = await fetchWithAuth(`/notifications/${id}/mark_as_read/`, {
    method: 'POST',
  });
  return response.json();
};

/**
 * 모든 알림을 읽음 처리합니다.
 * @returns {Promise<any>} 처리 결과
 */
export const markAllAsRead = async (): Promise<any> => {
  const response = await fetchWithAuth('/notifications/mark_all_as_read/', {
    method: 'POST',
  });
  return response.json();
};
