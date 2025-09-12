'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calendar, RotateCcw } from "lucide-react";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            {canChange ? (
              <RotateCcw className="h-6 w-6 text-blue-600" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            )}
          </div>
          <DialogTitle className="text-lg">
            {canChange ? '닉네임 변경 안내' : '변경 제한 안내'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {canChange 
              ? '닉네임 변경 규칙을 확인해주세요'
              : '현재 닉네임 변경이 제한되어 있습니다'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 규칙 안내 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              변경 규칙
            </h4>
            <p className="text-sm text-blue-700">
              닉네임은 <strong>30일 동안 최대 2회</strong>까지 변경 가능합니다.
            </p>
          </div>

          {/* 현재 상태 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">현재 상태</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">남은 변경 횟수</span>
                <span className={`font-medium ${canChange ? 'text-green-600' : 'text-red-600'}`}>
                  {remainingChanges}회
                </span>
              </div>
              
              {!canChange && nextAvailableDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    다음 변경 가능일
                  </span>
                  <span className="font-medium text-gray-900 text-sm">
                    {formatDate(nextAvailableDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 추가 안내 */}
          {!canChange && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-700">
                💡 변경 제한은 보안과 서비스 품질 유지를 위한 정책입니다.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {canChange && (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              취소
            </Button>
          )}
          <Button 
            onClick={onClose} 
            className={canChange ? "flex-1" : "w-full"}
          >
            {canChange ? '계속 진행' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}