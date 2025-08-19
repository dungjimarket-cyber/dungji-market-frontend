/**
 * 사업자번호 검증 API 서비스
 */

import { fetchWithAuth } from './fetch';

// API 응답 타입 정의
export interface BusinessVerificationResult {
  verification_id: number;
  business_number: string;
  status: 'valid' | 'invalid' | 'error';
  message: string;
  business_info?: {
    business_name?: string;
    representative_name?: string;
    business_status?: string;
    business_type?: string;
    establishment_date?: string;
    address?: string;
    is_verified: boolean;
  } | null;
  error_message?: string;
  user_verified?: boolean;
}

export interface BusinessVerificationHistory {
  verifications: Array<{
    id: number;
    business_number: string;
    status: 'valid' | 'invalid' | 'error';
    status_display: string;
    created_at: string;
    verified_at: string | null;
    business_info?: {
      business_name?: string;
      representative_name?: string;
      business_status?: string;
      business_type?: string;
      establishment_date?: string;
      address?: string;
    };
    error_message?: string;
  }>;
  count: number;
  user_verified: boolean;
  user_business_number: string | null;
}

export interface BusinessNumberFormatCheck {
  valid: boolean;
  business_number?: string;
  formatted_number?: string;
  message: string;
  error?: string;
}

/**
 * 사업자번호 형식 검사 (실제 검증 없이 형식만 확인)
 */
export async function checkBusinessNumberFormat(businessNumber: string): Promise<BusinessNumberFormatCheck> {
  try {
    const response = await fetchWithAuth('/auth/business/check-format/', {
      method: 'POST',
      body: JSON.stringify({
        business_number: businessNumber
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        valid: false,
        message: errorData.error || errorData.message || '형식 검사 중 오류가 발생했습니다.',
        error: errorData.error || errorData.message
      };
    }

    return await response.json();
  } catch (error) {
    console.error('사업자번호 형식 검사 오류:', error);
    return {
      valid: false,
      message: '네트워크 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 사업자번호 실제 검증 (국세청 API 사용)
 */
export async function verifyBusinessNumber(
  businessNumber: string, 
  businessName?: string
): Promise<BusinessVerificationResult> {
  try {
    const requestBody: any = {
      business_number: businessNumber
    };
    
    if (businessName) {
      requestBody.business_name = businessName;
    }

    const response = await fetchWithAuth('/auth/business/verify/', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // HTTP 상태가 400, 500이어도 응답 데이터를 반환 (검증 실패 정보 포함)
    return data;
  } catch (error) {
    console.error('사업자번호 검증 오류:', error);
    return {
      verification_id: 0,
      business_number: businessNumber,
      status: 'error',
      message: '네트워크 오류가 발생했습니다.',
      business_info: null,
      error_message: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 사업자번호 검증 이력 조회
 */
export async function getBusinessVerificationHistory(limit: number = 10): Promise<BusinessVerificationHistory> {
  try {
    const response = await fetchWithAuth(`/auth/business/history/?limit=${limit}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('검증 이력 조회에 실패했습니다.');
    }

    return await response.json();
  } catch (error) {
    console.error('사업자번호 검증 이력 조회 오류:', error);
    throw error;
  }
}

/**
 * 사업자번호 형식화 (123-45-67890)
 */
export function formatBusinessNumber(businessNumber: string): string {
  const cleanNumber = businessNumber.replace(/[^0-9]/g, '');
  
  if (cleanNumber.length === 10) {
    return `${cleanNumber.slice(0, 3)}-${cleanNumber.slice(3, 5)}-${cleanNumber.slice(5)}`;
  }
  
  return businessNumber;
}

/**
 * 사업자번호에서 하이픈 제거
 */
export function cleanBusinessNumber(businessNumber: string): string {
  return businessNumber.replace(/[^0-9]/g, '');
}

/**
 * 사업자번호 유효성 검사 (체크섬 포함)
 */
export function validateBusinessNumberChecksum(businessNumber: string): boolean {
  const cleanNumber = cleanBusinessNumber(businessNumber);
  
  if (cleanNumber.length !== 10) {
    return false;
  }

  // 체크섬 알고리즘
  const checkArray = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNumber[i]) * checkArray[i];
  }

  sum += Math.floor((parseInt(cleanNumber[8]) * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(cleanNumber[9]);
}