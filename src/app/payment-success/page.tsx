'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL 파라미터에서 결제 정보 추출
  const payment = searchParams.get('payment');
  const orderId = searchParams.get('orderId');
  const verified = searchParams.get('verified');
  const tempToken = searchParams.get('temp_token');

  useEffect(() => {
    // 결제 성공이 아닌 경우 처리
    if (payment !== 'success') {
      setError('유효하지 않은 결제 요청입니다.');
      setIsProcessing(false);
      return;
    }

    // 3초 후 입찰권 페이지로 이동
    const timer = setTimeout(() => {
      setIsProcessing(false);
      
      // 임시 토큰이 있으면 localStorage에 저장하여 인증 상태 복원
      if (tempToken) {
        localStorage.setItem('dungji_auth_token', tempToken);
      }
      
      // 입찰권 페이지로 리다이렉트
      router.push('/mypage/seller/bid-tokens?payment_completed=true');
    }, 3000);

    return () => clearTimeout(timer);
  }, [payment, tempToken, router]);

  // 즉시 이동 버튼 핸들러
  const handleGoToBidTokens = () => {
    if (tempToken) {
      localStorage.setItem('dungji_auth_token', tempToken);
    }
    router.push('/mypage/seller/bid-tokens?payment_completed=true');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">결제 오류</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/mypage/seller/bid-tokens')} 
              className="w-full"
              variant="outline"
            >
              입찰권 구매 페이지로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">결제 완료!</CardTitle>
          <CardDescription>
            입찰권 구매가 성공적으로 완료되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 space-y-1">
            <p>주문번호: <strong>{orderId}</strong></p>
            {verified === 'true' && (
              <p className="text-green-600">✓ 결제 검증 완료</p>
            )}
          </div>
          
          {isProcessing ? (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">
                  입찰권 페이지로 이동 중...
                </span>
              </div>
              <Button 
                onClick={handleGoToBidTokens}
                variant="outline" 
                size="sm"
              >
                즉시 이동
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleGoToBidTokens} 
              className="w-full"
            >
              입찰권 확인하기
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading component for Suspense fallback
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <CardTitle>결제 정보 확인 중...</CardTitle>
          <CardDescription>잠시만 기다려주세요.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}