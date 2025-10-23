'use client';

import Link from 'next/link';
import { SearchBar } from '../search/SearchBar';
import Image from 'next/image';

/**
 * 모바일 환경용 상단 헤더 컴포넌트
 * 로고, 검색창, 장바구니 아이콘을 포함
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* 쿠팡 파트너스 안내 배너 */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-1">
        <p className="text-[10px] text-gray-600 text-center leading-tight">
          쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>

      {/* 상품 배너 */}
      <div className="bg-white border-b border-gray-100 py-2 flex justify-center">
        <iframe
          src="https://coupa.ng/ckmbC6"
          width="320"
          height="100"
          frameBorder="0"
          scrolling="no"
          referrerPolicy="unsafe-url"
          className="border-0"
        ></iframe>
      </div>

      {/* 로고 + 검색창 */}
      <div className="flex items-center gap-2 px-4 py-1">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center">
            <Image src="/logos/dungji_logo.jpg" alt="둥지마켓" width={60} height={60} className="rounded-lg" />
          </div>
        </Link>

        {/* 검색창 */}
        <SearchBar className="flex-1 min-w-0" placeholder="통합검색" showMyRegionButton={false} />
      </div>
    </header>
  );
}
