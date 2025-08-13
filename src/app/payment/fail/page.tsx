'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, Loader2 } from 'lucide-react';

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('결제 처리 중 오류가 발생했습니다.');
  
  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // URL 파라미터에서 에러 메시지 가져오기
    if (message) {
      setErrorMessage(decodeURIComponent(message));
    } else {
      // 세션 스토리지에서 에러 정보 가져오기
      const storedError = sessionStorage.getItem('payment_error');
      if (storedError) {
        try {
          const error = JSON.parse(storedError);
          if (error.message) {
            setErrorMessage(error.message);
          }
        } catch (e) {
          console.error('Failed to parse error:', e);
        }
      }
    }

    // 결제 취소 처리
    if (orderId) {
      cancelPayment(orderId);
    }
  }, [message, orderId]);

  const cancelPayment = async (orderId: string) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({ orderId }),
      });
    } catch (error) {
      console.error('Payment cancellation error:', error);
    }
  };

  const handleRetry = () => {
    // 세션 스토리지 정리
    sessionStorage.removeItem('payment_error');
    // 입찰권 구매 페이지로 이동
    router.push('/mypage/seller/bid-tokens');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">결제 실패</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-red-700">{errorMessage}</p>
            {code && (
              <p className="text-sm text-red-600 mt-2">오류 코드: {code}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleRetry}
            >
              다시 시도하기
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/mypage')}
            >
              마이페이지로 돌아가기
            </Button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              결제 관련 문의사항이 있으시면 고객센터로 연락해주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}