'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface NoReportableTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NoReportableTransactionsModal({
  isOpen,
  onClose,
}: NoReportableTransactionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            신고 가능한 거래가 없습니다
          </DialogTitle>
          <DialogDescription className="pt-3">
            최근 15일 이내에 완료된 거래가 없어 노쇼 신고를 할 수 없습니다.
            거래 완료 후 15일 이내에만 노쇼 신고가 가능합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="default">
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}