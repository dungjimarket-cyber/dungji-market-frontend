import { fetchWithAuth } from './fetch';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * 입찰에 투표하기
 */
export async function voteForBid(groupBuyId: number, bidId: number): Promise<any> {
  const response = await fetchWithAuth(`${API_BASE}/groupbuys/${groupBuyId}/vote/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bid_id: bidId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '투표에 실패했습니다.');
  }

  return response.json();
}

/**
 * 현재 사용자의 투표 상태 확인
 */
export async function getMyVote(groupBuyId: number): Promise<any> {
  const response = await fetchWithAuth(`${API_BASE}/groupbuys/${groupBuyId}/my_vote/`, {
    method: 'GET',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // 투표하지 않은 경우
    }
    const error = await response.json();
    throw new Error(error.detail || '투표 상태 확인에 실패했습니다.');
  }

  return response.json();
}

/**
 * 공구의 투표 결과 조회
 */
export async function getVotingResults(groupBuyId: number): Promise<any> {
  const response = await fetchWithAuth(`${API_BASE}/groupbuys/${groupBuyId}/voting_results/`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '투표 결과 조회에 실패했습니다.');
  }

  return response.json();
}