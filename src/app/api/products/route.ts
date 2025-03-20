import { NextResponse } from 'next/server';

// 개발용 목업 데이터
const mockProducts = {
  electronics: [
    {
      id: '1',
      name: 'Apple MacBook Pro M3',
      description: '최신형 MacBook Pro M3 칩셋 탑재',
      price: 2500000,
      image: 'https://example.com/macbook.jpg',
      status: 'active',
      endTime: '2025-03-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Samsung Galaxy S24 Ultra',
      description: '삼성전자 최신플래그십 스마트폰',
      price: 1500000,
      image: 'https://example.com/galaxy.jpg',
      status: 'active',
      endTime: '2025-02-28T00:00:00Z',
    },
  ],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    // 개발 환경에서는 목업 데이터 사용
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        products: mockProducts[category as keyof typeof mockProducts] || [],
      });
    }

    // 운영 환경에서는 실제 API 호출 (추후 구현)
    throw new Error('Production API not implemented');
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        products: [], // 에러 발생 시 빈 배열 반환
      },
      { status: 500 }
    );
  }
}
