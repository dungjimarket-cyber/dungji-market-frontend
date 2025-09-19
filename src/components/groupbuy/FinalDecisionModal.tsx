'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface FinalDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupBuyId: number;
  groupBuyTitle: string;
  onDecisionComplete?: () => void;
}

export function FinalDecisionModal({
  isOpen,
  onClose,
  groupBuyId,
  groupBuyTitle,
  onDecisionComplete
}: FinalDecisionModalProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentDecision, setCurrentDecision] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // 현재 최종선택 상태 조회
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchDecisionStatus();
    }
  }, [isOpen, accessToken]);

  // 남은 시간 계산 타이머
  useEffect(() => {
    if (!deadline) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('시간 종료');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const fetchDecisionStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/decision-status/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentDecision(data.decision);
        if (data.deadline) {
          setDeadline(new Date(data.deadline));
        }
      }
    } catch (error) {
      console.error('최종선택 상태 조회 실패:', error);
    }
  };

  const handleDecision = async (decision: 'confirmed' | 'cancelled') => {
    if (!user || !accessToken) return;

    const confirmMessage = decision === 'confirmed'
      ? isSeller
        ? `선정된 금액으로 최종 판매확정 하시겠습니까?\n\n판매 확정 후에는 취소할 수 없습니다.`
        : `선정된 금액으로 최종 구매확정 하시겠습니까?\n\n구매 확정 후에는 취소할 수 없습니다.`
      : isSeller
        ? `정말 판매를 포기하시겠습니까?\n\n판매 포기 후에는 취소할 수 없습니다.`
        : `정말 구매를 포기하시겠습니까?\n\n구매 포기 후에는 취소할 수 없습니다.`;

    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const endpoint = user.role === 'seller' 
        ? `seller-decision` 
        : `buyer-decision`;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/${endpoint}/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ decision })
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('최종선택이 완료되었습니다.');
        setCurrentDecision(decision);
        if (onDecisionComplete) {
          onDecisionComplete();
        }
        onClose();
      } else {
        toast.error(data.error || '최종선택 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('최종선택 오류:', error);
      toast.error('최종선택 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getDecisionDisplay = () => {
    switch (currentDecision) {
      case 'confirmed':
        return user?.role === 'seller' ? '판매확정' : '구매확정';
      case 'cancelled':
        return user?.role === 'seller' ? '판매포기' : '구매포기';
      default:
        return '대기중';
    }
  };

  const isBuyer = user?.role === 'buyer';
  const isSeller = user?.role === 'seller';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">최종선택</DialogTitle>
          <DialogDescription>
            {groupBuyTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 남은 시간 표시 */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">남은 시간: {timeLeft || '계산중...'}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              제한 시간 내에 최종선택을 완료해주세요.
            </p>
          </div>

          {/* 현재 상태 표시 */}
          {currentDecision && currentDecision !== 'pending' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">현재 선택:</p>
              <p className="font-medium text-lg">{getDecisionDisplay()}</p>
            </div>
          )}

          {/* 선택 버튼 */}
          {(!currentDecision || currentDecision === 'pending') && (
            <div className="space-y-3">
              <Button
                onClick={() => handleDecision('confirmed')}
                disabled={loading}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isSeller ? '판매확정' : '구매확정'}
              </Button>

              <Button
                onClick={() => handleDecision('cancelled')}
                disabled={loading}
                variant="outline"
                className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-5 h-5 mr-2" />
                {isSeller ? '판매포기' : '구매포기'}
              </Button>

              {isSeller && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-600">
                      <p className="font-medium">주의사항</p>
                      <p>판매포기 시 패널티 10점이 부과됩니다.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">안내사항</p>
              <ul className="list-disc list-inside space-y-1">
                <li>최종선택 후에는 변경할 수 없습니다.</li>
                <li>{isSeller ? '판매' : '구매'}확정 시 상대방의 연락처를 확인할 수 있습니다.</li>
                <li>제한시간 내에 선택하지 않으면 자동으로 포기 처리됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}