import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateReportData {
  reported_user: number;
  reported_phone?: number;
  report_type: string;
  description: string;
}

export interface Report {
  id: number;
  reported_user: number;
  reported_user_username: string;
  reported_phone?: number;
  reported_phone_model?: string;
  reporter: number;
  reporter_username: string;
  report_type: string;
  report_type_display: string;
  description: string;
  status: string;
  status_display: string;
  admin_note?: string;
  processed_by?: number;
  processed_by_username?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Penalty {
  id: number;
  user: number;
  user_username: string;
  penalty_type: string;
  penalty_type_display: string;
  reason: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;
  status_display: string;
  issued_by?: number;
  issued_by_username?: string;
  revoked_by?: number;
  revoked_by_username?: string;
  revoked_at?: string;
  is_currently_active: boolean;
  related_reports_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserRating {
  id: number;
  username: string;
  nickname: string;
  average_rating: number | null;
  total_reviews: number;
  recent_reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    reviewer_username: string;
    phone_model: string;
    created_at: string;
    is_punctual?: boolean;
    is_friendly?: boolean;
    is_honest?: boolean;
    is_fast_response?: boolean;
  }>;
  penalty_status: {
    has_penalty: boolean;
    penalty_type?: string;
    end_date?: string;
    reason?: string;
  };
}

// 신고 생성
export const createReport = async (data: CreateReportData): Promise<Report> => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.post(
    `${API_URL}/used/reports/`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// 내 신고 목록 조회
export const getMyReports = async (): Promise<Report[]> => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(
    `${API_URL}/used/reports/my_reports/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// 내 패널티 목록 조회
export const getMyPenalties = async (): Promise<Penalty[]> => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(
    `${API_URL}/used/penalties/my_penalties/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// 활성 패널티 확인
export const checkActivePenalty = async (): Promise<{ has_active_penalty: boolean; penalty?: Penalty }> => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(
    `${API_URL}/used/penalties/check_active/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// 사용자 평점 정보 조회
export const getUserRating = async (userId: number): Promise<UserRating> => {
  const response = await axios.get(`${API_URL}/used/users/${userId}/rating/`);
  return response.data;
};

// 신고 타입 옵션
export const REPORT_TYPES = [
  { value: 'fake_listing', label: '허위매물' },
  { value: 'fraud', label: '사기' },
  { value: 'abusive_language', label: '욕설' },
  { value: 'inappropriate_behavior', label: '부적절한 행동' },
  { value: 'spam', label: '스팸/광고' },
  { value: 'other', label: '기타' },
];

// 패널티 타입 옵션
export const PENALTY_TYPES = [
  { value: 'auto_report', label: '신고 누적' },
  { value: 'manual_admin', label: '관리자 수동' },
  { value: 'trade_violation', label: '거래 위반' },
  { value: 'fake_listing', label: '허위매물' },
  { value: 'abusive_behavior', label: '악성 행위' },
];