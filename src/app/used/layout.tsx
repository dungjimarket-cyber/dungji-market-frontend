/**
 * 중고폰 직거래 레이아웃
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '둥지마켓 - 커스텀공구/통신상품비교견적/지역기반중고거래',
  description: '커스텀 공구 할인, 공동구매 비교견적, 중고거래를 한번에 | 지역기반 중고직거래 서비스',
  keywords: '중고폰, 중고폰매매, 중고폰직거래, 갤럭시중고, 아이폰중고, 지역중고거래, 직거래, 커스텀공구, 공동구매',
  openGraph: {
    title: '둥지마켓 - 커스텀공구/통신상품비교견적/지역기반중고거래',
    description: '커스텀 공구 할인, 공동구매 비교견적, 중고거래를 한번에 | 지역기반 중고직거래 서비스',
    images: ['/logos/dungji_logo.jpg'],
  },
};

export default function UsedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 배너 - 서비스 안내 */}
      <div className="bg-gradient-to-r from-dungji-primary to-dungji-secondary text-white py-2 px-4 text-center text-sm">
        <span className="font-medium">🎉 NEW</span> 지역기반 중고직거래 서비스가 오픈했습니다!
      </div>
      
      {/* 메인 컨텐츠 */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}