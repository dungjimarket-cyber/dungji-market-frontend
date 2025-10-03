'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import axios from 'axios';
import { toast } from 'sonner';
import { CANCELLATION_REASON_LABELS, CancellationReason } from '@/types/usedTransaction';

interface TradeCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneId: number;
  phoneModel: string;
  isSeller: boolean;
  sellerConfirmed: boolean;
  onCancel?: () => void;
  itemType?: 'phone' | 'electronics'; // 추가: 아이템 타입
}

export default function TradeCancelModal({
  isOpen,
  onClose,
  phoneId,
  phoneModel,
  isSeller,
  sellerConfirmed,
  onCancel,
  itemType = 'phone', // 기본값: 휴대폰 (기존 호환성)
}: TradeCancelModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState<CancellationReason>('other');
  const [customReason, setCustomReason] = useState('');
  const [returnToSale, setReturnToSale] = useState(true);

  // 판매자가 판매완료 확인한 후에는 취소 불가
  if (sellerConfirmed) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>거래 취소 불가</DialogTitle>
            <DialogDescription className="truncate">{phoneModel}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                판매자가 판매완료를 확인한 후에는 거래를 취소할 수 없습니다.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleCancel = async () => {
    if (reason === 'other' && !customReason.trim()) {
      toast.error('기타 사유를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      // 디버그 로그 추가
      console.log('=== 취소 요청 데이터 ===');
      console.log('itemType:', itemType);
      console.log('phoneId:', phoneId);
      console.log('reason:', reason);
      console.log('customReason:', customReason);
      console.log('isSeller:', isSeller);

      // itemType에 따라 올바른 API 엔드포인트 사용
      const apiEndpoint = itemType === 'electronics'
        ? `${process.env.NEXT_PUBLIC_API_URL}/used/electronics/${phoneId}/cancel-trade/`
        : `${process.env.NEXT_PUBLIC_API_URL}/used/phones/${phoneId}/cancel-trade/`;

      console.log('API endpoint:', apiEndpoint);

      const requestData = {
        reason,
        custom_reason: reason === 'other' ? customReason : undefined,
        return_to_sale: isSeller ? returnToSale : undefined,
      };

      console.log('Request data:', requestData);

      const response = await axios.post(
        apiEndpoint,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('=== 서버 응답 ===');
      console.log('response:', response.data);

      toast.success(response.data.message);
      onCancel?.();
      onClose();
    } catch (error: any) {
      console.error('거래 취소 실패:', error);
      toast.error(error.response?.data?.error || '거래 취소 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 역할별 취소 사유 옵션
  const getCancellationReasons = (): CancellationReason[] => {
    if (isSeller) {
      return [
        'product_sold',
        'buyer_no_response',
        'buyer_no_show',
        'payment_issue',
        'buyer_unreasonable',
        'buyer_cancel_request',
        'personal_reason',
        'schedule_conflict',
        'location_issue',
        'other'
      ];
    } else {
      return [
        'change_mind',
        'found_better',
        'seller_no_response',
        'condition_mismatch',
        'price_disagreement',
        'seller_cancel_request',
        'schedule_conflict',
        'location_issue',
        'other'
      ];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] sm:max-w-md p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm sm:text-base">거래 취소</DialogTitle>
          <DialogDescription className="text-xs truncate">{phoneModel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {/* 경고 메시지 */}
          <div className="flex items-center gap-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800">
              거래를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>

          {/* 취소 사유 선택 */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">취소 사유를 선택해주세요</Label>
            <RadioGroup value={reason} onValueChange={(value) => setReason(value as CancellationReason)}>
              {getCancellationReasons().map((r) => (
                <div key={r} className="flex items-center space-x-2">
                  <RadioGroupItem value={r} id={r} />
                  <Label htmlFor={r} className="text-xs sm:text-sm font-normal cursor-pointer">
                    {CANCELLATION_REASON_LABELS[r]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* 기타 사유 입력 */}
          {reason === 'other' && (
            <div className="space-y-1.5">
              <Label htmlFor="custom-reason" className="text-xs sm:text-sm">상세 사유</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="취소 사유를 자세히 입력해주세요"
                rows={3}
                className="text-xs sm:text-sm"
              />
            </div>
          )}

          {/* 판매자의 경우 재판매 여부 선택 */}
          {isSeller && (
            <div className="flex items-center space-x-2 p-2.5 bg-gray-50 rounded-lg">
              <Checkbox
                id="return-to-sale"
                checked={returnToSale}
                onCheckedChange={(checked) => setReturnToSale(checked as boolean)}
              />
              <Label
                htmlFor="return-to-sale"
                className="text-xs sm:text-sm font-normal cursor-pointer"
              >
                상품을 다시 판매중 상태로 전환
              </Label>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              {isSeller
                ? returnToSale
                  ? '거래가 취소되고 상품이 다시 판매중 상태로 변경됩니다.'
                  : '거래가 취소되고 상품이 삭제됩니다.'
                : '거래가 취소되고 상품이 다시 판매중 상태로 변경됩니다.'}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onClose} size="sm" className="flex-1 text-xs py-2">
            취소
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isLoading || (reason === 'other' && !customReason.trim())}
            variant="destructive"
            size="sm"
            className="flex-1 text-xs py-2"
          >
            {isLoading ? '처리중' : '거래 취소'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}