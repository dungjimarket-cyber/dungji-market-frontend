'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface TradeStatusButtonsProps {
  status: string;
  userRole: 'buyer' | 'seller';
  groupBuyId: number;
  myDecision?: 'pending' | 'confirmed' | 'cancelled';
  onContactInfo?: () => void;
  onFinalSelection?: (decision: 'confirm' | 'cancel') => void;
  onComplete?: () => void;
}

/**
 * 거래 상태별 버튼 컴포넌트
 * 구매자와 판매자의 거래 상태에 따라 일관된 버튼 UI를 제공
 */
export function TradeStatusButtons({
  status,
  userRole,
  groupBuyId,
  myDecision = 'pending',
  onContactInfo,
  onFinalSelection,
  onComplete
}: TradeStatusButtonsProps) {
  const router = useRouter();

  // 구매자 버튼 렌더링
  if (userRole === 'buyer') {
    switch (status) {
      case 'final_selection_buyers':
        if (myDecision === 'pending') {
          return (
            <>
              <Button
                onClick={() => onFinalSelection?.('confirm')}
                className="w-full py-4 text-base font-medium bg-green-600 hover:bg-green-700"
              >
                구매확정
              </Button>
              <Button
                onClick={() => onFinalSelection?.('cancel')}
                variant="outline"
                className="w-full py-4 text-base font-medium border-red-600 text-red-600 hover:bg-red-50"
              >
                구매포기
              </Button>
            </>
          );
        } else {
          return (
            <Button
              disabled
              className="w-full py-4 text-base font-medium"
            >
              {myDecision === 'confirmed' ? '✓ 구매확정 완료' : '✓ 구매포기 완료'}
            </Button>
          );
        }

      case 'final_selection_seller':
        return (
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="font-semibold text-yellow-800">판매자 최종선택 대기중</p>
          </div>
        );

      case 'in_progress':
        return (
          <>
            <Button
              onClick={onContactInfo}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700"
            >
              판매자정보보기
            </Button>
            <Button
              onClick={onComplete}
              variant="outline"
              className="w-full py-3"
            >
              구매완료
            </Button>
            <Button
              onClick={() => router.push(`/noshow-report/create?groupbuy_id=${groupBuyId}`)}
              variant="outline"
              className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
            >
              노쇼신고
            </Button>
          </>
        );

      case 'completed':
        return (
          <>
            <div className="p-4 bg-purple-50 rounded-lg text-center mb-3">
              <p className="font-semibold text-purple-800">구매완료</p>
            </div>
            <Button
              onClick={() => router.push(`/review/create?groupbuy_id=${groupBuyId}`)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700"
            >
              후기작성
            </Button>
          </>
        );

      default:
        return null;
    }
  }

  // 판매자 버튼 렌더링
  if (userRole === 'seller') {
    switch (status) {
      case 'final_selection_buyers':
        return (
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="font-semibold text-yellow-800">구매자 최종선택 대기중</p>
          </div>
        );

      case 'final_selection_seller':
        if (myDecision === 'pending') {
          return (
            <>
              <Button
                onClick={() => onFinalSelection?.('confirm')}
                className="w-full py-4 text-base font-medium bg-green-600 hover:bg-green-700"
              >
                판매확정
              </Button>
              <Button
                onClick={() => onFinalSelection?.('cancel')}
                variant="outline"
                className="w-full py-4 text-base font-medium border-red-600 text-red-600 hover:bg-red-50"
              >
                판매포기
              </Button>
            </>
          );
        } else {
          return (
            <Button
              disabled
              className="w-full py-4 text-base font-medium"
            >
              {myDecision === 'confirmed' ? '✓ 판매확정 완료' : '✓ 판매포기 완료'}
            </Button>
          );
        }

      case 'in_progress':
        return (
          <>
            <Button
              onClick={onContactInfo}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700"
            >
              구매자정보보기
            </Button>
            <Button
              onClick={onComplete}
              variant="outline"
              className="w-full py-3"
            >
              판매완료
            </Button>
            <Button
              onClick={() => router.push(`/noshow-report/create?groupbuy_id=${groupBuyId}`)}
              variant="outline"
              className="w-full py-3 text-red-600 border-red-300 hover:bg-red-50"
            >
              노쇼신고하기
            </Button>
          </>
        );

      case 'completed':
        return (
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="font-semibold text-purple-800">판매완료</p>
          </div>
        );

      default:
        return null;
    }
  }

  return null;
}