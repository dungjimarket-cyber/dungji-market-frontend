import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { GroupPurchaseDetailNew } from '@/components/group-purchase/GroupPurchaseDetailNew';
import type { Metadata } from 'next';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  region_type?: string;
  region?: string;
  region_name?: string;
  regions?: Array<{
    id?: number;
    code?: string;
    name: string;
    full_name?: string;
  }>;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    carrier?: string;
    registration_type?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    plan_info: string;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
  total_bids?: number;
  highest_bid_amount?: number;
}

/**
 * 그룹 구매 데이터를 가져오는 함수
 */
async function getGroupBuy(id: string): Promise<GroupBuy | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${id}/`, {
      next: { revalidate: 10 } // 10초마다 캐시 갱신 - 닉네임 변경 등이 빨리 반영되도록
    });
    if (!response.ok) throw new Error('Failed to fetch group buy');
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch group buy with id: ${id}`, error);
    return null;
  }
}

/**
 * 그룹 구매 상세 페이지 서버 컴포넌트
 */
export interface PageParams {
  id: string;
}

/**
 * 동적 메타데이터 생성
 */
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { id } = await params;
  const groupBuy = await getGroupBuy(id);
  
  if (!groupBuy) {
    return {
      title: '둥지마켓 - 공동구매 플랫폼',
      description: '둥지마켓은 공동구매 플랫폼입니다.',
    };
  }
  
  const title = `${groupBuy.product_details.name} - 둥지마켓`;
  const description = `${groupBuy.product_details.name} 공동구매에 참여해보세요! 현재 ${groupBuy.current_participants}명 참여중`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://dungji-market.com';
  const imageUrl = groupBuy.product_details.image_url?.startsWith('http') 
    ? groupBuy.product_details.image_url 
    : `${baseUrl}${groupBuy.product_details.image_url || '/logo.png'}`;
  
  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/groupbuys/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/groupbuys/${id}`,
      siteName: '둥지마켓',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: groupBuy.product_details.name,
        },
      ],
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'og:price:amount': groupBuy.product_details.base_price.toString(),
      'og:price:currency': 'KRW',
    },
  };
}

/**
 * Next.js 15.1.6에서는 params가 Promise로 설정되어야 함
 */
export default async function GroupBuyPage({ params }: { params: Promise<PageParams> }) {
  // params를 Promise로 처리
  const { id } = await params;
  const groupBuy = await getGroupBuy(id);
  
  // 그룹 구매가 존재하지 않는 경우
  if (!groupBuy) {
    notFound();
  }

  return <GroupPurchaseDetailNew groupBuy={groupBuy} />;
}
