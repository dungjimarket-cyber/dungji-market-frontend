'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2, Eye, HeartOff } from 'lucide-react';
import { buyerAPI } from '@/lib/api/used';
import { UsedPhone } from '@/types/used';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';

export default function FavoritesTab() {
  const [favorites, setFavorites] = useState<Partial<UsedPhone>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await buyerAPI.getFavorites();

      // PurchaseActivityTab과 동일한 구조로 처리
      const favoritesList = data.results || data;

      // 찜 목록 데이터 구조 정규화
      if (Array.isArray(favoritesList)) {
        const favoritePhones = favoritesList.map((item: any) => {
          // item이 phone 객체를 포함하는 경우
          if (item.phone) {
            return {
              ...item.phone,
              is_favorite: true
            };
          }
          // item이 직접 phone 데이터인 경우
          return {
            ...item,
            is_favorite: true
          };
        });
        setFavorites(favoritePhones);
      }
    } catch (error) {
      console.error('찜 목록 조회 오류:', error);
      setError('찜 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (phoneId: number) => {
    try {
      await buyerAPI.toggleFavorite(phoneId);
      // 찜 해제 후 목록에서 제거
      setFavorites(prev => prev.filter(phone => phone.id !== phoneId));
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">찜한 상품 ({favorites.length})</h3>
      </div>

      <div className="space-y-3">
        {favorites.map((phone) => (
          <Card key={phone.id} className="p-4">
            <div className="flex gap-4">
              {/* 상품 이미지 */}
              <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                {phone.images && phone.images.length > 0 ? (
                  <Image
                    src={phone.images[0].image || phone.images[0]}
                    alt={phone.title || '상품 이미지'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Heart className="w-8 h-8" />
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h4 className="font-medium text-gray-900 line-clamp-1">
                      {phone.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {phone.model} • {phone.storage}GB
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {phone.price?.toLocaleString()}원
                    </p>
                  </div>

                  {/* 상태 표시 */}
                  <Badge variant={phone.status === 'available' ? 'default' : 'secondary'}>
                    {phone.status === 'available' ? '판매중' :
                     phone.status === 'reserved' ? '예약중' :
                     phone.status === 'trading' ? '거래중' : '판매완료'}
                  </Badge>
                </div>

                {/* 버튼들 */}
                <div className="flex gap-2 mt-3">
                  <Link href={`/used/${phone.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      상품 보기
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfavorite(phone.id!)}
                    className="flex-1 gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <HeartOff className="w-4 h-4" />
                    찜 해제
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}