import { NextRequest, NextResponse } from 'next/server';
import { decodeJwtToken } from '@/lib/auth';

// 공구 상태 계산 함수
function calculateGroupBuyStatus(status: string, endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  
  // 이미 종료된 상태라면 그대로 반환
  if (status === 'completed') {
    return 'completed';
  }
  
  // 확정된 상태라면 그대로 반환
  if (status === 'confirmed') {
    return 'confirmed';
  }
  
  // 모집 중이지만 마감 시간이 지났다면 'expired' 상태로 변경
  if (status === 'recruiting' && end < now) {
    return 'expired';
  }
  
  // 그 외의 경우는 원래 상태 유지
  return status;
}

// 사용자가 참여 중인 공구 목록 가져오기
export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = decodeJwtToken(token);
    
    // 토큰 유효성 검사
    if (!decodedToken || !decodedToken.user_id) {
      return NextResponse.json(
        { error: '유효하지 않은 인증 토큰입니다.' },
        { status: 401 }
      );
    }
    
    const userId = decodedToken.user_id;
    
    // 실제 환경에서는 데이터베이스에서 사용자가 참여 중인 공구 조회
    // 여기서는 예시 데이터 사용
    const mockParticipatingGroupBuys = [
      {
        id: 1,
        title: '삼성 갤럭시 S24 공동구매',
        description: '갤럭시 S24 울트라 256GB 공동구매',
        status: 'recruiting',
        current_participants: 3,
        min_participants: 2,
        max_participants: 5,
        start_time: new Date('2025-04-01').toISOString(),
        end_time: new Date('2025-04-30').toISOString(),
        product: 1,
        product_detail: {
          id: 1,
          name: '삼성 갤럭시 S24 울트라',
          description: '최신 갤럭시 S24 울트라 256GB',
          base_price: 1200000,
          image_url: '/placeholder.png',
          category_name: '스마트폰',
          carrier: 'SK텔레콤',
          registration_type: '번호이동',
          plan_info: '5만원대',
          contract_info: '2년 약정',
          total_support_amount: 550000,
          release_date: '2024년 1월'
        },
        participation_info: {
          joined_at: new Date('2025-04-05').toISOString(),
          status: 'active'
        }
      },
      {
        id: 2,
        title: '아이폰 15 Pro 공동구매',
        description: '아이폰 15 Pro 256GB 공동구매',
        status: 'recruiting',
        current_participants: 2,
        min_participants: 2,
        max_participants: 5,
        start_time: new Date('2025-04-01').toISOString(),
        end_time: new Date('2025-03-30').toISOString(), // 이미 종료된 공구
        product: 2,
        product_detail: {
          id: 2,
          name: '아이폰 15 Pro',
          description: '최신 아이폰 15 Pro 256GB',
          base_price: 1500000,
          image_url: '/placeholder.png',
          category_name: '스마트폰',
          carrier: 'KT',
          registration_type: '번호이동',
          plan_info: '8만원대',
          contract_info: '2년 약정',
          total_support_amount: 650000,
          release_date: '2023년 9월'
        },
        participation_info: {
          joined_at: new Date('2025-03-15').toISOString(),
          status: 'active'
        }
      }
    ];

    // 상태 계산 및 업데이트
    const updatedGroupBuys = mockParticipatingGroupBuys.map(groupBuy => {
      const calculatedStatus = calculateGroupBuyStatus(groupBuy.status, groupBuy.end_time);
      return {
        ...groupBuy,
        status: calculatedStatus,
        calculated_status: calculatedStatus // 계산된 상태 추가
      };
    });

    return NextResponse.json(updatedGroupBuys);
  } catch (error) {
    console.error('Error fetching participating group buys:', error);
    return NextResponse.json(
      { error: '참여 중인 공동구매 목록을 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
