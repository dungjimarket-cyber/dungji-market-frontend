/**
 * 휴대폰 인증 API 서비스
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface PhoneVerificationRequest {
  phone_number: string;
  purpose?: 'signup' | 'profile' | 'password_reset';
}

export interface PhoneVerificationResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  phone_number?: string;
}

export interface VerifyPhoneRequest {
  phone_number: string;
  verification_code: string;
  purpose?: 'signup' | 'profile' | 'password_reset';
}

export const phoneVerificationService = {
  /**
   * 인증번호 발송
   */
  async sendVerification(data: PhoneVerificationRequest): Promise<PhoneVerificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/phone/send-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '인증번호 발송에 실패했습니다.');
      }
      
      return result;
    } catch (error) {
      console.error('인증번호 발송 오류:', error);
      throw error;
    }
  },

  /**
   * 인증번호 확인
   */
  async verifyPhone(data: VerifyPhoneRequest): Promise<PhoneVerificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/phone/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '인증에 실패했습니다.');
      }
      
      return result;
    } catch (error) {
      console.error('인증 확인 오류:', error);
      throw error;
    }
  },

  /**
   * 인증 상태 확인 (로그인된 사용자용)
   */
  async checkStatus(token: string): Promise<PhoneVerificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/phone/status/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '상태 확인에 실패했습니다.');
      }
      
      return result;
    } catch (error) {
      console.error('상태 확인 오류:', error);
      throw error;
    }
  },

  /**
   * 휴대폰 번호 업데이트 (마이페이지용)
   */
  async updatePhoneNumber(
    data: VerifyPhoneRequest, 
    token: string
  ): Promise<PhoneVerificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/phone/update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || '휴대폰 번호 변경에 실패했습니다.');
      }
      
      return result;
    } catch (error) {
      console.error('휴대폰 번호 변경 오류:', error);
      throw error;
    }
  },

  /**
   * 전화번호 형식 검증
   */
  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/[-\s]/g, '');
    const phoneRegex = /^01[0-9]{8,9}$/;
    return phoneRegex.test(cleaned);
  },

  /**
   * 전화번호 포맷팅
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/[-\s]/g, '');
    
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  },

  /**
   * 휴대폰 번호 중복 확인
   */
  async checkPhoneDuplicate(phone_number: string): Promise<{ available: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone_number }),
      });

      const result = await response.json();
      
      if (!response.ok && response.status !== 400) {
        throw new Error('중복 확인에 실패했습니다.');
      }
      
      return {
        available: result.available || false,
        message: result.message || (result.available ? '사용 가능한 번호입니다.' : '이미 등록된 번호입니다.')
      };
    } catch (error) {
      console.error('휴대폰 중복 확인 오류:', error);
      return {
        available: true, // 오류 시 일단 진행 가능하도록
        message: ''
      };
    }
  },
};