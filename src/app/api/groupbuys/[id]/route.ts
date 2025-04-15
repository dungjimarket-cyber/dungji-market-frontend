import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

// Next.js 15에서 params는 Promise 타입이 되었습니다
type Params = Promise<{ id: string }>;

// 특정 공구 정보 가져오기
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // params는 Promise이미로 await 필요
    const paramsData = await params;
    const id = paramsData.id;
    
    // 실제 환경에서는 데이터베이스에서 ID로 조회
    // 여기서는 예시 데이터 사용
    const mockGroupBuy = {
      id: parseInt(id),
      title: `공동구매 #${id}`,
      description: `공동구매 #${id} 상세 설명`,
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
      }
    };

    // 상태 계산 및 업데이트
    const calculatedStatus = calculateGroupBuyStatus(mockGroupBuy.status, mockGroupBuy.end_time);
    const updatedGroupBuy = {
      ...mockGroupBuy,
      status: calculatedStatus,
      calculated_status: calculatedStatus // 계산된 상태 추가
    };

    return NextResponse.json(updatedGroupBuy);
  } catch (error) {
    console.error('Error fetching group buy:', error);
    return NextResponse.json(
      { error: '공동구매 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 공구 정보 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: Params }
) {
  // try 블록 밖에서 변수 선언
  let id: string;
  
  try {
    // params는 Promise이미로 await 필요
    const paramsData = await params;
    id = paramsData.id;
    
    const session = await getServerSession(authOptions);
    
    // 인증 확인
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 이미 id 변수가 선언되어 있으므로 사용만 함
    const data = await request.json();
    
    // 실제 환경에서는 데이터베이스에서 업데이트
    // 여기서는 성공 응답만 반환
    return NextResponse.json({
      id: parseInt(id),
      ...data,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating group buy:', error);
    return NextResponse.json(
      { error: '공동구매 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
