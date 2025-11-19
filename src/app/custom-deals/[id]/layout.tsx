import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Next.js 15: params is now a Promise
    const { id } = await params;

    // API에서 공구 정보 가져오기
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${id}/`,
      {
        next: { revalidate: 300 } // 5분마다 갱신 (검색엔진 크롤링 고려)
      }
    );

    if (!response.ok) {
      return {
        title: '둥지마켓 커스텀 공구',
      };
    }

    const deal = await response.json();

    // 대표 이미지 찾기 (order_index가 0인 이미지 또는 첫 번째 이미지)
    const mainImage = deal.images?.find((img: any) => img.order_index === 0) || deal.images?.[0];
    const imageUrl = mainImage?.image_url;

    // 가격 정보 생성 (상품 유형별 분기)
    let priceText = '';

    // discount_rate가 없는 경우 (쿠폰전용 등)
    if (!deal.discount_rate) {
      if (deal.deal_type === 'time_based') {
        priceText = '기간행사';
      } else {
        priceText = '커스텀 특가';
      }
    } else if (deal.type === 'online') {
      // 온라인몰: 전품목 할인
      priceText = `전품목 ${deal.discount_rate}% 할인`;
    } else if (deal.type === 'offline') {
      // 오프라인: 시간대별 할인
      priceText = `시간대별 최대 ${deal.discount_rate}% 할인`;
    } else if (deal.type === 'service') {
      // 서비스제공: 주문 시 할인
      priceText = `주문 시 ${deal.discount_rate}% 할인`;
    } else if (deal.type === 'period') {
      // 기간행사: 기간 내 할인
      priceText = `기간 내 ${deal.discount_rate}% 할인`;
    } else {
      // 기본: 전품목 할인
      priceText = `전품목 ${deal.discount_rate}% 할인`;
    }

    // 설명 텍스트 (HTML 태그 제거)
    const description = deal.description
      ?.replace(/<[^>]*>/g, '')
      .substring(0, 150) || '둥지마켓 커스텀 공구';

    const title = `${deal.title} - ${priceText} | 둥지마켓 커공특가`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com';
    const canonicalUrl = `${baseUrl}/custom-deals/${id}`;

    // 상품 유형별 키워드 생성
    const typeKeywords: Record<string, string> = {
      online: '온라인쇼핑, 전품목할인, 온라인몰',
      offline: '오프라인매장, 시간대할인, 매장방문',
      service: '서비스제공, 주문할인, 업체서비스',
      period: '기간행사, 특별할인, 한정기간'
    };
    const typeKeyword = typeKeywords[deal.type] || '온라인쇼핑';

    return {
      title,
      description,
      keywords: `${deal.title}, 커공특가, 공동구매, 할인, ${typeKeyword}, 둥지마켓`,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: deal.title,
          }
        ] : [],
        type: 'website',
        siteName: '둥지마켓',
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: deal.status === 'recruiting', // 모집중일 때만 인덱싱
        follow: true,
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return {
      title: '둥지마켓 커스텀 공구',
    };
  }
}

export default function CustomDealLayout({ children }: Props) {
  return <>{children}</>;
}
