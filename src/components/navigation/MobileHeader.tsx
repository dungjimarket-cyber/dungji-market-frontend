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
      <div className="flex items-center gap-2 px-4 py-1">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center">
            <Image src="/logos/dungji_logo.jpg" alt="둥지마켓" width={60} height={60} className="rounded-lg" />
          </div>
        </Link>

        {/* 검색창 */}
        <SearchBar className="flex-1 min-w-0" placeholder="통합검색" showMyRegionButton={false} />

        {/* 쿠팡 파트너스 광고 */}
        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
          <iframe
            src="https://coupa.ng/ckmbC6"
            width="50"
            height="100"
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            className="border-0"
          ></iframe>
          <p className="text-[7px] text-gray-400 text-center leading-tight max-w-[50px]">
            쿠팡 파트너스 활동
          </p>
        </div>
      </div>
    </header>
  );
}
