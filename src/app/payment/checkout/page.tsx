'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import TossPaymentWidget from '@/components/payment/TossPaymentWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function PaymentCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 세션 스토리지에서 결제 정보 가져오기
    const storedData = sessionStorage.getItem('payment_order');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setPaymentData(data);
      } catch (error) {
        console.error('Failed to parse payment data:', error);
        router.push('/mypage/seller/bid-tokens');
      }
    } else {
      // 결제 정보가 없으면 입찰권 구매 페이지로 리다이렉트
      router.push('/mypage/seller/bid-tokens');
    }
    setLoading(false);
  }, [router]);

  const handlePaymentSuccess = async (paymentKey: string, orderId: string, amount: number) => {
    try {
      // 결제 승인 요청
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      });

      if (response.ok) {
        // 결제 성공
        sessionStorage.removeItem('payment_order');
        router.push('/payment/success');
      } else {
        // 결제 실패
        const error = await response.json();
        console.error('Payment confirmation failed:', error);
        router.push('/payment/fail');
      }
    } catch (error) {
      console.error('Payment confirmation error:', error);
      router.push('/payment/fail');
    }
  };

  const handlePaymentFail = (error: any) => {
    console.error('Payment failed:', error);
    sessionStorage.setItem('payment_error', JSON.stringify(error));
    router.push('/payment/fail');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-gray-500">결제 정보를 찾을 수 없습니다.</p>
            <Button
              className="w-full mt-4"
              onClick={() => router.push('/mypage/seller/bid-tokens')}
            >
              입찰권 구매 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          <h1 className="text-2xl font-bold">결제하기</h1>
        </div>

        {/* 결제 위젯 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>입찰권 구매</CardTitle>
          </CardHeader>
          <CardContent>
            <TossPaymentWidget
              orderId={paymentData.orderId}
              orderName={paymentData.orderName}
              amount={paymentData.amount}
              customerName={paymentData.customerName || user?.username || '고객'}
              customerEmail={paymentData.customerEmail || user?.email || 'customer@example.com'}
              onSuccess={handlePaymentSuccess}
              onFail={handlePaymentFail}
            />
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">결제 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 결제 완료 후 입찰권이 자동으로 발급됩니다.</li>
            <li>• 입찰권은 마이페이지에서 확인하실 수 있습니다.</li>
            <li>• 무제한 구독권은 구매일로부터 30일간 유효합니다.</li>
            <li>• 결제 관련 문의는 고객센터로 연락해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <PaymentCheckoutContent />
    </Suspense>
  );
}