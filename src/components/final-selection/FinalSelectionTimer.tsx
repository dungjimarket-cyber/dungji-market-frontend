'use client';

import { useState, useEffect } from 'react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  getFinalDecisionStatus, 
  submitBuyerFinalDecision, 
  submitSellerFinalDecision,
  type FinalDecisionStatus
} from '@/lib/api/finalSelectionService';
import FinalSelectionModal from './FinalSelectionModal';

interface FinalSelectionTimerProps {
  groupBuyId: number;
  endTime: string;
  onSelectionMade?: () => void;
  bidAmount?: number;
  participantCount?: number;
}


/**
 * 최종선택 타이머 및 결정 버튼 컴포넌트
 */
export function FinalSelectionTimer({ 
  groupBuyId, 
  endTime, 
  onSelectionMade,
  bidAmount,
  participantCount = 0
}: FinalSelectionTimerProps) {
  const { user, accessToken } = useAuth();
  const [status, setStatus] = useState<FinalDecisionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalDecision, setModalDecision] = useState<'confirmed' | 'cancelled'>('confirmed');

  // 사용자의 최종선택 상태 조회
  useEffect(() => {
    const fetchStatus = async () => {
      if (!accessToken) return;

      try {
        const data = await getFinalDecisionStatus(groupBuyId);
        setStatus(data);
      } catch (error) {
        console.error('최종선택 상태 조회 오류:', error);
      }
    };

    fetchStatus();
  }, [groupBuyId, accessToken]);

  // 최종선택 버튼 클릭 핸들러
  const handleDecisionClick = (decision: 'confirmed' | 'cancelled') => {
    setModalDecision(decision);
    setShowModal(true);
  };

  // 최종선택 제출
  const handleDecisionConfirm = async () => {
    if (!accessToken || !status) return;

    setSubmitting(true);
    try {
      const submitFunction = status.role === 'buyer' 
        ? submitBuyerFinalDecision
        : submitSellerFinalDecision;

      const data = await submitFunction(groupBuyId, modalDecision);
      toast.success(data.message || '최종선택이 완료되었습니다.');
      
      // 상태 업데이트
      setStatus(prev => prev ? {
        ...prev,
        decision: modalDecision,
        decision_at: new Date().toISOString()
      } : null);

      setShowModal(false);

      if (onSelectionMade) {
        onSelectionMade();
      }
    } catch (error: any) {
      console.error('최종선택 오류:', error);
      toast.error(error.message || '최종선택 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    toast.warning('최종선택 시간이 만료되었습니다.');
    if (onSelectionMade) {
      onSelectionMade();
    }
  };

  if (!status) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-lg">
          {status.role === 'buyer' ? '구매 최종선택' : '판매 최종선택'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 타이머 */}
        <div className="text-center">
          <CountdownTimer
            endTime={endTime}
            onExpire={handleTimerExpire}
            format="full"
            urgent={180} // 3시간 미만일 때 urgent
          />
        </div>

        {/* 선택 완료 상태 */}
        {status.decision !== 'pending' ? (
          <div className="text-center space-y-2">
            <div className={`text-lg font-medium ${
              status.decision === 'confirmed' 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {status.role === 'buyer' 
                ? (status.decision === 'confirmed' ? '구매확정 완료' : '구매포기 완료')
                : (status.decision === 'confirmed' ? '판매확정 완료' : '판매포기 완료')
              }
            </div>
            {status.decision_at && (
              <div className="text-sm text-gray-500">
                {new Date(status.decision_at).toLocaleString('ko-KR')}
              </div>
            )}
          </div>
        ) : (
          /* 선택 버튼 */
          <div className="space-y-3">
            <div className="text-sm text-gray-700 text-center mb-4">
              최종선택 기간입니다.
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleDecisionClick('confirmed')}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {status.role === 'buyer' ? '구매확정' : '판매확정'}
              </Button>
              
              <Button
                onClick={() => handleDecisionClick('cancelled')}
                disabled={submitting}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {status.role === 'buyer' ? '구매포기' : '판매포기'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* 최종선택 확인 모달 */}
    <FinalSelectionModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onConfirm={handleDecisionConfirm}
      loading={submitting}
      role={status?.role || 'buyer'}
      decision={modalDecision}
      bidAmount={bidAmount}
      participantCount={participantCount}
    />
    </>
  );
}