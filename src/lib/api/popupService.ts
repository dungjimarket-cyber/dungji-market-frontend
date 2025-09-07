/**
 * 팝업 관련 API 서비스
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// 팝업 타입 정의
export interface Popup {
  id: number;
  title: string;
  is_active: boolean;
  priority: number;
  popup_type: 'image' | 'text' | 'mixed';
  content?: string;
  image?: string;
  link_url?: string;
  link_target: '_self' | '_blank';
  position: 'center' | 'top' | 'bottom' | 'custom';
  position_x?: number;
  position_y?: number;
  width: number;
  height: number;
  start_date: string;
  end_date?: string;
  show_on_main: boolean;
  show_on_mobile: boolean;
  show_today_close: boolean;
  show_week_close: boolean;
  show_pages: string[];
  exclude_pages: string[];
  view_count: number;
  click_count: number;
  author?: number;
  created_at: string;
  updated_at: string;
  is_valid?: boolean;
}

export interface PopupFormData {
  title: string;
  is_active: boolean;
  priority: number;
  popup_type: 'image' | 'text' | 'mixed';
  content?: string;
  image?: File | string;
  link_url?: string;
  link_target: '_self' | '_blank';
  position: 'center' | 'top' | 'bottom' | 'custom';
  position_x?: number;
  position_y?: number;
  width: number;
  height: number;
  start_date: string;
  end_date?: string;
  show_on_main: boolean;
  show_on_mobile: boolean;
  show_today_close: boolean;
  show_week_close: boolean;
  show_pages?: string[];
  exclude_pages?: string[];
}

/**
 * 팝업 목록 조회
 */
export const getPopups = async (isActive?: boolean): Promise<Popup[]> => {
  try {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const response = await axios.get(`${API_URL}/popups/`, { params });
    return response.data.results || response.data;
  } catch (error) {
    console.error('팝업 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 활성 팝업 목록 조회 (메인 페이지용)
 */
export const getActivePopups = async (): Promise<Popup[]> => {
  try {
    const response = await axios.get(`${API_URL}/popups/active_popups/`);
    return response.data;
  } catch (error) {
    console.error('활성 팝업 조회 실패:', error);
    throw error;
  }
};

/**
 * 팝업 상세 조회
 */
export const getPopup = async (id: number): Promise<Popup> => {
  try {
    const response = await axios.get(`${API_URL}/popups/${id}/`);
    return response.data;
  } catch (error) {
    console.error('팝업 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * 팝업 생성
 */
export const createPopup = async (data: PopupFormData, token: string): Promise<Popup> => {
  try {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key as keyof PopupFormData];
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'show_pages' || key === 'exclude_pages') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await axios.post(`${API_URL}/popups/`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('팝업 생성 실패:', error);
    throw error;
  }
};

/**
 * 팝업 수정
 */
export const updatePopup = async (id: number, data: PopupFormData, token: string): Promise<Popup> => {
  try {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key as keyof PopupFormData];
      if (value !== undefined && value !== null) {
        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'show_pages' || key === 'exclude_pages') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await axios.patch(`${API_URL}/popups/${id}/`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('팝업 수정 실패:', error);
    throw error;
  }
};

/**
 * 팝업 삭제
 */
export const deletePopup = async (id: number, token: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/popups/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('팝업 삭제 실패:', error);
    throw error;
  }
};

/**
 * 팝업 조회수 기록
 */
export const recordPopupView = async (id: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/popups/${id}/record_view/`);
  } catch (error) {
    console.error('팝업 조회수 기록 실패:', error);
  }
};

/**
 * 팝업 클릭수 기록
 */
export const recordPopupClick = async (id: number): Promise<void> => {
  try {
    await axios.post(`${API_URL}/popups/${id}/record_click/`);
  } catch (error) {
    console.error('팝업 클릭수 기록 실패:', error);
  }
};