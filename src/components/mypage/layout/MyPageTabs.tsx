'use client';

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, MessageSquare, Heart, Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesActivityTab from '../sales/SalesActivityTab';
import PurchaseActivityTab from '../purchases/PurchaseActivityTab';
import ReviewsTab from '../reviews/ReviewsTab';
import FavoritesTab from '../favorites/FavoritesTab';
import { sellerAPI, buyerAPI } from '@/lib/api/used';
import { cn } from '@/lib/utils';

export default function MyPageTabs() {
  const [activeTab, setActiveTab] = useState('sales');
  const [salesNotice, setSalesNotice] = useState<string | null>(null);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // 각 탭의 데이터 체크
  useEffect(() => {
    checkActivityNotices();
  }, []);

  const checkActivityNotices = async () => {
    try {
      // 판매 활동 체크
      const myListingsRes = await sellerAPI.getMyListings().catch(() => ({ results: [] }));
      const myListings = Array.isArray(myListingsRes) ? myListingsRes : (myListingsRes.results || []);

      const receivedOffersRes = await sellerAPI.getReceivedOffers().catch(() => ({ results: [] }));
      const receivedOffers = Array.isArray(receivedOffersRes) ? receivedOffersRes : (receivedOffersRes.results || []);

      // 새로운 제안 체크
      const newOffers = receivedOffers.filter((offer: any) => offer.status === 'pending');
      if (newOffers.length > 0) {
        setSalesNotice(`새로운 가격 제안 ${newOffers.length}건이 도착했습니다`);
      } else {
        const tradingItems = myListings.filter((item: any) => item.status === 'trading');
        if (tradingItems.length > 0) {
          setSalesNotice(`거래중인 상품 ${tradingItems.length}건을 확인해주세요`);
        }
      }

      // 구매 활동 체크
      const sentOffersRes = await buyerAPI.getMySentOffers().catch(() => ({ results: [] }));
      const sentOffers = Array.isArray(sentOffersRes) ? sentOffersRes : (sentOffersRes.results || []);

      const acceptedOffers = sentOffers.filter((offer: any) => offer.status === 'accepted');
      if (acceptedOffers.length > 0) {
        setPurchaseNotice(`제안이 수락되었습니다! 거래를 진행해주세요`);
      }

      // 찜 개수
      const favorites = await buyerAPI.getFavorites().catch(() => ({ items: [] }));
      const favoriteItems = favorites.items || favorites.results || [];
      setFavoritesCount(favoriteItems.length || 0);

    } catch (error) {
      console.error('Failed to check activity notices:', error);
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
        {salesNotice && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded-r-lg">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">{salesNotice}</span>
            </div>
          </div>
        )}
        <SalesActivityTab />
      </TabsContent>

      <TabsContent value="purchases" className="space-y-4">
        {purchaseNotice && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mb-4 rounded-r-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-800">{purchaseNotice}</span>
            </div>
          </div>
        )}
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