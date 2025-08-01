import { fetchWithAuth } from './fetch';

export interface FinalDecisionStatus {
  role: 'buyer' | 'seller';
  decision: 'pending' | 'confirmed' | 'cancelled';
  decision_at?: string;
  deadline: string;
}

export interface FinalDecisionRequest {
  decision: 'confirmed' | 'cancelled';
}

export interface ContactInfo {
  role: 'seller' | 'buyers';
  name?: string;
  phone?: string;
  business_name?: string;
  business_number?: string;
  buyers?: Array<{
    name: string;
    phone: string;
    address: string;
  }>;
  total_count?: number;
}

/**
 * 최종선택 상태 조회
 */
export async function getFinalDecisionStatus(groupBuyId: number): Promise<FinalDecisionStatus> {
  const response = await fetchWithAuth(`/groupbuys/${groupBuyId}/decision-status/`);
  return await response.json();
}

/**
 * 구매자 최종선택
 */
export async function submitBuyerFinalDecision(
  groupBuyId: number, 
  decision: 'confirmed' | 'cancelled'
): Promise<{ success: boolean; decision: string; message: string }> {
  const response = await fetchWithAuth(`/groupbuys/${groupBuyId}/buyer-decision/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ decision })
  });
  return await response.json();
}

/**
 * 판매자 최종선택
 */
export async function submitSellerFinalDecision(
  groupBuyId: number, 
  decision: 'confirmed' | 'cancelled'
): Promise<{ success: boolean; decision: string; message: string }> {
  const response = await fetchWithAuth(`/groupbuys/${groupBuyId}/seller-decision/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ decision })
  });
  return await response.json();
}

/**
 * 연락처 정보 조회 (최종선택 완료 후)
 */
export async function getContactInfo(groupBuyId: number): Promise<ContactInfo> {
  const response = await fetchWithAuth(`/groupbuys/${groupBuyId}/contact-info/`);
  return await response.json();
}