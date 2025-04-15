import { NextRequest, NextResponse } from 'next/server';

// 공구 상태 자동 업데이트 스케줄러
// 이 API는 cron job으로 주기적으로 호출되어 공구 상태를 업데이트합니다.
export async function GET(request: NextRequest) {
  try {
    // 인증 키 확인 (실제 환경에서는 보안을 위해 API 키 등을 사용)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    // 실제 환경에서는 토큰 검증 로직 필요
    if (token !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 403 }
      );
    }
    
    // 현재 시간
    const now = new Date();
    
    // 실제 환경에서는 데이터베이스에서 모든 활성 공구 조회
    // 여기서는 예시 데이터 사용
    const mockGroupBuys = [
      {
        id: 1,
        status: 'recruiting',
        current_participants: 3,
        min_participants: 2,
        max_participants: 5,
        end_time: new Date('2025-04-30').toISOString(),
      },
      {
        id: 2,
        status: 'recruiting',
        current_participants: 2,
        min_participants: 2,
        max_participants: 5,
        end_time: new Date('2025-03-30').toISOString(), // 이미 종료된 공구
      },
      {
        id: 3,
        status: 'recruiting',
        current_participants: 1,
        min_participants: 2,
        max_participants: 5,
        end_time: new Date('2025-03-25').toISOString(), // 이미 종료된 공구, 최소 인원 미달
      }
    ];
    
    // 상태 업데이트가 필요한 공구 목록
    const groupBuysToUpdate = [];
    
    for (const groupBuy of mockGroupBuys) {
      const endTime = new Date(groupBuy.end_time);
      
      // 모집 중이고 마감 시간이 지난 경우
      if (groupBuy.status === 'recruiting' && endTime < now) {
        // 최소 참여자 수를 충족한 경우 '확정' 상태로 변경
        if (groupBuy.current_participants >= groupBuy.min_participants) {
          groupBuysToUpdate.push({
            id: groupBuy.id,
            status: 'confirmed',
            updated_at: now.toISOString()
          });
        } 
        // 최소 참여자 수를 충족하지 못한 경우 '취소' 상태로 변경
        else {
          groupBuysToUpdate.push({
            id: groupBuy.id,
            status: 'cancelled',
            updated_at: now.toISOString()
          });
        }
      }
    }
    
    // 실제 환경에서는 데이터베이스에서 일괄 업데이트
    // 여기서는 업데이트할 공구 목록만 반환
    
    return NextResponse.json({
      updated_count: groupBuysToUpdate.length,
      updated_group_buys: groupBuysToUpdate
    });
  } catch (error) {
    console.error('Error updating group buy statuses:', error);
    return NextResponse.json(
      { error: '공동구매 상태 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
