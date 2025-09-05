'use client';

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PenaltyInfo {
  is_active?: boolean;
  isActive?: boolean;
  type: string;
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

interface PenaltyAlertProps {
  penaltyInfo: PenaltyInfo | null | undefined;
  userRole: 'buyer' | 'seller' | null;
}

export default function PenaltyAlert({ penaltyInfo, userRole }: PenaltyAlertProps) {
  if (!penaltyInfo) return null;
  
  // API 응답 형식 통일 (snake_case와 camelCase 둘 다 지원)
  const isActive = penaltyInfo.is_active ?? penaltyInfo.isActive;
  const remainingHours = penaltyInfo.remaining_hours ?? penaltyInfo.remainingHours ?? 0;
  const remainingMinutes = penaltyInfo.remaining_minutes ?? penaltyInfo.remainingMinutes ?? 0;
  const remainingText = penaltyInfo.remaining_text ?? penaltyInfo.remainingText;
  
  if (!isActive) return null;
  
  // 회원 유형별 제한사항 메시지
  const getRestrictionMessage = () => {
    if (userRole === 'seller') {
      return '견적 제안이 제한됩니다';
    } else {
      return '공구 참여가 제한됩니다';
    }
  };
  
  return (
    <Alert className="mb-4 border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
      <AlertDescription className="text-xs sm:text-sm">
        <div className="flex flex-col space-y-0.5 sm:space-y-1">
          <div className="font-semibold text-red-800">
            패널티 (누적 {penaltyInfo.count}회)
          </div>
          <div className="text-red-700 break-words">
            <span className="font-medium">사유:</span> {penaltyInfo.reason}
          </div>
          <div className="text-red-700 break-words">
            <span className="font-medium">남은:</span> {remainingText || `${remainingHours}시간 ${remainingMinutes}분`}
          </div>
          <div className="text-red-600 font-medium text-xs">
            ⚠️ {getRestrictionMessage()}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}