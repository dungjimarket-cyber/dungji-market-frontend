/**
 * 중고폰 제안 API
 * GET /api/used/offers - 제안 목록 조회 (받은/보낸 제안)
 * POST /api/used/offers - 제안하기
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// 제안 생성 스키마
const createOfferSchema = z.object({
  phoneId: z.number().positive('유효한 상품 ID가 필요합니다'),
  offeredPrice: z.number().min(10000, '최소 제안 가격은 10,000원입니다'),
  message: z.string().max(200, '메시지는 200자 이내로 입력해주세요').optional(),
});

// GET: 제안 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sent'; // sent(보낸), received(받은)
    const status = searchParams.get('status'); // pending, accepted, rejected, cancelled
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const userId = parseInt(session.user.id || '0');

    // TODO: 실제 DB 쿼리 구현
    let mockOffers = [];

    if (type === 'sent') {
      // 내가 보낸 제안
      mockOffers = [
        {
          id: 1,
          phoneId: 1,
          userId: userId,
          offeredPrice: 1050000,
          message: '오늘 바로 거래 가능합니다.',
          status: 'pending',
          phone: {
            id: 1,
            model: 'Galaxy S24 Ultra',
            price: 1100000,
            images: [{ url: '/uploads/sample1.jpg' }],
            seller: { id: 2, name: '판매자' }
          },
          createdAt: new Date().toISOString()
        }
      ];
    } else {
      // 내가 받은 제안 (내 상품에 대한 제안)
      mockOffers = [
        {
          id: 2,
          phoneId: 2,
          userId: 10,
          offeredPrice: 950000,
          message: '깨끗하게 사용하겠습니다.',
          status: 'pending',
          buyer: {
            id: 10,
            name: '구매희망자',
            tradeStats: {
              purchaseCount: 3,
              avgBuyerRating: 4.7
            }
          },
          phone: {
            id: 2,
            model: 'iPhone 15 Pro',
            price: 1000000,
            images: [{ url: '/uploads/sample2.jpg' }]
          },
          createdAt: new Date().toISOString()
        }
      ];
    }

    // 상태 필터링
    if (status) {
      mockOffers = mockOffers.filter(offer => offer.status === status);
    }

    return NextResponse.json({
      items: mockOffers,
      totalCount: mockOffers.length,
      page: page,
      limit: limit,
      totalPages: 1,
      hasMore: false
    });

  } catch (error) {
    console.error('GET /api/used/offers error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 제안하기
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 유효성 검증
    const validationResult = createOfferSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '입력값이 올바르지 않습니다.',
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }

    const { phoneId, offeredPrice, message } = validationResult.data;
    const userId = parseInt(session.user.id || '0');

    // TODO: DB에서 상품 정보 조회
    const phone = {
      id: phoneId,
      userId: 2, // 판매자 ID
      price: 1100000,
      minOfferPrice: 1000000,
      acceptOffers: true,
      status: 'active'
    };

    // 자기 상품에 제안 불가
    if (phone.userId === userId) {
      return NextResponse.json(
        { error: '본인의 상품에는 제안할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 상품 상태 확인
    if (phone.status !== 'active') {
      return NextResponse.json(
        { error: '제안할 수 없는 상품입니다.' },
        { status: 400 }
      );
    }

    // 제안 받기 여부 확인
    if (!phone.acceptOffers) {
      return NextResponse.json(
        { error: '이 상품은 제안을 받지 않습니다.' },
        { status: 400 }
      );
    }

    // 최소 제안 가격 확인
    if (phone.minOfferPrice && offeredPrice < phone.minOfferPrice) {
      return NextResponse.json(
        { error: `최소 제안 가격은 ${phone.minOfferPrice.toLocaleString()}원입니다.` },
        { status: 400 }
      );
    }

    // 일일 제안 제한 체크
    // TODO: DB에서 오늘 제안 수 체크
    const dailyOfferLimit = 30;
    const todayOfferCount = 0; // DB 조회
    
    if (todayOfferCount >= dailyOfferLimit) {
      return NextResponse.json(
        { error: `일일 제안 제한(${dailyOfferLimit}개)을 초과했습니다.` },
        { status: 429 }
      );
    }

    // 중복 제안 체크
    // TODO: DB에서 기존 제안 체크
    const existingOffer = false; // DB 조회
    
    if (existingOffer) {
      return NextResponse.json(
        { error: '이미 제안한 상품입니다. 기존 제안을 취소 후 다시 제안해주세요.' },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 저장 구현
    const newOffer = {
      id: Date.now(),
      phoneId: phoneId,
      userId: userId,
      offeredPrice: offeredPrice,
      message: message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // TODO: 판매자에게 알림 발송
    // INSERT INTO used_notifications ...

    return NextResponse.json({
      success: true,
      data: newOffer,
      message: '제안이 전송되었습니다.'
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/used/offers error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}