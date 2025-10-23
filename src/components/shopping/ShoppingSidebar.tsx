'use client';

import { useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: string;
  mallName: string;
  brand?: string;
}

/**
 * 네이버 쇼핑 최저가 검색 사이드바
 * PC 왼쪽 빈 공간에 fixed 포지셔닝
 */
export function ShoppingSidebar() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('검색어를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shopping/search/?query=${encodeURIComponent(query)}&display=20&sort=asc`
      );

      const data = await response.json();

      if (data.success) {
        // 최대 5개만 표시
        const limitedItems = (data.items || []).slice(0, 5);
        setItems(limitedItems);
        if (limitedItems.length === 0) {
          setError('검색 결과가 없습니다');
        }
      } else {
        setError(data.error || '검색에 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
      console.error('Shopping search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="hidden xl:block fixed top-24 z-10 w-[240px]"
      style={{ left: 'calc(50% - 850px)' }}
    >
      <div className="bg-white rounded-lg shadow-md p-4">
        {/* 헤더 */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-900 mb-1">최저가 검색</h3>
          <p className="text-[10px] text-gray-500">실시간 가격비교</p>
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="mb-3">
          <div className="flex gap-1">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명 입력"
              className="text-xs h-8"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-2"
              disabled={loading}
            >
              <Search className="w-3 h-3" />
            </Button>
          </div>
        </form>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-[10px] text-red-600 mb-2">{error}</p>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-[10px] text-gray-500 mt-2">검색 중...</p>
          </div>
        )}

        {/* 검색 결과 */}
        {!loading && items.length > 0 && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gray-50 rounded-md p-2 hover:bg-gray-100 transition-colors"
              >
                <div className="flex gap-2">
                  {/* 상품 이미지 */}
                  <div className="w-12 h-12 flex-shrink-0 bg-white rounded overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.png';
                      }}
                    />
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-medium text-gray-900 line-clamp-2 mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs font-bold text-blue-600 mb-0.5">
                      {parseInt(item.lprice).toLocaleString()}원
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-500">
                        {item.mallName}
                      </span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* 안내 문구 (검색 전) */}
        {!loading && items.length === 0 && !error && (
          <div className="text-center py-6">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[10px] text-gray-400">
              상품명을 입력하고<br />최저가를 확인하세요
            </p>
          </div>
        )}

        {/* 푸터 */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-[8px] text-gray-400 text-center leading-tight">
            네이버 쇼핑 API 제공<br />
            실시간 가격은 변동될 수 있습니다
          </p>
        </div>
      </div>
    </aside>
  );
}
