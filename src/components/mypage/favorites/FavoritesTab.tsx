'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2, Eye } from 'lucide-react';
import { buyerAPI } from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UnifiedMarketItem, PhoneItem, ElectronicsItem, UnifiedFavorite } from '@/types/market';
import { isPhoneItem, isElectronicsItem, getMainImageUrl, getItemTitle, getItemDetailUrl, getSellerNickname } from '@/types/market';

// 통합 찜 아이템 타입 사용
interface FavoriteItem {
  id: number;
  itemType: 'phone' | 'electronics';
  item: UnifiedMarketItem;
  created_at: string;
}

export default function FavoritesTab() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      // 병렬로 휴대폰과 전자제품 찜 목록 가져오기
      const [phoneFavorites, electronicsFavorites] = await Promise.all([
        buyerAPI.getFavorites().catch(() => ({ items: [], results: [] })),
        electronicsApi.getFavorites().catch(() => ({ results: [] }))
      ]);

      // 데이터 통합 및 타입 추가
      const phoneItems = (phoneFavorites.results || phoneFavorites.items || []).map((fav: any) => ({
        id: fav.id,
        itemType: 'phone' as const,
        item: { ...fav.phone, itemType: 'phone' as const },
        created_at: fav.created_at
      }));

      const electronicsItems = (electronicsFavorites.results || []).map((fav: any) => ({
        id: fav.id,
        itemType: 'electronics' as const,
        item: { ...fav.electronics, itemType: 'electronics' as const },
        created_at: fav.created_at
      }));

      // 날짜순 정렬
      const allFavorites = [...phoneItems, ...electronicsItems].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFavorites(allFavorites);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setError('찜 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    try {
      if (item.itemType === 'phone') {
        // 찜 목록에서는 이미 찜한 상태이므로 true 전달 (DELETE 메서드 사용)
        await buyerAPI.toggleFavorite(item.item.id, true);
      } else {
        // 찜 목록에서는 이미 찜한 상태이므로 true 전달 (DELETE 메서드 사용)
        await electronicsApi.toggleFavorite(item.item.id, true);
      }
      // 찜 해제 후 목록 새로고침
      fetchFavorites();
    } catch (error) {
      console.error('찜 해제 오류:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="mt-4 text-gray-500">찜 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg">
        <Heart className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">찜한 상품이 없습니다</h3>
        <p className="text-sm text-gray-500">마음에 드는 상품을 찜해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {favorites.map((item) => (
        <Card key={item.id} className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            <Link
              href={getItemDetailUrl(item.item)}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image
                src={getMainImageUrl(item.item)}
                alt={getItemTitle(item.item)}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={getItemDetailUrl(item.item)}
                className="hover:text-dungji-primary transition-colors"
              >
                <h4 className="font-medium text-sm truncate">
                  {getItemTitle(item.item)}
                </h4>
              </Link>
              <p className="text-base sm:text-lg font-semibold mt-1">
                {item.item.price.toLocaleString()}원
              </p>
              <p className="text-xs text-gray-500">
                판매자: {getSellerNickname(item.item)}
              </p>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
                <div className="flex gap-2">
                  <Link href={getItemDetailUrl(item.item)}>
                    <Button size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      상품 보기
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFavorite(item)}
                  >
                    <Heart className="w-3 h-3 mr-1" />
                    찜 해제
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}