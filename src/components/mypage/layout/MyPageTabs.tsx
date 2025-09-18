'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, ShoppingCart, MessageSquare, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesActivityTab from '../sales/SalesActivityTab';
import PurchaseActivityTab from '../purchases/PurchaseActivityTab';
import ReviewsTab from '../reviews/ReviewsTab';
import FavoritesTab from '../favorites/FavoritesTab';
import { buyerAPI } from '@/lib/api/used';
import { cn } from '@/lib/utils';

export default function MyPageTabs() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'sales';
  });
  const [favoritesCount, setFavoritesCount] = useState(0);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 찜 개수만 체크
  useEffect(() => {
    checkFavoritesCount();
  }, []);

  const checkFavoritesCount = async () => {
    try {
      // 찜 개수
      const favorites = await buyerAPI.getFavorites().catch(() => ({ items: [] }));
      const favoriteItems = favorites.items || favorites.results || [];
      setFavoritesCount(favoriteItems.length || 0);

    } catch (error) {
      console.error('Failed to check favorites count:', error);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6 h-auto p-1 bg-gray-100">
        <TabsTrigger
          value="sales"
          className={cn(
            "flex flex-col sm:flex-row gap-1.5 py-3 px-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700",
            "hover:bg-gray-50 transition-all"
          )}
        >
          <Package className={cn(
            "w-5 h-5",
            activeTab === 'sales' ? "text-blue-600" : "text-gray-500"
          )} />
          <span className="text-sm font-medium">판매내역</span>
        </TabsTrigger>

        <TabsTrigger
          value="purchases"
          className={cn(
            "flex flex-col sm:flex-row gap-1.5 py-3 px-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700",
            "hover:bg-gray-50 transition-all"
          )}
        >
          <ShoppingCart className={cn(
            "w-5 h-5",
            activeTab === 'purchases' ? "text-purple-600" : "text-gray-500"
          )} />
          <span className="text-sm font-medium">구매내역</span>
        </TabsTrigger>

        <TabsTrigger
          value="favorites"
          className={cn(
            "flex flex-col sm:flex-row gap-1.5 py-3 px-2 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700",
            "hover:bg-gray-50 transition-all relative"
          )}
        >
          <Heart className={cn(
            "w-5 h-5",
            activeTab === 'favorites' ? "text-rose-600" : "text-gray-500"
          )} />
          <span className="text-sm font-medium">
            찜
            {favoritesCount > 0 && (
              <span className="ml-1 text-xs">({favoritesCount})</span>
            )}
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="reviews"
          className={cn(
            "flex flex-col sm:flex-row gap-1.5 py-3 px-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700",
            "hover:bg-gray-50 transition-all"
          )}
        >
          <MessageSquare className={cn(
            "w-5 h-5",
            activeTab === 'reviews' ? "text-green-600" : "text-gray-500"
          )} />
          <span className="text-sm font-medium">거래후기</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="sales" className="space-y-4">
        <SalesActivityTab />
      </TabsContent>

      <TabsContent value="purchases" className="space-y-4">
        <PurchaseActivityTab />
      </TabsContent>

      <TabsContent value="favorites" className="space-y-4">
        <FavoritesTab />
      </TabsContent>

      <TabsContent value="reviews" className="space-y-4">
        <ReviewsTab />
      </TabsContent>
    </Tabs>
  );
}