import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 결제 취소 처리 - 부모 창으로 리다이렉트
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/mypage/seller/bid-tokens?payment=cancelled`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>결제 취소</title>
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
}

export async function GET(request: NextRequest) {
  // GET 요청도 동일하게 처리
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/payment/inicis/close`;
  return NextResponse.redirect(new URL(redirectUrl));
}