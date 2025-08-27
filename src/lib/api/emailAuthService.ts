/**
 * 이메일 인증 서비스
 * 비밀번호 재설정, 이메일 인증 등을 처리
 */

import { fetchWithAuth } from './fetch';

interface PasswordResetRequest {
  email: string;
}

interface PasswordResetVerify {
  email: string;
  token: string;
}

interface PasswordReset {
  email: string;
  token: string;
  password: string;
}

interface EmailVerification {
  email: string;
  name?: string;
}

interface EmailVerificationCode {
  email: string;
  code: string;
}

interface EmailChange {
  new_email: string;
  code: string;
  password: string;
}

class EmailAuthService {
  /**
   * 비밀번호 재설정 요청
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset/request/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '비밀번호 재설정 요청에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 비밀번호 재설정 토큰 확인
   */
  async verifyResetToken(email: string, token: string): Promise<{ valid: boolean; message?: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset/verify/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '토큰 확인에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 비밀번호 재설정
   */
  async resetPassword(email: string, token: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/password-reset/confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '비밀번호 재설정에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 이메일 인증 코드 발송 (회원가입용)
   */
  async sendVerificationEmail(email: string, name?: string): Promise<{ message: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/email/send-verification/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '인증 이메일 발송에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 이메일 인증 코드 확인
   */
  async verifyEmailCode(email: string, code: string): Promise<{ valid: boolean; message?: string }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/email/verify-code/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '인증 코드 확인에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 이메일 변경 (인증된 사용자)
   */
  async changeEmail(newEmail: string, code: string, password: string): Promise<{ message: string }> {
    const response = await fetchWithAuth('/auth/email/change/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        new_email: newEmail,
        code,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '이메일 변경에 실패했습니다.');
    }

    return response.json();
  }

  /**
   * 이메일 변경용 인증 코드 발송
   */
  async sendEmailChangeCode(newEmail: string): Promise<{ message: string }> {
    const response = await fetchWithAuth('/auth/email/send-change-code/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ new_email: newEmail }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '인증 코드 발송에 실패했습니다.');
    }

    return response.json();
  }
}

export const emailAuthService = new EmailAuthService();