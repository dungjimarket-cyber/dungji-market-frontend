'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, CreditCard, DollarSign } from 'lucide-react';

interface PaymentInfo {
  id: string;
  order_id: string;
  amount: number;
  product_name: string;
  pay_method: string;
  created_at: string;
  can_refund: boolean;
  refund_deadline?: string;
  usage_count?: number;
}

interface RefundRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentInfo | null;
  onRefundRequested: () => void;
}

export default function RefundRequestModal({
  isOpen,
  onClose,
  payment,
  onRefundRequested,
}: RefundRequestModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!payment) return;

    if (!reason.trim()) {
      toast({
        title: '환불 사유 필요',
        description: '환불 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { refundService } = await import('@/lib/api/refundService');
      await refundService.createRefundRequest(payment.id, reason.trim());

      toast({
        title: '환불 요청 완료',
        description: '환불 요청이 접수되었습니다. 관리자 검토 후 처리됩니다.',
      });

      setReason('');
      onClose();
      onRefundRequested();
    } catch (error: any) {
      toast({
        title: '환불 요청 실패',
        description: error.message || '환불 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    onClose();
  };

  if (!payment) return null;

  const isExpired = payment.refund_deadline && new Date(payment.refund_deadline) < new Date();
  const hasUsed = payment.usage_count && payment.usage_count > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>환불 요청</DialogTitle>
          <DialogDescription>
            구매한 견적이용권의 환불을 요청합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 결제 정보 */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {payment.pay_method === 'CARD' ? (
                <CreditCard className="h-4 w-4" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              <span className="font-medium">{payment.order_id}</span>
            </div>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">상품:</span> {payment.product_name}</p>
              <p><span className="text-muted-foreground">결제금액:</span> {payment.amount.toLocaleString()}원</p>
              <p><span className="text-muted-foreground">결제일:</span> {new Date(payment.created_at).toLocaleString()}</p>
              {payment.usage_count !== undefined && (
                <p><span className="text-muted-foreground">사용횟수:</span> {payment.usage_count}회</p>
              )}
            </div>
          </div>

          {/* 환불 조건 안내 */}
          <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">환불 정책</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 구매 후 7일 이내에만 환불 가능</li>
              <li>• 견적이용권을 사용하지 않은 경우에만 환불 가능</li>
              <li>• 환불 승인 후 3-5 영업일 소요</li>
              <li>• 24시간 쿨링오프 제도 (최초 구매 시 1회)</li>
            </ul>
          </div>

          {/* 환불 불가 안내 */}
          {(!payment.can_refund || isExpired || hasUsed) && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">환불 불가</h4>
                  <div className="text-sm text-red-700 space-y-1">
                    {isExpired && <p>• 환불 가능 기간이 만료되었습니다</p>}
                    {hasUsed && <p>• 이미 견적이용권을 사용하셨습니다</p>}
                    {!payment.can_refund && !isExpired && !hasUsed && (
                      <p>• 환불 조건을 만족하지 않습니다</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 환불 사유 입력 */}
          {payment.can_refund && !isExpired && !hasUsed && (
            <>
              <div className="space-y-2">
                <Label htmlFor="refund-reason">환불 사유 *</Label>
                <Textarea
                  id="refund-reason"
                  placeholder="환불 사유를 상세히 입력해주세요..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  환불 사유는 관리자 검토 시 참고됩니다.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !reason.trim()}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      요청 중...
                    </>
                  ) : (
                    '환불 요청'
                  )}
                </Button>
              </div>
            </>
          )}

          {/* 환불 불가능한 경우 확인 버튼 */}
          {(!payment.can_refund || isExpired || hasUsed) && (
            <div className="pt-2">
              <Button onClick={handleClose} className="w-full" variant="outline">
                확인
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}