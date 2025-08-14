'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TossPaymentWidgetProps {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  onSuccess?: (paymentKey: string, orderId: string, amount: number) => void;
  onFail?: (error: any) => void;
}

// 토스페이먼츠 클라이언트 키 (테스트용)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

export default function TossPaymentWidget({
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  onSuccess,
  onFail
}: TossPaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const paymentMethodsWidgetRef = useRef<any>(null);
  const agreementWidgetRef = useRef<any>(null);

  useEffect(() => {
    const initializePayments = async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: customerEmail });
        setWidgets(widgets);
      } catch (error) {
        console.error('Failed to initialize TossPayments:', error);
        toast({
          title: '결제 초기화 실패',
          description: '결제 시스템을 초기화하는데 실패했습니다.',
          variant: 'destructive',
        });
        if (onFail) onFail(error);
      }
    };

    initializePayments();
  }, [customerEmail, toast, onFail]);

  useEffect(() => {
    if (!widgets) return;

    const renderWidgets = async () => {
      try {
        // 결제 수단 위젯 렌더링
        if (paymentMethodsWidgetRef.current) {
          await widgets.setAmount({
            currency: 'KRW',
            value: amount,
          });

          const paymentMethodsWidget = widgets.renderPaymentMethods({
            selector: '#payment-methods',
            variantKey: 'DEFAULT',
          });

          paymentMethodsWidgetRef.current = paymentMethodsWidget;
        }

        // 이용약관 위젯 렌더링
        if (!agreementWidgetRef.current) {
          const agreementWidget = widgets.renderAgreement({
            selector: '#agreement',
            variantKey: 'AGREEMENT',
          });

          agreementWidgetRef.current = agreementWidget;
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to render payment widgets:', error);
        toast({
          title: '위젯 렌더링 실패',
          description: '결제 위젯을 표시하는데 실패했습니다.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    };

    renderWidgets();
  }, [widgets, amount, toast]);

  const handlePayment = async () => {
    if (!widgets) {
      toast({
        title: '결제 시스템 오류',
        description: '결제 시스템이 준비되지 않았습니다.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    try {
      // 결제 요청
      await widgets.requestPayment({
        orderId: orderId,
        orderName: orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: customerName,
        customerEmail: customerEmail,
      });
    } catch (error: any) {
      console.error('Payment failed:', error);
      
      // 에러 메시지 처리
      let errorMessage = '결제 처리 중 오류가 발생했습니다.';
      
      if (error.code === 'USER_CANCEL') {
        errorMessage = '결제가 취소되었습니다.';
      } else if (error.code === 'INVALID_CARD_COMPANY') {
        errorMessage = '지원하지 않는 카드입니다.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: '결제 실패',
        description: errorMessage,
        variant: 'destructive',
      });

      if (onFail) onFail(error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">결제 시스템을 준비하고 있습니다...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 주문 정보 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">주문 정보</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">상품명</span>
            <span>{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">결제 금액</span>
            <span className="font-semibold text-lg">{amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div>
        <h3 className="font-semibold mb-3">결제 수단</h3>
        <div id="payment-methods" className="w-full" />
      </div>

      {/* 이용약관 */}
      <div>
        <div id="agreement" className="w-full" />
      </div>

      {/* 결제 버튼 */}
      <Button
        onClick={handlePayment}
        disabled={processing}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            결제 처리중...
          </>
        ) : (
          `${amount.toLocaleString()}원 결제하기`
        )}
      </Button>

      {/* 안내 문구 */}
      <div className="text-xs text-gray-500 text-center">
        <p>결제 진행 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다.</p>
        <p className="mt-1">결제 완료 후 견적티켓이 자동으로 발급됩니다.</p>
      </div>
    </div>
  );
}