'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    // 결제 승인 처리
    if (paymentKey && orderId && amount) {
      confirmPayment();
    }
  }, [paymentKey, orderId, amount]);

  const confirmPayment = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: parseInt(amount as string),
        }),
      });

      if (!response.ok) {
        throw new Error('Payment confirmation failed');
      }

      // 세션 스토리지 정리
      sessionStorage.removeItem('payment_order');
    } catch (error) {
      console.error('Payment confirmation error:', error);
      router.push('/payment/fail');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">결제가 완료되었습니다!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            입찰권이 성공적으로 구매되었습니다.
          </p>
          {orderId && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">주문번호</p>
              <p className="font-semibold">{orderId}</p>
            </div>
          )}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => router.push('/mypage/seller/bid-tokens')}
            >
              입찰권 확인하기
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/group-purchases')}
            >
              공구 둘러보기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}