import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: '/api/auth/signin/google',
        callbackUrl: '/api/auth/callback/google',
      },
      kakao: {
        id: 'kakao',
        name: 'Kakao',
        type: 'oauth',
        signinUrl: '/api/auth/signin/kakao',
        callbackUrl: '/api/auth/callback/kakao',
      },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
