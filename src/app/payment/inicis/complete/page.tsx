'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function InicisCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('결제 처리 중입니다...');

  useEffect(() => {
    const processPaymentResult = async () => {
      try {
        // URL 파라미터에서 결제 상태 확인 (모바일 결제 응답)
        const paymentStatus = searchParams.get('status');
        const paymentMessage = searchParams.get('message');
        
        // 모바일 결제 응답 처리
        if (paymentStatus) {
          if (paymentStatus === 'success') {
            const tid = searchParams.get('tid');
            const amount = searchParams.get('amount');
            const orderId = searchParams.get('orderId');
            const isSubscription = searchParams.get('is_subscription') === 'true';
            
            setStatus('success');
            setMessage(isSubscription ? '구독권 구매가 완료되었습니다.' : '이용권이 추가되었습니다.');
            
            // 3초 후 견적이용권 페이지로 리다이렉트
            setTimeout(() => {
              router.push('/mypage/seller/bid-tokens?payment=success');
            }, 3000);
          } else if (paymentStatus === 'cancel' || paymentStatus === 'fail') {
            setStatus('failed');
            const errorMessage = paymentMessage ? decodeURIComponent(paymentMessage) : '결제가 취소되었습니다.';
            setMessage(errorMessage);

            // localStorage에 에러 메시지 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem('payment_error_message', errorMessage);
            }

            setTimeout(() => {
              router.push('/mypage/seller/bid-tokens?payment=failed');
            }, 3000);
          } else if (paymentStatus === 'error') {
            setStatus('failed');
            const errorMessage = paymentMessage ? decodeURIComponent(paymentMessage) : '결제 처리 중 오류가 발생했습니다.';
            setMessage(errorMessage);

            // localStorage에 에러 메시지 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem('payment_error_message', errorMessage);
            }

            setTimeout(() => {
              router.push('/mypage/seller/bid-tokens?payment=error');
            }, 3000);
          }
          return;
        }
        
        // PC 결제 응답 처리 (기존 로직)
        const mid = searchParams.get('mid');
        const oid = searchParams.get('oid');
        const amt = searchParams.get('amt');
        const tid = searchParams.get('tid');
        const resultCode = searchParams.get('resultCode');
        const resultMsg = searchParams.get('resultMsg');
        const timestamp = searchParams.get('timestamp');
        const signature = searchParams.get('signature');
        
        // 결제 성공 여부 확인
        if (resultCode === '00') {
          // 백엔드에 결제 검증 요청
          const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/verify/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
            },
            body: JSON.stringify({
              orderId: oid,
              authResultCode: resultCode,
              authToken: tid,
              tid,
              mid,
              amt,
              timestamp,
              signature
            }),
          });

          if (verifyResponse.ok) {
            const result = await verifyResponse.json();
            
            // 무통장입금인 경우 별도 처리
            if (result.is_vbank) {
              setStatus('success');
              setMessage(
                `무통장입금 계좌가 발급되었습니다.\n` +
                `${result.vbank_name} ${result.vbank_num}\n` +
                `예금주: ${result.vbank_holder}\n` +
                `입금액: ${result.amount?.toLocaleString()}원\n` +
                `입금기한: ${result.vbank_date}`
              );
              
              // 5초 후 견적이용권 페이지로 리다이렉트
              setTimeout(() => {
                router.push('/mypage/seller/bid-tokens?payment=vbank');
              }, 5000);
            } else {
              // 실시간 결제 처리
              setStatus('success');
              
              // 구독권과 견적이용권 구분하여 메시지 표시
              if (result.is_subscription) {
                setMessage('구독권 구매가 완료되었습니다.');
              } else {
                setMessage('이용권이 추가되었습니다.');
              }
              
              // 3초 후 견적이용권 페이지로 리다이렉트
              setTimeout(() => {
                router.push('/mypage/seller/bid-tokens?payment=success');
              }, 3000);
            }
          } else {
            throw new Error('결제 검증 실패');
          }
        } else {
          // 결제 실패
          setStatus('failed');
          const errorMessage = resultMsg || '결제에 실패했습니다.';
          setMessage(errorMessage);

          // localStorage에 에러 메시지 저장
          if (typeof window !== 'undefined') {
            localStorage.setItem('payment_error_message', errorMessage);
          }

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
        return <CheckCircle className="h-16 w-16 text-blue-500 mx-auto" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500 mx-auto animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-blue-600';
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

export default function InicisCompletePage() {
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
      <InicisCompleteContent />
    </Suspense>
  );
}