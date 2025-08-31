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
    <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-1">
      <div className="flex items-center gap-2 max-w-full">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center">
            <Image src="/logo.png" alt="둥지마켓" width={60} height={60} />
          </div>
        </Link>
        
        {/* 검색창 */}
        <SearchBar className="flex-1 min-w-0" placeholder="통합검색" showMyRegionButton={false} />
      </div>
    </header>
  );
}
