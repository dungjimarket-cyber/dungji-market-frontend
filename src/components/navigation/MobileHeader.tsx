'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { SearchBar } from '../search/SearchBar';
import Image from 'next/image';

/**
 * 모바일 환경용 상단 헤더 컴포넌트
 * 로고, 검색창, 장바구니 아이콘을 포함
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm px-4 py-2">
      <div className="flex items-center gap-3">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
              둥
            </div>
            <span className="ml-1 text-sm font-semibold hidden sm:inline">둥지마켓</span>
          </div>
        </Link>
        
        {/* 검색창 */}
        <SearchBar className="flex-1" placeholder="둥지마켓에서 검색하기" />
        
        {/* 장바구니 아이콘 */}
        <Link href="/cart" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ShoppingCart className="w-5 h-5 text-gray-700" />
        </Link>
      </div>
    </header>
  );
}
