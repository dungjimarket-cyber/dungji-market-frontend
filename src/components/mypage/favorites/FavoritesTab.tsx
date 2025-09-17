'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2, Eye } from 'lucide-react';
import { buyerAPI } from '@/lib/api/used';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface FavoriteItem {
  id: number;
  phone: {
    id: number;
    brand: string;
    model: string;
    price: number;
    images: Array<{ image_url?: string; is_main?: boolean }>;
    seller: { nickname: string };
    status?: string;
  };
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
      const data = await buyerAPI.getFavorites();
      setFavorites(data.results || data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setError('찜 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (phoneId: number) => {
    try {
      await buyerAPI.toggleFavorite(phoneId);
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
              href={`/used/${item.phone.id}`}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <Image
                src={item.phone.images[0]?.image_url || '/placeholder.png'}
                alt={item.phone.model}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/used/${item.phone.id}`}
                className="hover:text-dungji-primary transition-colors"
              >
                <h4 className="font-medium text-sm truncate">
                  {item.phone.brand} {item.phone.model}
                </h4>
              </Link>
              <p className="text-base sm:text-lg font-semibold mt-1">
                {item.phone.price.toLocaleString()}원
              </p>
              <p className="text-xs text-gray-500">
                판매자: {item.phone.seller.nickname}
              </p>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
                <div className="flex gap-2">
                  <Link href={`/used/${item.phone.id}`}>
                    <Button size="sm">
                      <Eye className="w-3 h-3 mr-1" />
                      상품 보기
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveFavorite(item.phone.id)}
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