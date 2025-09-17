/**
 * 중고폰 상품 API
 * GET /api/used/phones - 상품 목록 조회
 * POST /api/used/phones - 상품 등록
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// 상품 등록 스키마
const createPhoneSchema = z.object({
  brand: z.enum(['samsung', 'apple', 'lg', 'xiaomi', 'other']),
  series: z.string().optional(),
  model: z.string().min(1, '모델명을 입력해주세요'),
  storage: z.number().optional(),
  color: z.string().optional(),
  conditionGrade: z.enum(['A', 'B', 'C']),
  batteryStatus: z.enum(['85+', '80-85', 'under', 'unknown']).optional(),
  purchasePeriod: z.enum(['1', '3', '6', '12', 'over']).optional(),
  manufactureDate: z.string().optional(),
  price: z.number().min(10000, '최소 가격은 10,000원입니다'),
  acceptOffers: z.boolean().default(true),
  minOfferPrice: z.number().optional(),
  accessories: z.array(z.string()).optional(),
  tradeLocation: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).min(1, '최소 1장의 이미지가 필요합니다'),
});

// GET: 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const condition = searchParams.get('condition');
    const sido = searchParams.get('sido');
    const sigungu = searchParams.get('sigungu');
    const acceptOffers = searchParams.get('acceptOffers');
    const sortBy = searchParams.get('sortBy') || 'latest';

    // TODO: 실제 DB 쿼리 구현
    // 임시 목업 데이터
    const mockData = {
      items: [
        {
          id: 1,
          userId: 1,
          brand: 'samsung',
          series: 'Galaxy S',
          model: 'Galaxy S24 Ultra',
          storage: 512,
          color: '티타늄 블랙',
          conditionGrade: 'A',
          batteryStatus: '85+',
          price: 1100000,
          acceptOffers: true,
          tradeLocation: '강남역',
          sido: '서울특별시',
          sigungu: '강남구',
          status: 'active',
          viewCount: 152,
          offerCount: 3,
          images: [
            { url: '/uploads/sample1.jpg', order: 0 }
          ],
          seller: {
            id: 1,
            name: '김철수',
            tradeStats: {
              soldCount: 5,
              avgSellerRating: 4.8
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          userId: 2,
          brand: 'apple',
          series: 'iPhone',
          model: 'iPhone 15 Pro Max',
          storage: 256,
          color: '내추럴 티타늄',
          conditionGrade: 'A',
          batteryStatus: '85+',
          price: 1450000,
          acceptOffers: true,
          tradeLocation: '홍대입구역',
          sido: '서울특별시',
          sigungu: '마포구',
          status: 'active',
          viewCount: 198,
          offerCount: 5,
          images: [
            { url: '/uploads/sample2.jpg', order: 0 }
          ],
          seller: {
            id: 2,
            name: '이영희',
            tradeStats: {
              soldCount: 3,
              avgSellerRating: 4.5
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      totalCount: 2,
      page: page,
      limit: limit,
      totalPages: 1,
      hasMore: false
    };

    return NextResponse.json(mockData);

  } catch (error) {
    console.error('GET /api/used/phones error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 상품 등록
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
    const validationResult = createPhoneSchema.safeParse(body);
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

    // 일일 등록 제한 체크
    // TODO: 실제 DB에서 체크
    const dailyLimit = 10;
    const todayPostCount = 0; // DB에서 조회
    
    if (todayPostCount >= dailyLimit) {
      return NextResponse.json(
        { error: `일일 등록 제한(${dailyLimit}개)을 초과했습니다.` },
        { status: 429 }
      );
    }

    // TODO: 실제 DB 저장 구현
    // 임시 응답
    const newPhone = {
      id: Date.now(),
      ...data,
      userId: parseInt(session.user.id || '1'),
      status: 'active',
      viewCount: 0,
      offerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newPhone
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/used/phones error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}