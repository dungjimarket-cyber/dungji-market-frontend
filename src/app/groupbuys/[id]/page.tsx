import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { GroupBuy, ParticipationStatus } from '@/types/groupbuy';
import GroupBuyClient from './GroupBuyClient';

/**
 * 그룹 구매 데이터를 가져오는 함수
 */
async function getGroupBuy(id: string): Promise<GroupBuy | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/`, {
      next: { revalidate: 60 } // 60초마다 캐시 갱신
    });
    if (!response.ok) throw new Error('Failed to fetch group buy');
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch group buy with id: ${id}`, error);
    return null;
  }
}

/**
 * 그룹 구매 상세 페이지 서버 컴포넌트
 */
type GroupBuyPageProps = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function GroupBuyPage({ params }: GroupBuyPageProps) {
  const { id } = await params;
  const groupBuy = await getGroupBuy(id);
  
  // 그룹 구매가 존재하지 않는 경우
  if (!groupBuy) {
    notFound();
  }

  const progress = groupBuy.max_participants
    ? (groupBuy.current_participants / groupBuy.max_participants) * 100
    : 0;

  // 현재 로그인한 사용자 정보 가져오기 - 쿠키에서 JWT 토큰 추출
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value || '';

  // 사용자 ID와 공구 생성자 ID 비교
  let userId = null;
  if (accessToken) {
    try {
      // JWT 토큰에서 사용자 ID 추출
      const tokenParts = accessToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        userId = payload.user_id ? Number(payload.user_id) : null;
      }
    } catch (error) {
      console.error('JWT 토큰 디코딩 오류:', error);
    }
  }

  const creatorId = groupBuy?.creator ? Number(groupBuy.creator) : null;
  const isCreator = userId !== null && creatorId !== null && userId === creatorId;

  // 참여 상태 확인
  const token = accessToken;
  const participationStatus = await getParticipationStatus(id, token);

  // 클라이언트 컴포넌트로 데이터 전달
  return <GroupBuyClient 
    groupBuy={groupBuy} 
    id={id} 
    isCreator={isCreator} 
    participationStatus={participationStatus} 
  />;
}

// 총 지원금 마스킹 함수 추가
function maskSupportAmount(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0';
  const amountStr = amount.toString();
  if (amountStr.length <= 2) return amountStr;
  return `${amountStr[0]}${'*'.repeat(amountStr.length - 2)}${amountStr[amountStr.length - 1]}`;
}

// 남은 시간 계산 함수는 이제 lib/groupbuy-utils.ts에서 가져옵니다.

async function getParticipationStatus(id: string, token?: string): Promise<ParticipationStatus | null> {
  try {
    // 토큰이 없으면 기본 상태 반환
    if (!token) {
      return {
        is_participating: false,
        has_bids: false,
        can_leave: false
      };
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/check_participation/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch participation status');
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch participation status for group buy with id: ${id}`, error);
    return null;
  }
}
