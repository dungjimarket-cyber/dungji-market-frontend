'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package } from 'lucide-react';

interface RegistrationLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxCount: number;
  onViewMyPhones: () => void;
}

export default function RegistrationLimitModal({
  isOpen,
  onClose,
  currentCount,
  maxCount,
  onViewMyPhones,
}: RegistrationLimitModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-center">등록 가능 개수 초과</DialogTitle>
          <DialogDescription className="text-center space-y-3">
            <p>
              최대 <span className="font-semibold text-blue-600">5개</span>까지만 등록 가능합니다.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <p className="text-sm text-gray-600">
                💡 기존 상품을 판매 완료하거나 삭제 후 새로운 상품을 등록할 수 있습니다.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            닫기
          </Button>
          <Button
            onClick={onViewMyPhones}
            className="w-full sm:w-auto"
          >
            <Package className="w-4 h-4 mr-2" />
            내 상품 관리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}