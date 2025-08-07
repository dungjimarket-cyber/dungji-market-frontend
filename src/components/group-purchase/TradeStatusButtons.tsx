'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Phone, AlertTriangle, Package, Users, Info } from 'lucide-react';

interface TradeStatusButtonsProps {
  status: string;
  userRole: 'buyer' | 'seller';
  groupBuyId: number;
  myDecision?: 'pending' | 'confirmed' | 'cancelled';
  participantCount?: number;
  confirmedCount?: number;
  onContactInfo?: () => void;
  onFinalSelection?: (decision: 'confirm' | 'cancel') => void;
  onComplete?: () => void;
  onViewConfirmedCount?: () => void;
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
  participantCount,
  confirmedCount,
  onContactInfo,
  onFinalSelection,
  onComplete,
  onViewConfirmedCount
}: TradeStatusButtonsProps) {
  const router = useRouter();
  
  const confirmRate = participantCount && confirmedCount 
    ? Math.round((confirmedCount / participantCount) * 100)
    : 0;

  // 구매자 버튼 렌더링
  if (userRole === 'buyer') {
    switch (status) {
      case 'final_selection_buyers':
        if (myDecision === 'pending') {
          return (
            <div className="space-y-3">
              <Button
                onClick={() => onFinalSelection?.('confirm')}
                className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                구매확정
              </Button>
              <Button
                onClick={() => onFinalSelection?.('cancel')}
                variant="outline"
                className="w-full py-4 text-base font-medium border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-5 w-5 mr-2" />
                구매포기
              </Button>
            </div>
          );
        } else if (myDecision === 'confirmed') {
          return (
            <Button
              disabled
              className="w-full py-4 text-base font-medium bg-green-100 text-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              구매확정 완료
            </Button>
          );
        } else {
          return (
            <Button
              disabled
              className="w-full py-4 text-base font-medium bg-gray-100 text-gray-500"
            >
              <XCircle className="h-5 w-5 mr-2" />
              구매포기 완료
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
          <div className="space-y-3">
            <Button
              onClick={onContactInfo}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              판매자 정보보기
            </Button>
            <Button
              onClick={() => router.push(`/noshow-report/create?groupbuy_id=${groupBuyId}`)}
              variant="outline"
              className="w-full py-3 text-orange-600 border-orange-500 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              노쇼신고하기
            </Button>
            <Button
              onClick={onComplete}
              className="w-full py-3 bg-green-600 hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-2" />
              구매완료
            </Button>
          </div>
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
            <div className="space-y-3">
              {participantCount !== undefined && confirmedCount !== undefined && (
                <Button
                  onClick={onViewConfirmedCount}
                  variant="outline"
                  className="w-full py-3"
                >
                  <Users className="h-4 w-4 mr-2" />
                  구매확정 인원 보기
                  {confirmRate > 0 && (
                    <Badge className={`ml-2 ${confirmRate <= 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {confirmRate}%
                    </Badge>
                  )}
                </Button>
              )}
              <Button
                onClick={() => onFinalSelection?.('confirm')}
                className="w-full py-4 text-base font-medium bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                판매확정
              </Button>
              <Button
                onClick={() => onFinalSelection?.('cancel')}
                variant="outline"
                className="w-full py-4 text-base font-medium border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-5 w-5 mr-2" />
                판매포기
              </Button>
            </div>
          );
        } else if (myDecision === 'confirmed') {
          return (
            <Button
              disabled
              className="w-full py-4 text-base font-medium bg-green-100 text-green-700"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              판매확정 완료
            </Button>
          );
        } else {
          return (
            <Button
              disabled
              className="w-full py-4 text-base font-medium bg-gray-100 text-gray-500"
            >
              <XCircle className="h-5 w-5 mr-2" />
              판매포기 완료
            </Button>
          );
        }

      case 'in_progress':
        return (
          <div className="space-y-3">
            <Button
              onClick={onContactInfo}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              구매자 정보보기
            </Button>
            <Button
              onClick={() => router.push(`/noshow-report/create?groupbuy_id=${groupBuyId}`)}
              variant="outline"
              className="w-full py-3 text-orange-600 border-orange-500 hover:bg-orange-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              노쇼신고하기
            </Button>
            <Button
              onClick={onComplete}
              className="w-full py-3 bg-green-600 hover:bg-green-700"
            >
              <Package className="h-4 w-4 mr-2" />
              판매완료
            </Button>
          </div>
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