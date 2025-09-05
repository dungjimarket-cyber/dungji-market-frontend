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
          P_MID: 'dungjima14', // 이니시스 상점 ID (고정값)
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
        // 결제 성공 - 백엔드에서 결제 검증 및 입찰권 지급 처리
        const orderId = P_OID || P_NOTI || 'unknown';
        
        // 승인 응답에서 추가 데이터 파싱
        const payMethod = params.get('P_TYPE') || P_TYPE || 'CARD';
        const authToken = params.get('P_TID') || P_TID || ''; // 승인 응답의 TID 우선 사용
        const amount = params.get('P_AMT') || P_AMT || '';
        
        console.log('백엔드 결제 검증 시작:', {
          orderId,
          payMethod,
          authToken,
          amount,
          finalStatus
        });
        
        try {
          // 백엔드로 결제 검증 및 입찰권 지급 요청
          const backendApiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('http://localhost:8000', 'http://localhost:8000') || 'http://localhost:8000';
          const verifyResponse = await fetch(`${backendApiUrl}/api/payments/inicis/verify/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              authUrl: '',  // 모바일에서는 authUrl이 없음
              authToken: authToken,
              authResultCode: finalStatus,
              payMethod: payMethod,
              tid: authToken, // 승인된 TID 사용
              amount: parseInt(amount) || 0,
              // 가상계좌 정보 추가
              ...(payMethod === 'VBANK' && {
                vactBankName: params.get('P_VACT_BANKNAME') || '',
                VACT_Num: params.get('P_VACT_NUM') || '',
                VACT_Date: params.get('P_VACT_DATE') || '',
                VACT_Name: params.get('P_VACT_NAME') || '',
                vactBankCode: params.get('P_VACT_BANKCODE') || ''
              }),
              // 추가 파라미터들
              allParams: {
                P_STATUS: finalStatus,
                P_TID: authToken, // 승인된 TID 사용
                P_OID: orderId,
                P_AMT: amount,
                P_TYPE: payMethod,
                P_RMESG1: params.get('P_RMESG1') || '',
                P_AUTH_DT: P_AUTH_DT,
                // 가상계좌 관련 모든 파라미터
                ...(payMethod === 'VBANK' && {
                  P_VACT_BANKNAME: params.get('P_VACT_BANKNAME') || '',
                  P_VACT_NUM: params.get('P_VACT_NUM') || '',
                  P_VACT_DATE: params.get('P_VACT_DATE') || '',
                  P_VACT_NAME: params.get('P_VACT_NAME') || '',
                  P_VACT_BANKCODE: params.get('P_VACT_BANKCODE') || ''
                })
              }
            }),
          });

          console.log('백엔드 검증 응답 상태:', verifyResponse.status);
          
          if (verifyResponse.ok) {
            const verifyResult = await verifyResponse.json();
            console.log('백엔드 검증 성공:', verifyResult);
            
            // 백엔드 검증 성공 시 입찰권 페이지로 리다이렉트
            const successUrl = `/payment-success?payment=success&orderId=${orderId}&verified=true&bid_tokens_added=true`;
            console.log('모바일 결제 검증 성공 - 리다이렉트 URL:', successUrl);
            return NextResponse.redirect(new URL(successUrl, req.url), 302);
          } else {
            const errorText = await verifyResponse.text();
            console.error('백엔드 검증 실패:', errorText);
            
            // 검증 실패 시 오류 페이지로 리다이렉트
            const failUrl = `/mypage/seller/bid-tokens?payment=failed&msg=${encodeURIComponent('결제 검증에 실패했습니다')}`;
            return NextResponse.redirect(new URL(failUrl, req.url), 302);
          }
        } catch (verifyError) {
          console.error('백엔드 검증 요청 오류:', verifyError);
          
          // 네트워크 오류 등으로 검증 실패 시 오류 메시지와 함께 리다이렉트
          const errorUrl = `/mypage/seller/bid-tokens?payment=failed&msg=${encodeURIComponent('결제 검증 중 오류가 발생했습니다')}`;
          return NextResponse.redirect(new URL(errorUrl, req.url), 302);
        }
      } else {
        // 결제 실패
        const failUrl = `/mypage/seller/bid-tokens?payment=failed&msg=${encodeURIComponent(finalMessage || '결제 승인 실패')}`;
        return NextResponse.redirect(new URL(failUrl, req.url), 302);
      }
    } else {
      // 인증 실패 또는 취소
      const cancelUrl = `/mypage/seller/bid-tokens?payment=cancelled&msg=${encodeURIComponent(P_RMESG1 || '결제가 취소되었습니다')}`;
      return NextResponse.redirect(new URL(cancelUrl, req.url), 302);
    }
  } catch (error) {
    console.error('모바일 결제 응답 처리 오류:', error);
    const errorUrl = `/mypage/seller/bid-tokens?payment=failed&msg=${encodeURIComponent('결제 처리 중 오류가 발생했습니다')}`;
    return NextResponse.redirect(new URL(errorUrl, req.url), 302);
  }
}

export async function GET(req: NextRequest) {
  // GET 요청도 POST와 동일하게 처리 (일부 모바일 환경에서 GET으로 올 수 있음)
  return POST(req);
}