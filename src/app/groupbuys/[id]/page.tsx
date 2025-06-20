import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { GroupPurchaseDetail } from '@/components/group-purchase/GroupPurchaseDetail';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
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
      next: { revalidate: 60 } // 60초마다 캐시 갱신
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

  return <GroupPurchaseDetail groupBuy={groupBuy} />;
}
