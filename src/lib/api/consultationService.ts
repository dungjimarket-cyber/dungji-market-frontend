/**
 * 상담 신청 API 서비스
 */

import {
  ConsultationType,
  ConsultationRequestCreate,
  AIAssistRequest,
  AIAssistResponse,
} from '@/types/consultation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * 업종별 상담 유형 목록 조회
 */
export async function fetchConsultationTypes(categoryId?: number): Promise<ConsultationType[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId) {
      params.append('category', categoryId.toString());
    }

    const url = `${API_URL}/consultation-types/${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('상담 유형 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('상담 유형 조회 오류:', error);
    return [];
  }
}

/**
 * 상담 신청 생성 (비회원 가능)
 */
export async function createConsultationRequest(
  data: ConsultationRequestCreate
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    const response = await fetch(`${API_URL}/consultation-requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      // 유효성 검사 오류 처리
      if (result.phone) {
        return { success: false, message: result.phone[0] };
      }
      if (result.content) {
        return { success: false, message: result.content[0] };
      }
      return { success: false, message: result.detail || '상담 신청에 실패했습니다.' };
    }

    return result;
  } catch (error) {
    console.error('상담 신청 오류:', error);
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

/**
 * AI 내용 정리 및 상담 유형 추천
 */
export async function getAIAssist(data: AIAssistRequest): Promise<AIAssistResponse | null> {
  try {
    const response = await fetch(`${API_URL}/consultation-requests/ai_assist/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('AI 정리 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('AI 정리 오류:', error);
    return null;
  }
}
