import { NextRequest, NextResponse } from 'next/server';

const CRON_SECRET = process.env.CRON_SECRET;
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
const CRON_AUTH_TOKEN = process.env.CRON_AUTH_TOKEN || 'your-secret-token-here';

export async function GET(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
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
    const response = await fetch(`${BACKEND_API_URL}/api/cron/check-custom-groupbuys/`, {
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

    console.log('[Cron] Custom groupbuy check completed:', data);

    return NextResponse.json({
      success: true,
      message: 'Custom groupbuy check cron job completed',
      data
    });
  } catch (error) {
    console.error('[Cron] Error checking custom groupbuys:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}