/**
 * 전문가 상담 매칭 API 서비스
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ===== 타입 정의 =====

export interface ExpertProfile {
  id: number;
  user: number;
  user_nickname: string;
  category: {
    id: number;
    name: string;
    icon: string;
  };
  representative_name: string;
  is_business: boolean;
  business_name: string;
  business_number: string;
  business_license_image: string;
  license_number: string;
  license_image: string;
  regions: {
    code: string;
    name: string;
    full_name: string;
  }[];
  contact_phone: string;
  contact_email: string;
  profile_image: string;
  tagline: string;
  introduction: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  is_receiving_requests: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpertProfileCreate {
  category_id: number;
  representative_name: string;
  is_business?: boolean;
  business_name?: string;
  business_number?: string;
  business_license_image?: string;
  license_number?: string;
  license_image?: string;
  region_codes: string[];
  contact_phone: string;
  contact_email?: string;
  profile_image?: string;
  tagline?: string;
  introduction?: string;
}

export interface ConsultationMatch {
  id: number;
  consultation: number;
  expert: ExpertProfilePublic;
  status: 'pending' | 'replied' | 'connected' | 'completed';
  expert_message: string;
  available_time: string;
  created_at: string;
  replied_at: string | null;
  connected_at: string | null;
  completed_at: string | null;
}

export interface ExpertProfilePublic {
  id: number;
  representative_name: string;
  is_business: boolean;
  business_name: string;
  category: {
    id: number;
    name: string;
    icon: string;
  };
  regions: {
    code: string;
    name: string;
    full_name: string;
  }[];
  profile_image: string;
  tagline: string;
  introduction: string;
  // 연결 후에만 포함
  contact_phone?: string;
  contact_email?: string;
}

export interface ConsultationForExpert {
  id: number;
  category_name: string;
  region: string;
  answers: Record<string, string>;
  customer_name: string | null;
  customer_phone: string | null;
  match_status: 'pending' | 'replied' | 'connected' | 'completed' | null;
   expert_message?: string;
   available_time?: string;
  created_at: string;
}

export interface ConsultationForCustomer {
  id: number;
  category_name: string;
  region: string;
  answers: Record<string, string>;
  customer_name: string;
  customer_phone: string;
  replied_experts_count: number;
  connected_expert: ExpertProfilePublic | null;
  matches: ConsultationMatch[];
  created_at: string;
}

// ===== 이미지 업로드 API =====

/**
 * 전문가 프로필 이미지 업로드
 */
export async function uploadExpertProfileImage(
  file: File,
  token: string
): Promise<{ success: boolean; image_url?: string; message: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/expert/profile/image/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '이미지 업로드에 실패했습니다.',
      };
    }

    return {
      success: true,
      image_url: result.image_url,
      message: result.message || '이미지가 업로드되었습니다.',
    };
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

// ===== 전문가 프로필 API =====

/**
 * 전문가 회원가입
 */
export async function registerExpert(
  data: ExpertProfileCreate,
  token: string
): Promise<{ success: boolean; message: string; profile?: ExpertProfile }> {
  try {
    const response = await fetch(`${API_URL}/auth/register-expert/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '전문가 등록에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: result.detail || '전문가 등록이 완료되었습니다.',
      profile: result.profile,
    };
  } catch (error) {
    console.error('전문가 등록 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

/**
 * 내 전문가 프로필 조회
 */
export async function fetchMyExpertProfile(
  token: string
): Promise<ExpertProfile | null> {
  try {
    const response = await fetch(`${API_URL}/expert/profile/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('전문가 프로필 조회 오류:', error);
    return null;
  }
}

/**
 * 전문가 프로필 수정
 */
export async function updateExpertProfile(
  data: Partial<ExpertProfileCreate>,
  token: string
): Promise<{ success: boolean; message: string; profile?: ExpertProfile }> {
  try {
    const response = await fetch(`${API_URL}/expert/profile/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '프로필 수정에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: '프로필이 수정되었습니다.',
      profile: result,
    };
  } catch (error) {
    console.error('프로필 수정 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

/**
 * 상담 수신 토글
 */
export async function toggleReceivingRequests(
  token: string
): Promise<{ success: boolean; is_receiving_requests?: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_URL}/expert/profile/receiving/`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.detail };
    }

    return {
      success: true,
      is_receiving_requests: result.is_receiving_requests,
      message: result.message,
    };
  } catch (error) {
    console.error('수신 설정 변경 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

// ===== 전문가용 상담 요청 API =====

/**
 * 내게 온 상담 요청 목록
 */
export async function fetchExpertRequests(
  token: string,
  status?: string
): Promise<{
  results: ConsultationForExpert[];
  counts: {
    pending: number;
    replied: number;
    connected: number;
    completed: number;
  };
}> {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const url = `${API_URL}/expert/requests/${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('요청 목록 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('요청 목록 조회 오류:', error);
    return {
      results: [],
      counts: { pending: 0, replied: 0, connected: 0, completed: 0 },
    };
  }
}

/**
 * 상담 요청 상세
 */
export async function fetchExpertRequestDetail(
  requestId: number,
  token: string
): Promise<{ consultation: ConsultationForExpert; match: ConsultationMatch } | null> {
  try {
    const response = await fetch(`${API_URL}/expert/requests/${requestId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('요청 상세 조회 오류:', error);
    return null;
  }
}

/**
 * 답변하기
 */
export async function replyToRequest(
  requestId: number,
  data: { expert_message?: string; available_time?: string },
  token: string
): Promise<{ success: boolean; message: string; match?: ConsultationMatch }> {
  try {
    const response = await fetch(`${API_URL}/expert/requests/${requestId}/reply/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '답변 등록에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: result.detail || '답변이 완료되었습니다.',
      match: result.match,
    };
  } catch (error) {
    console.error('답변 등록 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

/**
 * 상담 완료 (전문가)
 */
export async function completeRequestAsExpert(
  requestId: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/expert/requests/${requestId}/complete/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '완료 처리에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: result.detail || '상담이 완료되었습니다.',
    };
  } catch (error) {
    console.error('완료 처리 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

// ===== 고객용 상담 내역 API =====

/**
 * 내 상담 요청 목록 (고객)
 */
export async function fetchMyConsultations(
  token: string
): Promise<{ results: ConsultationForCustomer[] }> {
  try {
    const response = await fetch(`${API_URL}/my/consultations/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('상담 목록 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('상담 목록 조회 오류:', error);
    return { results: [] };
  }
}

/**
 * 상담 요청 상세 (고객)
 */
export async function fetchMyConsultationDetail(
  consultationId: number,
  token: string
): Promise<ConsultationForCustomer | null> {
  try {
    const response = await fetch(`${API_URL}/my/consultations/${consultationId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('상담 상세 조회 오류:', error);
    return null;
  }
}

/**
 * 답변한 전문가 목록
 */
export async function fetchRepliedExperts(
  consultationId: number,
  token: string
): Promise<{ results: ConsultationMatch[] }> {
  try {
    const response = await fetch(`${API_URL}/my/consultations/${consultationId}/experts/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('전문가 목록 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('전문가 목록 조회 오류:', error);
    return { results: [] };
  }
}

/**
 * 전문가와 연결하기
 */
export async function connectWithExpert(
  consultationId: number,
  expertId: number,
  token: string
): Promise<{ success: boolean; message: string; expert?: ExpertProfilePublic; match?: ConsultationMatch }> {
  try {
    const response = await fetch(
      `${API_URL}/my/consultations/${consultationId}/experts/${expertId}/connect/`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '연결에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: result.detail || '전문가와 연결되었습니다.',
      expert: result.expert,
      match: result.match,
    };
  } catch (error) {
    console.error('전문가 연결 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

/**
 * 상담 완료 (고객)
 */
export async function completeConsultation(
  consultationId: number,
  token: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/my/consultations/${consultationId}/complete/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.detail || '완료 처리에 실패했습니다.',
      };
    }

    return {
      success: true,
      message: result.detail || '상담이 완료되었습니다.',
    };
  } catch (error) {
    console.error('완료 처리 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}
