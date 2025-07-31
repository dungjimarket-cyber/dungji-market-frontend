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
  const response = await fetchWithAuth('/banners/main/');
  const data = await response.json();
  return data;
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