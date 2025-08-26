import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // 결제 취소 처리 - 클라이언트 페이지로 리다이렉트
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/payment/inicis/close`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>결제 취소</title>
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

export async function GET(request: NextRequest) {
  // GET 요청도 동일하게 처리
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com'}/payment/inicis/close`;
  return NextResponse.redirect(new URL(redirectUrl));
}