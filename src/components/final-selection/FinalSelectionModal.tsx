'use client';

import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';

interface FinalSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  role: 'buyer' | 'seller';
  decision: 'confirmed' | 'cancelled';
  bidAmount?: number;
  participantCount?: number;
}

export default function FinalSelectionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false,
  role,
  decision,
  bidAmount,
  participantCount = 0
}: FinalSelectionModalProps) {
  
  const getModalContent = () => {
    if (role === 'buyer') {
      if (decision === 'confirmed') {
        return {
          title: '구매확정',
          content: (
            <div className="space-y-3">
              {bidAmount && (
                <div className="text-sm">
                  최종낙찰된 지원금액: <span className="font-bold">{formatNumberWithCommas(bidAmount)}원</span>
                </div>
              )}
              <p className="font-medium">낙찰된 금액으로 공동구매를 최종 진행하시겠습니까?</p>
              <p className="text-sm text-gray-600">(구매를 확정하시면 판매자 정보를 열람하실 수 있습니다)</p>
            </div>
          ),
          confirmText: '네 구매할게요',
          cancelText: '고민해 볼게요'
        };
      } else {
        return {
          title: '구매포기',
          content: (
            <div className="space-y-3">
              <p className="font-medium">공동구매 진행을 포기하시겠습니까?</p>
            </div>
          ),
          confirmText: '네 포기할게요',
          cancelText: '고민해 볼게요'
        };
      }
    } else {
      if (decision === 'confirmed') {
        return {
          title: '판매확정',
          content: (
            <div className="space-y-3">
              <p className="font-medium">낙찰받은 견적 그대로 책임 하에 판매하시겠습니까?</p>
              <p className="text-sm text-gray-600">(판매를 확정하시면 구매자 리스트를 제공해 드립니다)</p>
            </div>
          ),
          confirmText: '네 판매할게요',
          cancelText: '고민해 볼게요'
        };
      } else {
        return {
          title: '판매포기',
          content: (
            <div className="space-y-3">
              <p className="font-medium">판매 포기시 패널티가 부과될 수 있습니다.</p>
              <p className="font-medium">포기하시겠습니까?</p>
              {participantCount <= 1 && (
                <p className="text-sm text-blue-600 mt-2">(구매자가 1명 이하일 경우 패널티는 부과되지 않습니다)</p>
              )}
            </div>
          ),
          confirmText: '네 포기할게요',
          cancelText: '고민해 볼게요'
        };
      }
    }
  };

  const modalContent = getModalContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{modalContent.title}</DialogTitle>
          <DialogDescription className="sr-only">
            {modalContent.title} 확인 팝업
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {modalContent.content}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {modalContent.cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${
              decision === 'confirmed' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리중...
              </>
            ) : (
              modalContent.confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}