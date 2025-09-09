/**
 * 중고폰 제안 개별 API
 * PUT /api/used/offers/[id] - 제안 수락/거절/취소
 * DELETE /api/used/offers/[id] - 제안 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// 제안 응답 스키마
const respondOfferSchema = z.object({
  action: z.enum(['accept', 'reject', 'cancel']),
  message: z.string().max(200).optional(),
});

// PUT: 제안 수락/거절/취소
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = parseInt(params.id);
    
    if (isNaN(offerId)) {
      return NextResponse.json(
        { error: '잘못된 제안 ID입니다.' },
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

    // 요청 본문 파싱
    const body = await request.json();
    
    // 유효성 검증
    const validationResult = respondOfferSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '입력값이 올바르지 않습니다.',
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }

    const { action, message } = validationResult.data;
    const userId = parseInt(session.user.id || '0');

    // TODO: DB에서 제안 정보 조회
    const offer = {
      id: offerId,
      phoneId: 1,
      userId: 10, // 제안한 사용자
      offeredPrice: 1050000,
      status: 'pending',
      phone: {
        id: 1,
        userId: userId, // 판매자 (현재 사용자)
        status: 'active'
      }
    };

    // 권한 확인
    if (action === 'cancel') {
      // 취소는 제안한 사람만 가능
      if (offer.userId !== userId) {
        return NextResponse.json(
          { error: '취소 권한이 없습니다.' },
          { status: 403 }
        );
      }
    } else {
      // 수락/거절은 판매자만 가능
      if (offer.phone.userId !== userId) {
        return NextResponse.json(
          { error: '응답 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 상태 확인
    if (offer.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 제안입니다.' },
        { status: 400 }
      );
    }

    // 수락 처리
    if (action === 'accept') {
      // TODO: 트랜잭션으로 처리
      // 1. 제안 상태 변경 (accepted)
      // 2. 다른 제안들 자동 거절
      // 3. 상품 상태 변경 (reserved)
      // 4. 거래 생성
      // 5. 구매자에게 알림 발송

      // 프로시저 호출 예시
      // CALL sp_accept_offer(offerId, userId);

      return NextResponse.json({
        success: true,
        message: '제안을 수락했습니다. 거래가 시작됩니다.',
        data: {
          offerId: offerId,
          status: 'accepted',
          transactionId: Date.now() // 생성된 거래 ID
        }
      });
    }

    // 거절 처리
    if (action === 'reject') {
      // TODO: DB 업데이트
      // UPDATE used_offers SET status = 'rejected', responded_at = NOW() WHERE id = ?
      
      // 구매자에게 알림
      // INSERT INTO used_notifications ...

      return NextResponse.json({
        success: true,
        message: '제안을 거절했습니다.',
        data: {
          offerId: offerId,
          status: 'rejected'
        }
      });
    }

    // 취소 처리
    if (action === 'cancel') {
      // TODO: DB 업데이트
      // UPDATE used_offers SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?

      return NextResponse.json({
        success: true,
        message: '제안을 취소했습니다.',
        data: {
          offerId: offerId,
          status: 'cancelled'
        }
      });
    }

  } catch (error) {
    console.error('PUT /api/used/offers/[id] error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 제안 삭제 (취소된 제안만 삭제 가능)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const offerId = parseInt(params.id);
    
    if (isNaN(offerId)) {
      return NextResponse.json(
        { error: '잘못된 제안 ID입니다.' },
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

    const userId = parseInt(session.user.id || '0');

    // TODO: DB에서 제안 조회
    const offer = {
      id: offerId,
      userId: userId,
      status: 'cancelled'
    };

    // 소유자 확인
    if (offer.userId !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 삭제 가능 상태 확인
    if (offer.status !== 'cancelled' && offer.status !== 'rejected') {
      return NextResponse.json(
        { error: '취소되거나 거절된 제안만 삭제할 수 있습니다.' },
        { status: 400 }
      );
    }

    // TODO: DB 삭제
    // DELETE FROM used_offers WHERE id = ? AND user_id = ?

    return NextResponse.json({
      success: true,
      message: '제안이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('DELETE /api/used/offers/[id] error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}