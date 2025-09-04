'use client';

import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PenaltyInfo {
  is_active?: boolean;
  isActive?: boolean;
  penalty_type?: string;
  type?: string;
  reason: string;
  count: number;
  start_date?: string;
  startDate?: string;
  end_date?: string;
  endDate?: string;
  remaining_hours?: number;
  remainingHours?: number;
  remaining_minutes?: number;
  remainingMinutes?: number;
  remaining_text?: string;
  remainingText?: string;
}

interface PenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  penaltyInfo: PenaltyInfo | null;
  userRole: 'buyer' | 'seller';
}

export default function PenaltyModal({ isOpen, onClose, penaltyInfo, userRole }: PenaltyModalProps) {
  console.log('🔴 PenaltyModal render:', { isOpen, penaltyInfo, userRole });
  
  if (!isOpen) {
    console.log('🔴 PenaltyModal: isOpen이 false라서 렌더링 안함');
    return null;
  }
  
  if (!penaltyInfo) {
    console.log('🔴 PenaltyModal: penaltyInfo가 없어서 렌더링 안함');
    return null;
  }

  // API 응답 형식 통일
  const penaltyType = penaltyInfo.penalty_type || penaltyInfo.type || '패널티';
  const remainingHours = penaltyInfo.remaining_hours ?? penaltyInfo.remainingHours ?? 0;
  const remainingMinutes = penaltyInfo.remaining_minutes ?? penaltyInfo.remainingMinutes ?? 0;
  const remainingText = penaltyInfo.remaining_text ?? penaltyInfo.remainingText;
  const endDate = penaltyInfo.end_date || penaltyInfo.endDate;

  // 종료 시간 포맷팅
  const formatEndDate = () => {
    if (!endDate) return '';
    const date = new Date(endDate);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 제한 내용 메시지
  const getRestrictionMessage = () => {
    if (userRole === 'seller') {
      return '현재 패널티로 인해 견적 제안이 제한되고 있습니다.';
    } else {
      return '현재 패널티로 인해 공구 등록 및 참여가 제한되고 있습니다.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            패널티 안내
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <DialogDescription className="text-gray-900 space-y-2">
              <div className="font-semibold text-red-800 text-base">
                {penaltyType} 패널티가 부여되었습니다 (누적 {penaltyInfo.count}회)
              </div>
              
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">사유:</span> {penaltyInfo.reason}
                </div>
                <div>
                  <span className="font-medium">남은 시간:</span> {remainingText || `${remainingHours}시간 ${remainingMinutes}분`}
                </div>
                <div>
                  <span className="font-medium">종료 시간:</span> {formatEndDate()}
                </div>
              </div>
            </DialogDescription>
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <p className="font-medium mb-1">⚠️ 제한사항</p>
            <p>{getRestrictionMessage()}</p>
            <p className="mt-2 text-xs">패널티 기간이 종료되면 정상적으로 이용하실 수 있습니다.</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}