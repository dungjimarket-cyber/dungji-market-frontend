export interface SendVerificationCodeRequest {
  phone_number: string;
  purpose?: 'signup' | 'reset_password' | 'change_phone';
}

export interface SendVerificationCodeResponse {
  message: string;
  expires_in: number;
  code?: string; // 개발 환경에서만 제공
}

export interface VerifyCodeRequest {
  phone_number: string;
  code: string;
  purpose?: 'signup' | 'reset_password' | 'change_phone';
}

export interface VerifyCodeResponse {
  message?: string;
  verified: boolean;
  phone_number?: string;
  error?: string;
}

export interface CheckVerificationStatusResponse {
  verified: boolean;
  phone_number?: string;
}

/**
 * 휴대폰 인증 코드 발송
 */
export async function sendVerificationCode(data: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${baseUrl}/auth/phone/send-code/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: data.phone_number,
      purpose: data.purpose || 'signup',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '인증 코드 발송에 실패했습니다.');
  }

  return response.json();
}

/**
 * 인증 코드 확인
 */
export async function verifyCode(data: VerifyCodeRequest): Promise<VerifyCodeResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${baseUrl}/auth/phone/verify/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: data.phone_number,
      code: data.code,
      purpose: data.purpose || 'signup',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '인증 코드 확인에 실패했습니다.');
  }

  return response.json();
}

/**
 * 인증 상태 확인
 */
export async function checkVerificationStatus(
  phone_number: string,
  purpose: string = 'signup'
): Promise<CheckVerificationStatusResponse> {
  const params = new URLSearchParams({
    phone_number,
    purpose,
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const response = await fetch(`${baseUrl}/auth/phone/status/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '인증 상태 확인에 실패했습니다.');
  }

  return response.json();
}