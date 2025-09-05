import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dungjimarket.com';
  
  // 정적 페이지들
  const staticPages = [
    '',
    '/about',
    '/group-purchases',
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

  // 동적 페이지들 (공구 상세 페이지 등)
  // 실제로는 API에서 가져와야 하지만, 간단한 예시
  const dynamicUrls: MetadataRoute.Sitemap = [];
  
  return [...staticUrls, ...dynamicUrls];
}