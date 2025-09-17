'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PenaltyReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  penaltyType: string;
}

export default function PenaltyReasonModal({ isOpen, onClose, reason, penaltyType }: PenaltyReasonModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{penaltyType} 사유</DialogTitle>
        </DialogHeader>
        
        <DialogDescription className="text-gray-700 py-4">
          {reason}
        </DialogDescription>

        <DialogFooter>
          <Button onClick={onClose} size="sm" className="w-full">
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}