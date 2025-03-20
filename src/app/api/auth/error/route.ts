import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const error = searchParams.get('error');

  return NextResponse.json({ error }, { status: 200 });
}
