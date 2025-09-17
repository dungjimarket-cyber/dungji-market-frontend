'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import UsedPhoneCard from '@/components/used/UsedPhoneCard';
import { buyerAPI } from '@/lib/api/used';
import { UsedPhone } from '@/types/used';

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favorites.map((phone, index) => (
          <UsedPhoneCard
            key={phone.id}
            phone={phone}
            priority={index < 4}
            onFavorite={handleUnfavorite}
          />
        ))}
      </div>
    </div>
  );
}