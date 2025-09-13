'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

interface TradeCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneId: number;
  phoneModel: string;
  isSeller: boolean;
  onComplete?: () => void;
}

export default function TradeCompleteModal({
  isOpen,
  onClose,
  phoneId,
  phoneModel,
  isSeller,
  onComplete,
}: TradeCompleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/used/phones/${phoneId}/complete-trade/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      toast.success('거래가 완료되었습니다! 🎉');
      onComplete?.();
      onClose();
    } catch (error: any) {
      console.error('거래 완료 실패:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      let errorMessage = '거래 완료 처리 중 오류가 발생했습니다.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = '거래중인 상품만 완료 처리할 수 있습니다.';
      } else if (error.response?.status === 403) {
        errorMessage = '거래 완료 권한이 없습니다.';
      } else if (error.response?.status === 404) {
        errorMessage = '거래 정보를 찾을 수 없습니다.';
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 판매자가 아니면 모달 표시 안함
  if (!isSeller) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">거래완료</DialogTitle>
          <DialogDescription className="text-xs">{phoneModel}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-center text-gray-600">
            구매자에게 상품을 전달하셨나요?
          </p>
          <p className="text-xs text-center text-gray-500 mt-2">
            거래완료 후에는 취소할 수 없습니다
          </p>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button size="sm" onClick={handleComplete} disabled={isLoading} className="flex-1">
            {isLoading ? '처리중' : '완료'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}