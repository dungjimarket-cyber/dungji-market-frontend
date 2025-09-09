/**
 * 중고폰 상품 개별 API
 * GET /api/used/phones/[id] - 상품 상세 조회
 * PUT /api/used/phones/[id] - 상품 수정
 * DELETE /api/used/phones/[id] - 상품 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// 상품 수정 스키마
const updatePhoneSchema = z.object({
  brand: z.enum(['samsung', 'apple', 'lg', 'xiaomi', 'other']).optional(),
  series: z.string().optional(),
  model: z.string().optional(),
  storage: z.number().optional(),
  color: z.string().optional(),
  conditionGrade: z.enum(['A', 'B', 'C']).optional(),
  batteryStatus: z.enum(['85+', '80-85', 'under', 'unknown']).optional(),
  purchasePeriod: z.enum(['1', '3', '6', '12', 'over']).optional(),
  manufactureDate: z.string().optional(),
  price: z.number().min(10000).optional(),
  acceptOffers: z.boolean().optional(),
  minOfferPrice: z.number().optional(),
  accessories: z.array(z.string()).optional(),
  tradeLocation: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['active', 'reserved', 'sold']).optional(),
});

// GET: 상품 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phoneId = parseInt(id);
    
    if (isNaN(phoneId)) {
      return NextResponse.json(
        { error: '잘못된 상품 ID입니다.' },
        { status: 400 }
      );
    }

    // 조회수 증가 (세션 기반 중복 방지)
    // TODO: Redis나 세션으로 중복 조회 방지

    // TODO: 실제 DB 조회 구현
    // 임시 목업 데이터
    const mockPhone = {
      id: phoneId,
      userId: 1,
      brand: 'samsung',
      series: 'Galaxy S',
      model: 'Galaxy S24 Ultra',
      storage: 512,
      color: '티타늄 블랙',
      conditionGrade: 'A',
      batteryStatus: '85+',
      purchasePeriod: '3',
      manufactureDate: '2024-01',
      price: 1100000,
      acceptOffers: true,
      minOfferPrice: 1000000,
      accessories: ['charger', 'box', 'case'],
      tradeLocation: '강남역 11번 출구',
      description: '3개월 사용한 S24 울트라입니다. 상태 매우 깨끗합니다.',
      sido: '서울특별시',
      sigungu: '강남구',
      status: 'active',
      viewCount: 153, // 조회수 +1
      offerCount: 3,
      images: [
        { id: 1, url: '/uploads/sample1.jpg', order: 0 },
        { id: 2, url: '/uploads/sample2.jpg', order: 1 }
      ],
      seller: {
        id: 1,
        name: '김철수',
        phone: '010-****-5678',
        sido: '서울특별시',
        sigungu: '강남구',
        tradeStats: {
          totalListings: 10,
          soldCount: 5,
          avgSellerRating: 4.8
        }
      },
      offers: [
        {
          id: 1,
          userId: 10,
          offeredPrice: 1050000,
          message: '오늘 바로 거래 가능합니다.',
          status: 'pending',
          buyer: { id: 10, name: '구매희망자1' },
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 현재 사용자가 찜했는지 확인
    const session = await getServerSession();
    const phoneWithFavorite = {
      ...mockPhone,
      isFavorite: session?.user ? false : undefined // TODO: DB에서 찜 여부 확인
    };

    return NextResponse.json(phoneWithFavorite);

  } catch (error) {
    console.error('GET /api/used/phones/[id] error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 상품 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phoneId = parseInt(id);
    
    if (isNaN(phoneId)) {
      return NextResponse.json(
        { error: '잘못된 상품 ID입니다.' },
        { status: 400 }
      );
    }

    // 인증 확인
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // TODO: DB에서 상품 조회 및 소유자 확인
    const ownerId = 1; // DB에서 조회
    const currentUserId = parseInt(session.user.id || '0');
    
    if (ownerId !== currentUserId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json();
    
    // 유효성 검증
    const validationResult = updatePhoneSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '입력값이 올바르지 않습니다.',
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 상태 변경 시 제약 확인
    if (data.status === 'sold') {
      // TODO: 진행 중인 거래가 있는지 확인
      const hasActiveTransaction = false; // DB 조회
      if (!hasActiveTransaction) {
        return NextResponse.json(
          { error: '진행 중인 거래가 없습니다.' },
          { status: 400 }
        );
      }
    }

    // TODO: 실제 DB 업데이트 구현
    const updatedPhone = {
      id: phoneId,
      ...data,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedPhone
    });

  } catch (error) {
    console.error('PUT /api/used/phones/[id] error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 상품 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const phoneId = parseInt(id);
    
    if (isNaN(phoneId)) {
      return NextResponse.json(
        { error: '잘못된 상품 ID입니다.' },
        { status: 400 }
      );
    }

    // 인증 확인
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // TODO: DB에서 상품 조회 및 소유자 확인
    const ownerId = 1; // DB에서 조회
    const currentUserId = parseInt(session.user.id || '0');
    
    if (ownerId !== currentUserId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 삭제 가능 여부 확인
    // TODO: DB에서 상태 확인
    const phoneStatus = 'active'; // DB 조회
    const hasOffers = false; // DB 조회
    
    if (phoneStatus !== 'active') {
      return NextResponse.json(
        { error: '예약 중이거나 판매 완료된 상품은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (hasOffers) {
      return NextResponse.json(
        { error: '제안이 있는 상품은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 삭제 구현 (소프트 삭제)
    // UPDATE used_phones SET status = 'deleted', deleted_at = NOW() WHERE id = ?

    return NextResponse.json({
      success: true,
      message: '상품이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('DELETE /api/used/phones/[id] error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}