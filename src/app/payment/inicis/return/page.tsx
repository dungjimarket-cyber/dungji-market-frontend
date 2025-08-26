'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function InicisReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('결제 처리 중입니다...');

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        const resultCode = searchParams.get('resultCode');
        const resultMsg = searchParams.get('resultMsg');
        const orderId = searchParams.get('orderid');
        const amount = searchParams.get('amt');

        if (resultCode === '0000') {
          setStatus('success');
          setMessage(`결제가 완료되었습니다. (${amount ? parseInt(amount).toLocaleString() : ''}원)`);
          
          // 3초 후 입찰권 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/mypage/seller/bid-tokens?payment=success');
          }, 3000);
        } else {
          setStatus('failed');
          setMessage(resultMsg || '결제에 실패했습니다.');
          
          // 3초 후 입찰권 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/mypage/seller/bid-tokens?payment=failed');
          }, 3000);
        }
      } catch (error) {
        console.error('결제 결과 처리 오류:', error);
        setStatus('failed');
        setMessage('결제 처리 중 오류가 발생했습니다.');
        
        setTimeout(() => {
          router.push('/mypage/seller/bid-tokens?payment=error');
        }, 3000);
      }
    };

    processPaymentResult();
  }, [searchParams, router]);

  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500 mx-auto animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {getIcon()}
          
          <div>
            <h1 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
              {status === 'success' && '결제 완료'}
              {status === 'failed' && '결제 실패'}
              {status === 'processing' && '결제 처리 중'}
            </h1>
            <p className="text-gray-600">{message}</p>
          </div>

          {status !== 'processing' && (
            <div className="text-sm text-gray-500">
              3초 후 자동으로 이동합니다...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InicisReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <Clock className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
            <div>
              <h1 className="text-xl font-semibold mb-2 text-blue-600">결제 처리 중</h1>
              <p className="text-gray-600">결제 결과를 확인하고 있습니다...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <InicisReturnContent />
    </Suspense>
  );
}