import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Next.js 15에서 params는 Promise 타입이 되었습니다
type Params = Promise<{ id: string }>;

// 공구 참여 API
export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  // params는 Promise이미로 await 필요
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    // 인증 확인
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const groupBuyId = id; // params에서 이미 추출한 id 사용
    const userId = session.user?.id;
    
    // 실제 환경에서는 데이터베이스에서 공구 정보 조회
    // 여기서는 예시 데이터 사용
    const mockGroupBuy = {
      id: parseInt(groupBuyId),
      title: `공동구매 #${groupBuyId}`,
      description: `공동구매 #${groupBuyId} 상세 설명`,
      status: 'recruiting',
      current_participants: 3,
      min_participants: 2,
      max_participants: 5,
      start_time: new Date('2025-04-01').toISOString(),
      end_time: new Date('2025-04-30').toISOString(),
    };
    
    // 공구 참여 가능 여부 확인
    const now = new Date();
    const endTime = new Date(mockGroupBuy.end_time);
    
    // 이미 종료된 공구인지 확인
    if (endTime < now) {
      return NextResponse.json(
        { error: '이미 마감된 공동구매입니다.' },
        { status: 400 }
      );
    }
    
    // 최대 참여자 수 초과 여부 확인
    if (mockGroupBuy.current_participants >= mockGroupBuy.max_participants) {
      return NextResponse.json(
        { error: '최대 참여자 수에 도달했습니다.' },
        { status: 400 }
      );
    }
    
    // 실제 환경에서는 데이터베이스에 참여 정보 저장
    // 여기서는 성공 응답만 반환
    return NextResponse.json({
      id: Math.floor(Math.random() * 1000) + 10,
      user_id: userId,
      group_buy_id: parseInt(groupBuyId),
      joined_at: new Date().toISOString(),
      status: 'active'
    });
  } catch (error) {
    console.error(`Error joining group buy with id ${id}:`, error);
    return NextResponse.json(
      { error: '공동구매 참여에 실패했습니다.' },
      { status: 500 }
    );
  }
}
