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

  // 커스텀 공구 상품들
  let customDealUrls: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${apiUrl}/custom-groupbuys/?status=recruiting&limit=100`, {
      next: { revalidate: 3600 } // 1시간 캐시
    });

    if (response.ok) {
      const data = await response.json();
      const deals = Array.isArray(data) ? data : (data.results || []);

      customDealUrls = deals.map((deal: any) => {
        const dateStr = deal.updated_at || deal.created_at;
        const lastModified = dateStr ? new Date(dateStr) : new Date();

        return {
          url: `${baseUrl}/custom-deals/${deal.id}`,
          lastModified: isNaN(lastModified.getTime()) ? new Date() : lastModified,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        };
      });
    }
  } catch (error) {
    console.error('커스텀 공구 sitemap 생성 실패:', error);
  }

  // 중고거래 - 중고폰
  let usedPhoneUrls: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${apiUrl}/used/phones/?status=active&limit=100`, {
      next: { revalidate: 3600 } // 1시간 캐시
    });

    if (response.ok) {
      const data = await response.json();
      const phones = Array.isArray(data) ? data : (data.results || []);

      usedPhoneUrls = phones.map((phone: any) => {
        const dateStr = phone.updated_at || phone.created_at;
        const lastModified = dateStr ? new Date(dateStr) : new Date();

        return {
          url: `${baseUrl}/used/${phone.id}`,
          lastModified: isNaN(lastModified.getTime()) ? new Date() : lastModified,
          changeFrequency: 'daily' as const,
          priority: 0.8,
        };
      });
    }
  } catch (error) {
    console.error('중고폰 sitemap 생성 실패:', error);
  }

  // 중고거래 - 전자제품
  let usedElectronicsUrls: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${apiUrl}/used-electronics/?status=active&limit=100`, {
      next: { revalidate: 3600 } // 1시간 캐시
    });

    if (response.ok) {
      const data = await response.json();
      const electronics = Array.isArray(data) ? data : (data.results || []);

      usedElectronicsUrls = electronics.map((item: any) => {
        const dateStr = item.updated_at || item.created_at;
        const lastModified = dateStr ? new Date(dateStr) : new Date();

        return {
          url: `${baseUrl}/used-electronics/${item.id}`,
          lastModified: isNaN(lastModified.getTime()) ? new Date() : lastModified,
          changeFrequency: 'daily' as const,
          priority: 0.8,
        };
      });
    }
  } catch (error) {
    console.error('전자제품 sitemap 생성 실패:', error);
  }

  // 그룹바이 상품들
  let groupbuyUrls: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${apiUrl}/groupbuys/?status=recruiting&limit=100`, {
      next: { revalidate: 3600 } // 1시간 캐시
    });

    if (response.ok) {
      const data = await response.json();
      const groupbuys = Array.isArray(data) ? data : (data.results || []);

      groupbuyUrls = groupbuys.map((groupbuy: any) => {
        const dateStr = groupbuy.updated_at || groupbuy.created_at;
        const lastModified = dateStr ? new Date(dateStr) : new Date();

        return {
          url: `${baseUrl}/groupbuys/${groupbuy.id}`,
          lastModified: isNaN(lastModified.getTime()) ? new Date() : lastModified,
          changeFrequency: 'daily' as const,
          priority: 0.9,
        };
      });
    }
  } catch (error) {
    console.error('그룹바이 sitemap 생성 실패:', error);
  }

  return [
    ...staticUrls,
    ...customDealUrls,
    ...usedPhoneUrls,
    ...usedElectronicsUrls,
    ...groupbuyUrls,
  ];
}
