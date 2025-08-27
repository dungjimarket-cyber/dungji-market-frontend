import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron Job Secret 확인
const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
const CRON_AUTH_TOKEN = process.env.CRON_AUTH_TOKEN || 'your-secret-token-here';

export async function GET(request: NextRequest) {
  // Vercel Cron Job 인증은 자동으로 처리됨
  // 추가 보안이 필요한 경우 환경에 따라 검증
  const isProduction = process.env.NODE_ENV === 'production';
  
  // 프로덕션 환경에서만 추가 검증
  if (isProduction && CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      // Vercel cron job은 특별한 헤더를 사용하므로 추가 확인
      const vercelCronHeader = request.headers.get('x-vercel-cron');
      if (!vercelCronHeader) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
  }

  try {
    // Django 백엔드의 cron endpoint 호출
    const response = await fetch(`${BACKEND_API_URL}/api/cron/update-status/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    
    console.log('[Cron] Status update completed:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Status update cron job completed',
      data
    });
  } catch (error) {
    console.error('[Cron] Error updating status:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}