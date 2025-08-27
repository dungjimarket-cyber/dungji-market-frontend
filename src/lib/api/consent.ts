import { ParticipantConsent, ConsentStatus } from '@/types/groupbuy';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// 대기 중인 동의 요청 목록 조회
export async function getPendingConsents(token: string): Promise<ParticipantConsent[]> {
  const response = await fetch(`${API_URL}/consents/pending/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('동의 요청 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
}

// 동의 상태 업데이트
export async function updateConsentStatus(
  token: string,
  consentId: number,
  action: 'agree' | 'disagree'
): Promise<ParticipantConsent> {
  const response = await fetch(`${API_URL}/consents/${consentId}/update_status/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '동의 상태 업데이트에 실패했습니다.');
  }

  return response.json();
}

// 공구의 동의 현황 조회
export async function getGroupBuyConsentStatus(
  token: string,
  groupBuyId: number
): Promise<ConsentStatus> {
  const response = await fetch(`${API_URL}/consents/groupbuy_status/?groupbuy_id=${groupBuyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('공구 동의 현황을 불러오는데 실패했습니다.');
  }

  return response.json();
}

// 동의 프로세스 시작 (관리자용)
export async function startConsentProcess(
  token: string,
  groupBuyId: number,
  bidId: number,
  consentHours: number = 24
): Promise<any> {
  const response = await fetch(`${API_URL}/groupbuys/${groupBuyId}/start-consent/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bid_id: bidId,
      consent_hours: consentHours,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '동의 프로세스 시작에 실패했습니다.');
  }

  return response.json();
}