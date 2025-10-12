import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CustomPenalty {
  type: string;
  reason: string;
  count: number;
  end_date: string;
  remaining_text: string;
  remaining_hours: number;
  remaining_minutes: number;
  is_active: boolean;
}

export interface CustomPenaltyCheckResponse {
  has_active_penalty: boolean;
  penalty: CustomPenalty | null;
}

/**
 * 커스텀 공구 활성 패널티 확인
 */
export const checkCustomActivePenalty = async (): Promise<CustomPenaltyCheckResponse> => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(
    `${API_URL}/custom-penalties/check_active/`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};
