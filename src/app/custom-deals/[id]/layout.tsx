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

    // 가격 정보 생성
    let priceText = '';
    if (deal.original_price && deal.final_price) {
      const finalPrice = typeof deal.final_price === 'object'
        ? (deal.final_price.min || 0)
        : deal.final_price;
      priceText = `${finalPrice.toLocaleString()}원 (${deal.discount_rate}% 할인)`;
    } else {
      priceText = `전품목 ${deal.discount_rate}% 할인`;
    }

    // 설명 텍스트 (HTML 태그 제거)
    const description = deal.description
      ?.replace(/<[^>]*>/g, '')
      .substring(0, 150) || '둥지마켓 커스텀 공구';

    const title = `${deal.title} - ${priceText} | 둥지마켓 커공특가`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com';
    const canonicalUrl = `${baseUrl}/custom-deals/${id}`;

    return {
      title,
      description,
      keywords: `${deal.title}, 커공특가, 공동구매, 할인, ${deal.type === 'offline' ? '오프라인매장' : '온라인쇼핑'}, 둥지마켓`,
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
