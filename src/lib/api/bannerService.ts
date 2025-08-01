import { fetchWithAuth } from './fetch';

export interface Event {
  id: number;
  title: string;
  slug: string;
  event_type: string;
  event_type_display: string;
  status: string;
  status_display: string;
  thumbnail_url?: string;
  content_image_url?: string;
  content: string;
  short_description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  view_count: number;
  created_at: string;
  updated_at?: string;
}

export interface Banner {
  id: number;
  title: string;
  banner_type: string;
  banner_type_display: string;
  image_url: string;
  link_url?: string;
  target_url: string;
  event?: number;
  event_detail?: Event;
  order: number;
  is_active: boolean;
  is_valid: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

// 메인 배너 가져오기
export const getMainBanners = async (): Promise<Banner[]> => {
  console.log('[bannerService] 메인 배너 API 호출 시작');
  try {
    // 먼저 인증 없이 시도
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await fetch(`${baseUrl}/banners/main/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('[bannerService] 응답 상태:', response.status);
    
    if (!response.ok) {
      // 인증이 필요한 경우 fetchWithAuth 사용
      console.log('[bannerService] 인증 필요, fetchWithAuth 재시도');
      const authResponse = await fetchWithAuth('/banners/main/');
      const authData = await authResponse.json();
      console.log('[bannerService] 인증 응답 데이터:', authData);
      return authData.results || [];
    }
    
    const data = await response.json();
    console.log('[bannerService] 응답 데이터:', data);
    return data.results || [];
  } catch (error) {
    console.error('[bannerService] API 호출 오류:', error);
    throw error;
  }
};

// 배너 목록 가져오기
export const getBanners = async (): Promise<Banner[]> => {
  const response = await fetchWithAuth('/banners/');
  const data = await response.json();
  return data;
};

// 이벤트 목록 가져오기
export const getEvents = async (params?: {
  type?: string;
  status?: string;
  ongoing?: boolean;
}): Promise<Event[]> => {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.ongoing !== undefined) searchParams.append('ongoing', params.ongoing.toString());
  
  const queryString = searchParams.toString();
  const url = queryString ? `/events/?${queryString}` : '/events/';
  
  const response = await fetchWithAuth(url);
  const data = await response.json();
  return data;
};

// 이벤트 상세 가져오기
export const getEventDetail = async (slug: string): Promise<Event> => {
  const response = await fetchWithAuth(`/events/${slug}/`);
  const data = await response.json();
  return data;
};