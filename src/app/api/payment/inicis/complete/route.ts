import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // POST 데이터 파싱
    const formData = await request.formData();
    
    // 모든 폼 데이터 로깅 (디버깅용)
    const allParams: Record<string, any> = {};
    formData.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log('이니시스 결제 완료 - 전체 파라미터:', allParams);
    
    // 필요한 파라미터 추출 (Inicis 실제 파라미터명 기준)
    const params = {
      resultCode: formData.get('resultCode'),
      resultMsg: formData.get('resultMsg'),
      mid: formData.get('mid'),
      oid: formData.get('orderNumber'), // Inicis는 orderNumber로 전송
      authToken: formData.get('authToken'),
      authUrl: formData.get('authUrl'),
      netCancelUrl: formData.get('netCancelUrl'),
      merchantData: formData.get('merchantData'),
      checkAckUrl: formData.get('checkAckUrl'),
      idc_name: formData.get('idc_name'),
      charset: formData.get('charset'),
      returnUrl: formData.get('returnUrl'),
      cp_yn: formData.get('cp_yn'),
      cardnum: formData.get('cardnum'),
      cardUsePoint: formData.get('cardUsePoint'),
    };

    console.log('이니시스 결제 완료 콜백 - 추출된 파라미터:', params);

    // 결제 성공 여부 확인
    if (params.resultCode === '0000') {
      // 인증 성공 - 승인 요청 필요
      // 백엔드에 승인 요청을 보내야 함
      
      // 프론트엔드 페이지로 리다이렉트 (파라미터 전달)
      const queryParams = new URLSearchParams({
        resultCode: params.resultCode as string,
        resultMsg: params.resultMsg as string || '',
        oid: params.oid as string || '', // orderNumber
        authToken: params.authToken as string || '',
        authUrl: params.authUrl as string || '',
        netCancelUrl: params.netCancelUrl as string || '',
        mid: params.mid as string || '',
        merchantData: params.merchantData as string || '',
        checkAckUrl: params.checkAckUrl as string || '',
        idc_name: params.idc_name as string || '',
      });
      
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/payment/inicis/process?${queryParams.toString()}`;
      
      // HTML 응답으로 리다이렉트 (부모 창으로)
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>결제 처리 중...</title>
        </head>
        <body>
          <script>
            if (window.opener && !window.opener.closed) {
              // 부모 창이 있으면 부모 창으로 리다이렉트
              window.opener.location.href = '${redirectUrl}';
              window.close();
            } else {
              // 부모 창이 없으면 현재 창에서 리다이렉트
              window.location.href = '${redirectUrl}';
            }
          </script>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    } else {
      // 결제 실패
      const queryParams = new URLSearchParams({
        resultCode: params.resultCode as string,
        resultMsg: params.resultMsg as string || '결제에 실패했습니다.',
      });
      
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/payment/inicis/process?${queryParams.toString()}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>결제 실패</title>
        </head>
        <body>
          <script>
            window.location.href = '${redirectUrl}';
          </script>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
  } catch (error) {
    console.error('이니시스 결제 완료 처리 오류:', error);
    
    // 오류 페이지로 리다이렉트
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>결제 오류</title>
      </head>
      <body>
        <script>
          alert('결제 처리 중 오류가 발생했습니다.');
          window.location.href = '/mypage/seller/bid-tokens?payment=error';
        </script>
      </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }
}

// GET 요청도 지원 (일부 경우에 GET으로 올 수 있음)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // 모든 GET 파라미터 로깅 (디버깅용)
  const allParams: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  console.log('이니시스 GET 요청 - 전체 파라미터:', allParams);
  
  // GET 파라미터로 온 경우도 처리 (Inicis 실제 파라미터명 기준)
  const params = {
    resultCode: searchParams.get('resultCode'),
    resultMsg: searchParams.get('resultMsg'),
    oid: searchParams.get('orderNumber'),
    authToken: searchParams.get('authToken'),
    authUrl: searchParams.get('authUrl'),
    netCancelUrl: searchParams.get('netCancelUrl'),
    mid: searchParams.get('mid'),
    merchantData: searchParams.get('merchantData'),
    checkAckUrl: searchParams.get('checkAckUrl'),
    idc_name: searchParams.get('idc_name'),
  };
  
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.set(key, value);
  });
  
  // 처리 페이지로 리다이렉트
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/payment/inicis/process?${queryParams.toString()}`;
  
  return NextResponse.redirect(new URL(redirectUrl));
}