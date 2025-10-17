import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com/api';

  // 정적 페이지들
  const staticPages = [
    '',
    '/about',
    '/group-purchases',
    '/custom-deals',
    '/custom-deals/guide',
    '/used',
    '/used/guide',
    '/events',
    '/register',
    '/login',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/mypage',
    '/mypage/seller',
    '/bid-tickets',
  ];

  const staticUrls = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 커공특가 상품들 (빌드 안정성을 위해 임시 비활성화)
  // let customDealUrls: MetadataRoute.Sitemap = [];
  // try {
  //   const response = await fetch(`${apiUrl}/custom-groupbuys/?status=recruiting&limit=100`, {
  //     next: { revalidate: 3600 } // 1시간 캐시
  //   });

  //   if (response.ok) {
  //     const data = await response.json();
  //     const deals = Array.isArray(data) ? data : (data.results || []);

  //     customDealUrls = deals.map((deal: any) => ({
  //       url: `${baseUrl}/custom-deals/${deal.id}`,
  //       lastModified: new Date(deal.updated_at || deal.created_at),
  //       changeFrequency: 'daily' as const,
  //       priority: 0.9,
  //     }));
  //   }
  // } catch (error) {
  //   console.error('커공특가 sitemap 생성 실패:', error);
  // }

  return staticUrls;
}