import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Next.js 15: params is now a Promise
    const { id } = await params;

    // API에서 중고거래 상품 정보 가져오기
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/used/phones/${id}/`,
      {
        next: { revalidate: 300 } // 5분마다 갱신 (검색엔진 크롤링 고려)
      }
    );

    if (!response.ok) {
      return {
        title: '둥지마켓 중고거래',
      };
    }

    const phone = await response.json();

    // 대표 이미지 찾기 (첫 번째 이미지)
    const mainImage = phone.images?.[0];
    const imageUrl = mainImage?.image_url || mainImage?.imageUrl;

    // 브랜드명 한글 변환
    const brandNames: Record<string, string> = {
      samsung: '삼성',
      apple: '애플',
      lg: 'LG',
      xiaomi: '샤오미',
      other: '기타'
    };
    const brandName = brandNames[phone.brand] || phone.brand;

    // 상태 등급 한글 변환
    const conditionGrades: Record<string, string> = {
      S: 'S급',
      A: 'A급',
      B: 'B급',
      C: 'C급'
    };
    const conditionText = conditionGrades[phone.condition_grade] || phone.condition_grade;

    // 배터리 상태 한글 변환
    const batteryLabels: Record<string, string> = {
      excellent: '배터리 최상',
      good: '배터리 좋음',
      fair: '배터리 보통',
      poor: '배터리 나쁨',
      defective: '배터리 불량'
    };
    const batteryText = phone.battery_status ? batteryLabels[phone.battery_status] : '';

    // 지역 정보
    const regionText = phone.region_name ||
      (phone.regions?.[0]?.region?.name) ||
      (phone.sido && phone.sigungu ? `${phone.sido} ${phone.sigungu}` : '');

    // 구성품 정보
    const accessories = [];
    if (phone.has_box) accessories.push('박스');
    if (phone.has_charger) accessories.push('충전기');
    if (phone.has_earphones) accessories.push('이어폰');
    const accessoriesText = accessories.length > 0 ? accessories.join('·') + ' 포함' : '';

    // 타이틀 생성
    const storage = phone.storage ? ` ${phone.storage}GB` : '';
    const title = `${brandName} ${phone.model}${storage} - ${phone.price.toLocaleString()}원 | 둥지마켓 중고거래`;

    // 설명 생성 (핵심 정보 조합)
    const descriptionParts = [
      `${brandName} ${phone.model}${storage}`,
      `${phone.price.toLocaleString()}원`,
      conditionText,
      batteryText,
      regionText,
      accessoriesText
    ].filter(Boolean); // 빈 문자열 제거

    // 상품 설명이 있으면 추가 (HTML 태그 제거, 최대 50자)
    if (phone.description) {
      const cleanDescription = phone.description
        .replace(/<[^>]*>/g, '')
        .replace(/\n/g, ' ')
        .substring(0, 50);
      if (cleanDescription) {
        descriptionParts.push(cleanDescription);
      }
    }

    const description = descriptionParts.join(' | ');

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com';
    const canonicalUrl = `${baseUrl}/used/${id}`;

    return {
      title,
      description,
      keywords: `${brandName}, ${phone.model}, 중고폰, 중고거래, 직거래, ${regionText}, 둥지마켓`,
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${brandName} ${phone.model}${storage}`,
          }
        ] : ['/logos/dungji_logo.jpg'],
        type: 'website',
        siteName: '둥지마켓',
        locale: 'ko_KR',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : ['/logos/dungji_logo.jpg'],
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: phone.status === 'active', // 판매중일 때만 인덱싱
        follow: true,
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return {
      title: '둥지마켓 중고거래',
    };
  }
}

export default function UsedPhoneDetailLayout({ children }: Props) {
  return <>{children}</>;
}
