import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron Job Secret 확인
const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
const CRON_AUTH_TOKEN = process.env.CRON_AUTH_TOKEN || 'your-secret-token-here';

export async function GET(request: NextRequest) {
  // Vercel Cron Job 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
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