/**
 * 이니시스 모바일 결제 응답 처리
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // 모바일 결제 응답 파라미터 추출
    const P_STATUS = formData.get('P_STATUS') as string;
    const P_RMESG1 = formData.get('P_RMESG1') as string;
    const P_TID = formData.get('P_TID') as string;
    const P_AMT = formData.get('P_AMT') as string;
    const P_OID = formData.get('P_OID') as string;
    const P_NOTI = formData.get('P_NOTI') as string;
    const P_AUTH_DT = formData.get('P_AUTH_DT') as string;
    const P_TYPE = formData.get('P_TYPE') as string;
    const P_REQ_URL = formData.get('P_REQ_URL') as string;
    
    console.log('모바일 결제 응답:', {
      P_STATUS,
      P_RMESG1,
      P_TID,
      P_OID,
      P_AMT,
      P_NOTI,
      P_AUTH_DT,
      P_TYPE,
      P_REQ_URL
    });
    
    // 인증 결과 성공 (00 = 성공)
    if (P_STATUS === '00') {
      // 결제 승인 요청이 필요함 (2단계 인증)
      const approvalResponse = await fetch(P_REQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          P_MID: P_TID ? P_TID.substring(10, 20) : '', // TID에서 MID 추출
          P_TID: P_TID || '',
        }),
      });
      
      const approvalText = await approvalResponse.text();
      console.log('승인 응답:', approvalText);
      
      // 응답 파싱 (key=value&key=value 형식)
      const params = new URLSearchParams(approvalText);
      const finalStatus = params.get('P_STATUS');
      const finalMessage = params.get('P_RMESG1');
      
      if (finalStatus === '00') {
        // 결제 성공 - 입찰권 페이지로 리다이렉트하면서 백엔드 검증 파라미터 전달
        const orderId = P_OID || P_NOTI || 'unknown';
        
        // 승인 응답에서 추가 데이터 파싱
        const payMethod = params.get('P_TYPE') || P_TYPE || 'mobile';
        const authToken = P_TID || '';
        const amount = params.get('P_AMT') || P_AMT || '';
        
        // 먼저 백엔드에서 결제를 검증하고 사용자 인증 정보를 가져옵니다
        try {
          const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/mobile-verify/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              authToken: authToken,
              authResultCode: finalStatus,
              payMethod: payMethod,
              tid: P_TID || '',
              amount: amount,
              // 가상계좌 정보 추가
              ...(payMethod === 'VBANK' && {
                vactBankName: params.get('P_VACT_BANKNAME') || '',
                VACT_Num: params.get('P_VACT_NUM') || '',
                VACT_Date: params.get('P_VACT_DATE') || '',
                VACT_Name: params.get('P_VACT_NAME') || '',
                vactBankCode: params.get('P_VACT_BANKCODE') || ''
              })
            }),
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            
            // 백엔드에서 검증이 성공하면 일시적 토큰을 포함하여 리다이렉트
            const queryParams = new URLSearchParams({
              payment: 'success',
              orderId: orderId,
              verified: 'true',
              // 일시적 인증을 위한 토큰 추가 (백엔드에서 제공)
              ...(verifyData.tempToken && { temp_token: verifyData.tempToken })
            });
            
            const successUrl = `/payment-success?${queryParams.toString()}`;
            console.log('모바일 결제 검증 성공 - 리다이렉트 URL:', successUrl);
            return NextResponse.redirect(new URL(successUrl, req.url));
          } else {
            console.error('백엔드 결제 검증 실패:', await verifyResponse.text());
            throw new Error('결제 검증 실패');
          }
        } catch (verifyError) {
          console.error('결제 검증 중 오류:', verifyError);
          // 검증 실패 시 기존 방식대로 처리 (fallback)
          const queryParams = new URLSearchParams({
            payment: 'success',
            orderId: orderId,
            authResultCode: finalStatus,
            payMethod: payMethod,
            authToken: authToken,
            tid: P_TID || '',
            amount: amount,
            // 가상계좌 관련 파라미터 추가 (무통장입금인 경우)
            ...(payMethod === 'VBANK' && {
              vactBankName: params.get('P_VACT_BANKNAME') || '',
              VACT_Num: params.get('P_VACT_NUM') || '',
              VACT_Date: params.get('P_VACT_DATE') || '',
              VACT_Name: params.get('P_VACT_NAME') || '',
              vactBankCode: params.get('P_VACT_BANKCODE') || ''
            })
          });
          
          const successUrl = `/payment-success?${queryParams.toString()}`;
          console.log('모바일 결제 성공 (검증 우회) - 리다이렉트 URL:', successUrl);
          return NextResponse.redirect(new URL(successUrl, req.url));
        }
      } else {
        // 결제 실패
        const failUrl = `/mypage/seller/bid-tokens?payment=failed&msg=${encodeURIComponent(finalMessage || '결제 승인 실패')}`;
        return NextResponse.redirect(new URL(failUrl, req.url));
      }
    } else {
      // 인증 실패 또는 취소
      const cancelUrl = `/mypage/seller/bid-tokens?payment=cancelled&msg=${encodeURIComponent(P_RMESG1 || '결제가 취소되었습니다')}`;
      return NextResponse.redirect(new URL(cancelUrl, req.url));
    }
  } catch (error) {
    console.error('모바일 결제 응답 처리 오류:', error);
    const errorUrl = `/mypage/seller/bid-tokens?payment=failed&msg=${encodeURIComponent('결제 처리 중 오류가 발생했습니다')}`;
    return NextResponse.redirect(new URL(errorUrl, req.url));
  }
}

export async function GET(req: NextRequest) {
  // GET 요청도 POST와 동일하게 처리 (일부 모바일 환경에서 GET으로 올 수 있음)
  return POST(req);
}