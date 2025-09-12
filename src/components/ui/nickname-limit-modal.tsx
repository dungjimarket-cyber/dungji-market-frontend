'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface NicknameLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  remainingChanges: number;
  nextAvailableDate: string | null;
  canChange: boolean;
}

export default function NicknameLimitModal({
  isOpen,
  onClose,
  remainingChanges,
  nextAvailableDate,
  canChange
}: NicknameLimitModalProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '알 수 없음';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '알 수 없음';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            {canChange ? (
              <>
                <RotateCcw className="h-4 w-4 text-blue-600" />
                닉네임 변경
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                변경 제한
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 간단한 규칙 안내 */}
          <div className="text-sm text-gray-600">
            30일 동안 최대 2회까지 변경 가능
          </div>

          {/* 현재 상태 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">남은 횟수</span>
            <span className={`font-medium ${canChange ? 'text-green-600' : 'text-red-600'}`}>
              {remainingChanges}회
            </span>
          </div>
          
          {!canChange && nextAvailableDate && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">다음 가능일</span>
              <span className="font-medium">
                {formatDate(nextAvailableDate)}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            onClick={onClose} 
            size="sm"
            className="w-full"
          >
            {canChange ? '확인' : '닫기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}