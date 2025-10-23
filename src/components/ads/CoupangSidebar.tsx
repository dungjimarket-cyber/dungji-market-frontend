'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * 쿠팡 검색 사이드바
 * PC에서만 표시되는 우측 사이드바
 * fixed 포지셔닝으로 메인 컨텐츠 오른쪽 빈 공간 중앙에 배치
 * xl (1280px) 이상에서만 표시
 * 위치: 화면 중앙(50%) + 메인 컨텐츠 절반(640px) + 여유 공간
 */
export function CoupangSidebar() {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // 쿠팡 검색 페이지로 이동
    window.open(`https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <aside
      className="hidden xl:block fixed top-24 z-10 w-[240px]"
      style={{ left: 'calc(50% + 580px)' }}
    >
      <div className="bg-white rounded-lg shadow-md p-4">
        {/* 헤더 */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-900 mb-1">쿠팡에서 최저가 찾기</h3>
          <p className="text-[10px] text-gray-500">쿠팡 가격비교</p>
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch}>
          <div className="flex gap-1">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명 입력"
              className="text-xs h-8"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2"
            >
              <Search className="w-3 h-3" />
            </Button>
          </div>
        </form>

        {/* 공지 문구 */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-[8px] text-gray-400 text-center leading-tight">
            쿠팡 파트너스 활동의 일환으로,<br />
            이에 따른 일정액의 수수료를 제공받습니다.
          </p>
        </div>
      </div>
    </aside>
  );
}
