/**
 * 중고폰 찜하기 API
 * GET /api/used/favorites - 찜 목록 조회
 * POST /api/used/favorites - 찜하기
 * DELETE /api/used/favorites?phoneId=1 - 찜 해제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// 찜하기 스키마
const favoriteSchema = z.object({
  phoneId: z.number().positive('유효한 상품 ID가 필요합니다'),
});

// GET: 찜 목록 조회
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const userId = parseInt(session.user.id || '0');

    // TODO: 실제 DB 쿼리 구현
    const mockFavorites = [
      {
        phoneId: 1,
        phone: {
          id: 1,
          brand: 'samsung',
          model: 'Galaxy S24 Ultra',
          storage: 512,
          color: '티타늄 블랙',
          conditionGrade: 'A',
          price: 1100000,
          status: 'active',
          images: [{ url: '/uploads/sample1.jpg' }],
          seller: {
            id: 2,
            name: '김철수',
            sido: '서울특별시',
            sigungu: '강남구'
          }
        },
        createdAt: new Date().toISOString()
      },
      {
        phoneId: 3,
        phone: {
          id: 3,
          brand: 'apple',
          model: 'iPhone 15 Pro',
          storage: 256,
          color: '내추럴 티타늄',
          conditionGrade: 'A',
          price: 1200000,
          status: 'active',
          images: [{ url: '/uploads/sample3.jpg' }],
          seller: {
            id: 3,
            name: '이영희',
            sido: '서울특별시',
            sigungu: '마포구'
          }
        },
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      items: mockFavorites,
      totalCount: mockFavorites.length,
      page: page,
      limit: limit,
      totalPages: 1,
      hasMore: false
    });

  } catch (error) {
    console.error('GET /api/used/favorites error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 찜하기
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
    const validationResult = favoriteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '입력값이 올바르지 않습니다.',
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }

    const { phoneId } = validationResult.data;
    const userId = parseInt(session.user.id || '0');

    // TODO: DB에서 상품 존재 여부 확인
    const phoneExists = true; // DB 조회
    if (!phoneExists) {
      return NextResponse.json(
        { error: '존재하지 않는 상품입니다.' },
        { status: 404 }
      );
    }

    // TODO: 자기 상품 찜하기 방지
    const phoneOwnerId = 2; // DB 조회
    if (phoneOwnerId === userId) {
      return NextResponse.json(
        { error: '본인의 상품은 찜할 수 없습니다.' },
        { status: 400 }
      );
    }

    // TODO: 중복 찜 체크
    const alreadyFavorited = false; // DB 조회
    if (alreadyFavorited) {
      return NextResponse.json(
        { error: '이미 찜한 상품입니다.' },
        { status: 400 }
      );
    }

    // TODO: DB 저장
    // INSERT INTO used_favorites (user_id, phone_id) VALUES (?, ?)

    return NextResponse.json({
      success: true,
      message: '찜 목록에 추가되었습니다.',
      data: {
        userId: userId,
        phoneId: phoneId,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/used/favorites error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 찜 해제
export async function DELETE(request: NextRequest) {
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
    const phoneId = searchParams.get('phoneId');
    
    if (!phoneId || isNaN(parseInt(phoneId))) {
      return NextResponse.json(
        { error: '유효한 상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id || '0');
    const phoneIdNum = parseInt(phoneId);

    // TODO: DB에서 찜 여부 확인
    const favoriteExists = true; // DB 조회
    if (!favoriteExists) {
      return NextResponse.json(
        { error: '찜하지 않은 상품입니다.' },
        { status: 404 }
      );
    }

    // TODO: DB 삭제
    // DELETE FROM used_favorites WHERE user_id = ? AND phone_id = ?

    return NextResponse.json({
      success: true,
      message: '찜 목록에서 제거되었습니다.'
    });

  } catch (error) {
    console.error('DELETE /api/used/favorites error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}