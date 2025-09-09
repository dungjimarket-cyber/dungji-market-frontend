/**
 * 중고폰 직거래 레이아웃
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '중고폰 직거래 | 둥지마켓',
  description: '안전하고 편리한 중고폰 직거래 플랫폼',
  keywords: '중고폰, 중고폰매매, 중고폰직거래, 갤럭시중고, 아이폰중고',
  openGraph: {
    title: '중고폰 직거래 | 둥지마켓',
    description: '안전하고 편리한 중고폰 직거래 플랫폼',
    images: ['/images/used-phones-og.jpg'],
  },
};

export default function UsedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 배너 - 베타 서비스 안내 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 text-center text-sm">
        <span className="font-medium">🎉 NEW</span> 중고폰 직거래 서비스가 오픈했습니다! 
        <span className="ml-2 text-xs opacity-90">베타 기간 중 수수료 무료</span>
      </div>
      
      {/* 메인 컨텐츠 */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}