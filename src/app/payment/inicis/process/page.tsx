'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

function InicisProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('결제 처리 중입니다...');

  useEffect(() => {
    const processPaymentResult = async () => {
      // 이니시스에서 전달받은 파라미터 (try 블록 밖에 선언)
      const resultCode = searchParams.get('resultCode');
      const resultMsg = searchParams.get('resultMsg');
      const oid = searchParams.get('oid'); // orderNumber from Inicis
      const authToken = searchParams.get('authToken');
      const authUrl = searchParams.get('authUrl');
      const netCancelUrl = searchParams.get('netCancelUrl');
      const mid = searchParams.get('mid');
      const merchantData = searchParams.get('merchantData');
      const checkAckUrl = searchParams.get('checkAckUrl');
      const idc_name = searchParams.get('idc_name');
      const payMethod = searchParams.get('payMethod'); // 결제 수단
      
      // 모든 가능한 TID 관련 파라미터 확인
      const tid = searchParams.get('tid');
      const P_TID = searchParams.get('P_TID');
      const transactionId = searchParams.get('transactionId');
      const paymentId = searchParams.get('paymentId');
      const MOID = searchParams.get('MOID');
      const TotPrice = searchParams.get('TotPrice');
      const goodName = searchParams.get('goodName');
      
      try {
        
        // 모든 URL 파라미터 로깅
        const allParams: { [key: string]: string | null } = {};
        for (const [key, value] of searchParams.entries()) {
          allParams[key] = value;
        }
        
        console.log('=== 이니시스 전체 파라미터 분석 ===');
        console.log('모든 URL 파라미터:', allParams);
        console.log('TID 관련 파라미터들:', {
          tid,
          P_TID,
          transactionId,
          paymentId,
          authToken: authToken ? `${authToken.substring(0, 50)}...(${authToken.length}자)` : null,
          MOID,
          TotPrice,
          goodName
        });
        
        console.log('결제 처리 파라미터:', {
          resultCode,
          resultMsg,
          oid,
          authToken: authToken ? `${authToken.substring(0, 50)}...(${authToken.length}자)` : null,
          authUrl,
          mid,
          idc_name,
          payMethod
        });
        
        // 결제 성공 여부 확인
        if (resultCode === '0000') {
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
              authToken: authToken,
              tid: tid || P_TID || authToken, // 실제 TID 우선 사용
              mid: mid,
              authUrl: authUrl,
              netCancelUrl: netCancelUrl,
              idc_name: idc_name,
              payMethod: payMethod, // 결제 수단 추가
              // 추가 파라미터들도 전달
              P_TID: P_TID,
              transactionId: transactionId,
              paymentId: paymentId,
              MOID: MOID,
              TotPrice: TotPrice,
              goodName: goodName,
              allParams: allParams, // 모든 파라미터 전달
            }),
          });

          console.log('결제 검증 응답 상태:', verifyResponse.status);
          
          if (verifyResponse.ok) {
            const result = await verifyResponse.json();
            console.log('결제 검증 성공 결과:', result);
            setStatus('success');
            
            // 가상계좌, 구독권, 견적이용권 구분하여 메시지 표시
            let purchaseMessage = '결제가 완료되었습니다.';
            
            if (result.is_vbank) {
              // 가상계좌 결제인 경우
              purchaseMessage = result.message || '가상계좌가 발급되었습니다. 입금 후 이용권이 지급됩니다.';
              console.log('가상계좌 결제 완료:', {
                vbank_name: result.vbank_name,
                vbank_num: result.vbank_num,
                vbank_date: result.vbank_date,
                vbank_holder: result.vbank_holder
              });
            } else if (result.is_subscription) {
              // 즉시 지급되는 구독권
              purchaseMessage = result.message || '구독권이 구매 완료되었습니다.';
            } else if (result.token_count) {
              // 즉시 지급되는 견적이용권
              purchaseMessage = result.message || `견적이용권 ${result.token_count}개가 구매 완료되었습니다.`;
            }
            
            setMessage(purchaseMessage);
            
            // 3초 후 견적이용권 페이지로 리다이렉트
            setTimeout(() => {
              router.push('/mypage/seller/bid-tokens?payment=success');
            }, 3000);
          } else {
            console.error('결제 검증 실패:', {
              status: verifyResponse.status,
              statusText: verifyResponse.statusText,
              url: verifyResponse.url
            });
            
            const errorText = await verifyResponse.text();
            console.error('에러 응답 텍스트:', errorText);
            
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || '결제 검증 실패' };
            }
            
            throw new Error(errorData.error || `결제 검증 실패 (${verifyResponse.status})`);
          }
        } else {
          // 결제 실패
          setStatus('failed');
          setMessage(resultMsg || '결제에 실패했습니다.');
          
          setTimeout(() => {
            router.push('/mypage/seller/bid-tokens?payment=failed');
          }, 3000);
        }
      } catch (error) {
        console.error('결제 결과 처리 오류:', error);
        console.error('오류 상세:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          resultCode,
          oid,
          authToken: authToken ? 'exists' : 'missing',
          authUrl: authUrl ? 'exists' : 'missing'
        });
        
        setStatus('failed');
        const errorMessage = error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.';
        setMessage(errorMessage);
        
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

export default function InicisProcessPage() {
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
      <InicisProcessContent />
    </Suspense>
  );
}