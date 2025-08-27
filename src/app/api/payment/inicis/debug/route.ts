import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 모든 폼 데이터를 객체로 변환
    const allParams: Record<string, any> = {};
    formData.forEach((value, key) => {
      allParams[key] = value;
    });
    
    console.log('=== INICIS DEBUG - 전체 파라미터 ===');
    console.log(JSON.stringify(allParams, null, 2));
    console.log('=== INICIS DEBUG - 파라미터 개수 ===', Object.keys(allParams).length);
    
    // 간단한 HTML 응답
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>디버그 결과</title>
      </head>
      <body>
        <h1>이니시스 파라미터 디버그</h1>
        <pre>${JSON.stringify(allParams, null, 2)}</pre>
        <p>총 ${Object.keys(allParams).length}개 파라미터 수신</p>
      </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('디버그 처리 오류:', error);
    return new NextResponse('Error: ' + error, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // 모든 GET 파라미터를 객체로 변환
  const allParams: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });
  
  console.log('=== INICIS DEBUG GET - 전체 파라미터 ===');
  console.log(JSON.stringify(allParams, null, 2));
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>디버그 결과 (GET)</title>
    </head>
    <body>
      <h1>이니시스 파라미터 디버그 (GET)</h1>
      <pre>${JSON.stringify(allParams, null, 2)}</pre>
      <p>총 ${Object.keys(allParams).length}개 파라미터 수신</p>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}