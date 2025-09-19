'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, ShoppingCart, MessageSquare, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SalesActivityTab from '../sales/SalesActivityTab';
import PurchaseActivityTab from '../purchases/PurchaseActivityTab';
import ReviewsTab from '../reviews/ReviewsTab';
import FavoritesTab from '../favorites/FavoritesTab';
import { buyerAPI, sellerAPI } from '@/lib/api/used';
import { cn } from '@/lib/utils';

export default function MyPageTabs() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'sales';
  });
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [salesNotifications, setSalesNotifications] = useState(0); // 판매 알림 (제안, 거래중)
  const [purchaseNotifications, setPurchaseNotifications] = useState(0); // 구매 알림 (거래중)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // URL 파라미터 변경 감지
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 알림 체크 함수
  const checkNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // 판매 내역 알림 체크
      try {
        const salesData = await sellerAPI.getMyListings();
        const salesItems = salesData.results || salesData.items || [];

        // 현재 활성 상태인 제안이나 거래중인 상품만 카운트
        const notificationCount = salesItems.filter((item: any) => {
          // 거래중 상태이거나, 제안이 있는 판매중 상품만
          if (item.status === 'trading') return true;
          if (item.status === 'for_sale' && item.offer_count > 0) return true;
          return false;
        }).length;

        setSalesNotifications(notificationCount);
      } catch (error) {
        console.error('Failed to check sales notifications:', error);
      }

      // 구매 내역 알림 체크
      try {
        const purchaseData = await buyerAPI.getMySentOffers();
        const purchaseItems = purchaseData.results || purchaseData.items || [];

        // 현재 거래중인 제안만 카운트 (완료된 거래 제외)
        const tradingCount = purchaseItems.filter((item: any) => {
          // 수락된 제안이면서 상품이 거래중 상태인 경우만
          return item.status === 'accepted' && item.phone?.status === 'trading';
        }).length;

        setPurchaseNotifications(tradingCount);
      } catch (error) {
        console.error('Failed to check purchase notifications:', error);
      }

      // 찜 개수
      try {
        const favorites = await buyerAPI.getFavorites().catch(() => ({ items: [] }));
        const favoriteItems = favorites.items || favorites.results || [];
        setFavoritesCount(favoriteItems.length || 0);
      } catch (error) {
        console.error('Failed to check favorites count:', error);
      }
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  }, []);

  // 초기 로드 및 폴링 설정
  useEffect(() => {
    checkNotifications();

    // 30초마다 폴링 (최적화를 위해 탭이 활성 상태일 때만)
    pollingIntervalRef.current = setInterval(() => {
      if (!document.hidden) { // 페이지가 보이는 상태일 때만
        checkNotifications();
      }
    }, 30000); // 30초

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [checkNotifications]);

  // 탭 변경 시 즉시 업데이트
  useEffect(() => {
    checkNotifications();
  }, [activeTab, checkNotifications]);

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
          <span className="text-sm font-medium relative">
            판매내역
            {salesNotifications > 0 && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {salesNotifications}
              </span>
            )}
          </span>
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
          <span className="text-sm font-medium relative">
            구매내역
            {purchaseNotifications > 0 && (
              <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {purchaseNotifications}
              </span>
            )}
          </span>
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