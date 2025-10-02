'use client';

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Package, ShoppingCart, MessageSquare, Heart, X, User, Phone, CheckCircle, XCircle, Info, MapPin, Eye, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// SalesActivityTab 컴포넌트는 사용하지 않음 - MyPageTabs 내부에서 직접 구현
import PurchaseActivityTab from '../purchases/PurchaseActivityTab';
import ReviewsTab from '../reviews/ReviewsTab';
import FavoritesTab from '../favorites/FavoritesTab';
import { buyerAPI, sellerAPI } from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';
import bumpAPI from '@/lib/api/bump';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReceivedOffersModal from '../sales/ReceivedOffersModal';
import BumpButton from '../sales/BumpButton';
import ReviewModal from '@/components/used/ReviewModal';
import type { UnifiedMarketItem, PhoneItem, ElectronicsItem } from '@/types/market';
import { isPhoneItem, isElectronicsItem, sortByDate, normalizeApiResponse } from '@/types/market';
import { getBrandNameKo } from '@/lib/brandNames';

interface StatusCounts {
  sales: {
    active: number;
    offers: number;
    trading: number;
    sold: number;
  };
  purchases: {
    offers: number;
    trading: number;
    completed: number;
  };
}

interface MyPageTabsProps {
  onCountsUpdate?: (favorites: number, reviews: number) => void;
}

const MyPageTabs = forwardRef<any, MyPageTabsProps>(({ onCountsUpdate }, ref) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    sales: { active: 0, offers: 0, trading: 0, sold: 0 },
    purchases: { offers: 0, trading: 0, completed: 0 }
  });
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [sectionData, setSectionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [initialSectionLoaded, setInitialSectionLoaded] = useState(false);

  // Modals and handlers
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [showSellerInfoModal, setShowSellerInfoModal] = useState(false);
  const [showBuyerInfoModal, setShowBuyerInfoModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedCompleteItem, setSelectedCompleteItem] = useState<UnifiedMarketItem | null>(null);
  const [selectedCancelItem, setSelectedCancelItem] = useState<UnifiedMarketItem | null>(null);
  const [isBuyerComplete, setIsBuyerComplete] = useState(false);
  const [showOfferCancelDialog, setShowOfferCancelDialog] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [returnToSale, setReturnToSale] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

  // 상태별 카운트 조회 (휴대폰 + 전자제품 통합)
  const fetchStatusCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // 판매 내역 카운트 (휴대폰 + 전자제품)
      try {
        // 병렬로 두 API 호출
        const [phoneData, electronicsData] = await Promise.all([
          sellerAPI.getMyListings().catch(() => ({ results: [] })),
          electronicsApi.getMyElectronics().catch(() => ({ results: [] }))
        ]);

        const phoneItems = Array.isArray(phoneData) ? phoneData : normalizeApiResponse(phoneData);
        const electronicsItems = Array.isArray(electronicsData) ? electronicsData : normalizeApiResponse(electronicsData);

        // 모든 아이템 병합
        const allSalesItems = [
          ...(phoneItems || []).map((item: any) => ({ ...item, itemType: 'phone' as const })),
          ...(electronicsItems || []).map((item: any) => ({ ...item, itemType: 'electronics' as const }))
        ];

        // 카운트 계산 - 전체 아이템 기준
        const salesCount = {
          active: allSalesItems.filter((item: any) => item.status === 'active').length,
          offers: allSalesItems.filter((item: any) => item.status !== 'trading' && item.status !== 'sold' && (item.offer_count || 0) > 0).length,
          trading: allSalesItems.filter((item: any) => item.status === 'trading').length,
          sold: allSalesItems.filter((item: any) => item.status === 'sold').length,
        };

        setStatusCounts(prev => ({ ...prev, sales: salesCount }));
      } catch (error) {
        console.error('Failed to fetch sales counts:', error);
      }

      // 구매 내역 카운트 (휴대폰 + 전자제품 통합)
      try {
        // 구매제안 카운트 - 병렬로 휴대폰과 전자제품 가져오기
        const [phoneOffersData, electronicsOffersData] = await Promise.all([
          buyerAPI.getMySentOffers().catch(() => ({ results: [] })),
          electronicsApi.getMySentOffers().catch(() => ({ results: [] }))
        ]);

        const phoneOffers = phoneOffersData.results || phoneOffersData.items || [];
        const electronicsOffers = electronicsOffersData.results || [];
        const allOffers = [...phoneOffers, ...electronicsOffers];
        const offersCount = allOffers.filter((item: any) => item.status === 'pending').length;

        // 거래중/거래완료 카운트 - 병렬로 가져오기
        const [phoneTradingData, electronicsTradingData] = await Promise.all([
          buyerAPI.getMyTradingItems().catch(() => ({ results: [] })),
          electronicsApi.getMyTradingItems().catch(() => ({ results: [] }))
        ]);

        const phoneTrading = Array.isArray(phoneTradingData) ? phoneTradingData : phoneTradingData.results || [];
        const electronicsTrading = Array.isArray(electronicsTradingData) ? electronicsTradingData : electronicsTradingData.results || [];
        const allTrading = [...phoneTrading, ...electronicsTrading];

        const purchaseCount = {
          offers: offersCount,
          trading: allTrading.filter((item: any) => {
            // 휴대폰과 전자제품 모두 고려
            const itemStatus = item.phone?.status || item.electronics?.status;
            return itemStatus === 'trading';
          }).length,
          completed: allTrading.filter((item: any) => {
            // 휴대폰과 전자제품 모두 고려
            const itemStatus = item.phone?.status || item.electronics?.status;
            return itemStatus === 'sold';
          }).length,
        };

        setStatusCounts(prev => ({ ...prev, purchases: purchaseCount }));
      } catch (error) {
        console.error('Failed to fetch purchase counts:', error);
      }

      // 찜 개수 (휴대폰 + 전자제품)
      try {
        const [phoneFavorites, electronicsFavorites] = await Promise.all([
          buyerAPI.getFavorites().catch(() => ({ items: [] })),
          electronicsApi.getFavorites().catch(() => ({ results: [] }))
        ]);

        const phoneFavItems = (phoneFavorites as any).items || (phoneFavorites as any).results || [];
        const elecFavItems = (electronicsFavorites as any).results || [];

        const totalFavorites = phoneFavItems.length + elecFavItems.length;
        setFavoritesCount(totalFavorites);

        // 부모 컴포넌트에 전달
        if (onCountsUpdate) {
          onCountsUpdate(totalFavorites, 0);
        }
      } catch (error) {
        console.error('Failed to fetch favorites count:', error);
      }


    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  }, []);

  // 섹션 클릭 핸들러
  const handleSectionClick = async (section: string) => {
    // 같은 섹션 클릭 시 토글
    if (activeSection === section) {
      setActiveSection(null);
      setSectionData([]);
      return;
    }

    setActiveSection(section);
    setLoading(true);
    setCurrentPage(1);

    try {
      let data: any[] = [];

      // 판매 내역 (휴대폰 + 전자제품 통합)
      if (section.startsWith('sales-')) {
        const status = section.replace('sales-', '');

        // 병렬로 휴대폰과 전자제품 데이터 가져오기
        const [phoneData, electronicsData] = await Promise.all([
          sellerAPI.getMyListings().catch(() => ({ results: [] })),
          electronicsApi.getMyElectronics().catch(() => ({ results: [] }))
        ]);

        const phoneItems = Array.isArray(phoneData) ? phoneData : (phoneData.results || []);
        const electronicsItems = Array.isArray(electronicsData) ? electronicsData : (electronicsData.results || []);

        // 타입 정보 추가하여 통합
        const allItems = [
          ...phoneItems.map((item: any) => ({ ...item, itemType: 'phone' as const })),
          ...electronicsItems.map((item: any) => ({ ...item, itemType: 'electronics' as const }))
        ].sort((a, b) => {
          // 끌올된 상품을 우선 정렬
          const aDate = a.last_bumped_at || a.created_at;
          const bDate = b.last_bumped_at || b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });

        switch(status) {
          case 'active':
            data = allItems.filter((item: any) => item.status === 'active');
            break;
          case 'offers':
            data = allItems.filter((item: any) => item.status !== 'trading' && item.status !== 'sold' && (item.offer_count || 0) > 0);
            break;
          case 'trading':
            data = allItems.filter((item: any) => item.status === 'trading');
            break;
          case 'sold':
            data = allItems.filter((item: any) => item.status === 'sold');
            break;
        }
      }

      // 구매 내역
      // 구매 내역 (휴대폰 + 전자제품 통합)
      else if (section.startsWith('purchase-')) {
        const status = section.replace('purchase-', '');

        if (status === 'completed' || status === 'trading') {
          // 거래중/거래완료는 my-trading API 사용 (has_review 포함)
          const [phoneTradingData, electronicsTradingData] = await Promise.all([
            buyerAPI.getMyTradingItems().catch(() => ({ results: [] })),
            electronicsApi.getMyTradingItems().catch(() => ({ results: [] }))
          ]);

          const phoneTrading = Array.isArray(phoneTradingData) ? phoneTradingData : phoneTradingData.results || [];
          const electronicsTrading = Array.isArray(electronicsTradingData) ? electronicsTradingData : electronicsTradingData.results || [];

          console.log('[DEBUG] phoneTrading data:', phoneTrading);
          console.log('[DEBUG] electronicsTrading data:', electronicsTrading);

          // 데이터 구조로 정확하게 타입 판단
          const allTradingItems = [
            ...phoneTrading.map((item: any) => {
              const itemType = item.phone ? 'phone' : 'electronics';
              console.log('[DEBUG] Phone API item - has phone:', !!item.phone, 'has electronics:', !!item.electronics, 'itemType:', itemType);
              return { ...item, itemType };
            }),
            ...electronicsTrading.map((item: any) => {
              const itemType = item.electronics ? 'electronics' : 'phone';
              console.log('[DEBUG] Electronics API item - has phone:', !!item.phone, 'has electronics:', !!item.electronics, 'itemType:', itemType);
              return { ...item, itemType };
            })
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          if (status === 'trading') {
            data = allTradingItems.filter((item: any) => {
              const itemStatus = item.phone?.status || item.electronics?.status;
              return itemStatus === 'trading';
            });
          } else {
            data = allTradingItems.filter((item: any) => {
              const itemStatus = item.phone?.status || item.electronics?.status;
              return itemStatus === 'sold';
            });
          }
        } else {
          // 구매제안은 sent API 사용
          const [phoneOffersData, electronicsOffersData] = await Promise.all([
            buyerAPI.getMySentOffers().catch(() => ({ results: [] })),
            electronicsApi.getMySentOffers().catch(() => ({ results: [] }))
          ]);

          const phoneOffers = phoneOffersData.results || phoneOffersData.items || [];
          const electronicsOffers = electronicsOffersData.results || [];

          // 타입 정보 추가하여 통합
          const allOffers = [
            ...phoneOffers.map((item: any) => ({ ...item, itemType: 'phone' as const })),
            ...electronicsOffers.map((item: any) => ({ ...item, itemType: 'electronics' as const }))
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          data = allOffers.filter((item: any) => item.status === 'pending');
        }
      }

      setSectionData(data);

      // 판매내역 섹션으로 스크롤 (PC, 모바일 모두)
      setTimeout(() => {
        const salesElement = document.getElementById('sales-section');
        if (salesElement) {
          const offsetTop = salesElement.offsetTop - 80; // 헤더 높이 고려
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to fetch section data:', error);
    } finally {
      setLoading(false);
    }
  };

  // URL 파라미터에서 초기 섹션 로드
  useEffect(() => {
    if (!initialSectionLoaded) {
      const section = searchParams.get('section');
      if (section) {
        // 유효한 섹션인지 확인
        const validSections = [
          'sales-active', 'sales-offers', 'sales-trading', 'sales-sold',
          'purchase-offers', 'purchase-trading', 'purchase-completed'
        ];

        if (validSections.includes(section)) {
          // 데이터 로드 후 섹션 열기
          setTimeout(() => {
            handleSectionClick(section);
          }, 500);
        }
      }
      setInitialSectionLoaded(true);
    }
  }, [searchParams, initialSectionLoaded]);

  // ref로 메서드 expose
  useImperativeHandle(ref, () => ({
    openFavoritesModal: () => setShowFavoritesModal(true),
    openReviewsModal: () => setShowReviewsModal(true)
  }));

  // 카운트 업데이트 시 부모 컴포넌트에 전달
  useEffect(() => {
    if (onCountsUpdate) {
      onCountsUpdate(favoritesCount, 0);  // reviewsCount는 사용하지 않으므로 0 전달
    }
  }, [favoritesCount, onCountsUpdate]);

  // 초기 로드
  useEffect(() => {
    fetchStatusCounts();

    // 30초마다 폴링
    pollingIntervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchStatusCounts();
      }
    }, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [fetchStatusCounts]);

  // 페이지네이션된 데이터
  const paginatedData = sectionData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(sectionData.length / itemsPerPage);

  return (
    <div className="w-full space-y-6">
      {/* 판매내역 테이블 */}
      <Card id="sales-section" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">판매내역</h3>
        </div>
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          <button
            onClick={() => handleSectionClick('sales-active')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-active' && "bg-blue-50 border-blue-500"
            )}
          >
            <div className="text-xs text-gray-600">판매중</div>
            <div className={cn("text-base sm:text-lg font-bold", statusCounts.sales.active > 0 && "text-green-600")}>{statusCounts.sales.active}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-offers')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-offers' && "bg-orange-50 border-orange-500"
            )}
          >
            <div className="text-xs text-gray-600">받은제안</div>
            <div className={cn("text-base sm:text-lg font-bold", statusCounts.sales.offers > 0 && "text-green-600")}>{statusCounts.sales.offers}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-trading')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-trading' && "bg-green-50 border-green-500"
            )}
          >
            <div className="text-xs text-gray-600">거래중</div>
            <div className={cn("text-base sm:text-lg font-bold", statusCounts.sales.trading > 0 && "text-green-600")}>{statusCounts.sales.trading}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-sold')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-sold' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600">판매완료</div>
            <div className="text-base sm:text-lg font-bold">{statusCounts.sales.sold}</div>
          </button>
        </div>
      </Card>

      {/* 구매내역 테이블 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">구매내역</h3>
        </div>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          <button
            onClick={() => handleSectionClick('purchase-offers')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-offers' && "bg-purple-50 border-purple-500"
            )}
          >
            <div className="text-xs text-gray-600">구매제안</div>
            <div className={cn("text-base sm:text-lg font-bold", statusCounts.purchases.offers > 0 && "text-green-600")}>{statusCounts.purchases.offers}</div>
          </button>
          <button
            onClick={() => handleSectionClick('purchase-trading')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-trading' && "bg-green-50 border-green-500"
            )}
          >
            <div className="text-xs text-gray-600">거래중</div>
            <div className={cn("text-base sm:text-lg font-bold", statusCounts.purchases.trading > 0 && "text-green-600")}>{statusCounts.purchases.trading}</div>
          </button>
          <button
            onClick={() => handleSectionClick('purchase-completed')}
            className={cn(
              "p-1.5 sm:p-2 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-completed' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600">거래완료</div>
            <div className="text-base sm:text-lg font-bold">{statusCounts.purchases.completed}</div>
          </button>
        </div>
      </Card>

      {/* 선택된 섹션 리스트 */}
      {activeSection && (
        <Card id="section-list" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {activeSection === 'sales-active' && '판매중'}
              {activeSection === 'sales-offers' && '받은제안'}
              {activeSection === 'sales-trading' && '거래중'}
              {activeSection === 'sales-sold' && '판매완료'}
              {activeSection === 'purchase-offers' && '구매제안'}
              {activeSection === 'purchase-trading' && '거래중'}
              {activeSection === 'purchase-completed' && '거래완료'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveSection(null);
                setSectionData([]);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩중...</div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">해당 상품이 없습니다.</div>
          ) : (
            <>
              {/* 섹션별 상세 리스트 */}
              <div className="space-y-3">
                {paginatedData.map((item: any) => {
                  // 판매중 상품 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'sales-active') {
                    // 타입에 따른 데이터 처리
                    const itemTitle = item.itemType === 'phone'
                      ? item.title || `${getBrandNameKo(item.brand)} ${item.model}`
                      : `${getBrandNameKo(item.brand)} ${item.model_name || item.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? item.images
                      : item.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.find((img: any) => img.is_main) || itemImages?.[0];
                    const editUrl = item.itemType === 'phone' ? `/used/${item.id}/edit` : `/used-electronics/${item.id}/edit`;
                    const detailUrl = item.itemType === 'phone' ? `/used/${item.id}` : `/used-electronics/${item.id}`;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded flex-shrink-0 cursor-pointer hover:opacity-80"
                              onClick={() => router.push(detailUrl)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4
                                  className="font-medium line-clamp-2 cursor-pointer hover:text-blue-600"
                                  onClick={() => router.push(detailUrl)}
                                >
                                  {itemTitle}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {item.price.toLocaleString()}원
                                </p>
                                {item.last_bumped_at && bumpAPI.getTimeUntilNextBumpFromLast(item.last_bumped_at) && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs text-gray-600">
                                      {bumpAPI.getTimeUntilNextBumpFromLast(item.last_bumped_at)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Badge variant="default" className="flex-shrink-0">판매중</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-0.5">
                                <Eye className="w-3 h-3" />
                                {item.view_count || 0}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Heart className="w-3 h-3" />
                                {item.favorite_count || 0}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MessageSquare className="w-3 h-3" />
                                {item.offer_count || 0}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  setSelectedPhone(item);
                                  try {
                                    // 타입에 따른 API 호출
                                    const data = item.itemType === 'phone'
                                      ? await sellerAPI.getReceivedOffers(item.id)
                                      : await electronicsApi.getOffers(item.id);
                                    setReceivedOffers(Array.isArray(data) ? data : (data.results || []));
                                    setShowOffersModal(true);
                                  } catch (error) {
                                    console.error('Failed to fetch offers:', error);
                                    toast('제안을 불러올 수 없습니다.');
                                  }
                                }}
                              >
                                제안 확인
                              </Button>
                              <BumpButton
                                item={item}
                                itemType={item.itemType}
                                redirectAfterBump={true}
                                onBumpSuccess={() => {
                                  // 끌올 성공 시 목록 새로고침
                                  handleSectionClick('sales-active');
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(editUrl)}
                              >
                                상품 수정
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 받은 제안 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'sales-offers') {
                    // 타입에 따른 데이터 처리
                    const itemTitle = item.itemType === 'phone'
                      ? item.title || `${getBrandNameKo(item.brand)} ${item.model}`
                      : `${getBrandNameKo(item.brand)} ${item.model_name || item.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? item.images
                      : item.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.find((img: any) => img.is_main) || itemImages?.[0];
                    const detailUrl = item.itemType === 'phone' ? `/used/${item.id}` : `/used-electronics/${item.id}`;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded flex-shrink-0 cursor-pointer hover:opacity-80"
                              onClick={() => router.push(detailUrl)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium line-clamp-2 cursor-pointer hover:text-blue-600"
                              onClick={() => router.push(detailUrl)}
                            >
                              {itemTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              판매가: {item.price.toLocaleString()}원
                            </p>
                            <Badge variant="outline" className="text-xs mt-1 flex-shrink-0">
                              제안 {item.offer_count}건
                            </Badge>
                            <div className="mt-2">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  setSelectedPhone(item);
                                  try {
                                    // 타입에 따른 API 호출
                                    const data = item.itemType === 'phone'
                                      ? await sellerAPI.getReceivedOffers(item.id)
                                      : await electronicsApi.getOffers(item.id);
                                    setReceivedOffers(Array.isArray(data) ? data : (data.results || []));
                                    setShowOffersModal(true);
                                  } catch (error) {
                                    console.error('Failed to fetch offers:', error);
                                    toast('제안을 불러올 수 없습니다.');
                                  }
                                }}
                              >
                                제안 확인
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 판매자 거래중 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'sales-trading') {
                    // 타입에 따른 데이터 처리
                    const itemTitle = item.itemType === 'phone'
                      ? item.title || `${getBrandNameKo(item.brand)} ${item.model}`
                      : `${getBrandNameKo(item.brand)} ${item.model_name || item.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? item.images
                      : item.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.find((img: any) => img.is_main) || itemImages?.[0];

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{itemTitle}</h4>
                              <Badge className="bg-green-100 text-green-700 flex-shrink-0">거래중</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              거래가격: {(item.final_offer_price || item.price).toLocaleString()}원
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchBuyerInfo(item)}
                              >
                                구매자 정보
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedCompleteItem(item);
                                  setShowCompleteDialog(true);
                                }}
                              >
                                판매 완료
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => handleCancelTransaction(item)}
                              >
                                거래 취소
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 판매완료 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'sales-sold') {
                    // 타입에 따른 데이터 처리
                    const itemTitle = item.itemType === 'phone'
                      ? item.title || `${item.brand} ${item.model}`
                      : `${item.brand} ${item.model_name || item.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? item.images
                      : item.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.find((img: any) => img.is_main) || itemImages?.[0];
                    const detailUrl = item.itemType === 'phone' ? `/used/${item.id}` : `/used-electronics/${item.id}`;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => router.push(detailUrl)}
                            />
                          )}
                          <div className="flex-1">
                            <h4
                              className="font-medium truncate cursor-pointer hover:text-blue-600"
                              onClick={() => router.push(detailUrl)}
                            >
                              {itemTitle.slice(0, 30)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {(item.final_price || item.final_offer_price || item.price).toLocaleString()}원
                            </p>
                            <div className="mt-2">
                              {item.has_review ? (
                                <Button size="sm" disabled className="text-xs bg-gray-400 text-white">후기작성완료</Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => {
                                    // transaction_id가 있으면 사용, 없으면 item.id 사용
                                    const transactionId = (item as any).transaction_id || item.id;
                                    // buyer 정보가 있으면 사용
                                    const buyerInfo = (item as any).buyer;
                                    const buyerName = buyerInfo?.nickname || buyerInfo?.username || '구매자';

                                    setReviewTarget({
                                      transactionId: transactionId,
                                      revieweeName: buyerName,
                                      productInfo: {
                                        brand: item.brand || '',
                                        model: item.itemType === 'phone' ? (item.model || '') : (item.model_name || item.model || ''),
                                        price: item.price
                                      }
                                    });
                                    setShowReviewModal(true);
                                  }}
                                >
                                  후기 작성
                                </Button>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">판매완룼</Badge>
                        </div>
                      </div>
                    );
                  }

                  // 구매제안 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'purchase-offers') {
                    // 타입에 따른 데이터 처리
                    const targetItem = item.phone || item.electronics;
                    const itemTitle = item.itemType === 'phone'
                      ? targetItem?.title || `${getBrandNameKo(targetItem?.brand)} ${targetItem?.model}`
                      : `${getBrandNameKo(targetItem?.brand)} ${targetItem?.model_name || targetItem?.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? targetItem?.images
                      : targetItem?.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.[0];
                    const detailUrl = item.itemType === 'phone' ? `/used/${targetItem?.id}` : `/used-electronics/${targetItem?.id}`;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded flex-shrink-0 cursor-pointer hover:opacity-80"
                              onClick={() => router.push(detailUrl)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium line-clamp-2 cursor-pointer hover:text-blue-600"
                              onClick={() => router.push(detailUrl)}
                            >
                              {itemTitle}
                            </h4>
                            <p className="text-sm text-gray-600">
                              제안가: {(item.offered_price || item.offer_price || 0).toLocaleString()}원
                            </p>
                            {item.message && (
                              <div className="mt-2">
                                <button
                                  onClick={() => setExpandedMessage(
                                    expandedMessage === item.id ? null : item.id
                                  )}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  메시지 {expandedMessage === item.id ? '접기' : '보기'}
                                </button>
                                {expandedMessage === item.id && (
                                  <div className="mt-1 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-xs text-gray-700">{item.message}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-2">
                              {item.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedOfferId(item.id);
                                    setShowOfferCancelDialog(true);
                                  }}
                                >
                                  제안 취소
                                </Button>
                              )}
                            </div>
                          </div>
                          <Badge variant={item.status === 'pending' ? 'default' : 'secondary'} className="flex-shrink-0">
                            {item.status === 'pending' ? '대기중' : '수락됨'}
                          </Badge>
                        </div>
                      </div>
                    );
                  }

                  // 구매자 거래중 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'purchase-trading') {
                    // 타입에 따른 데이터 처리
                    const targetItem = item.phone || item.electronics;
                    const itemTitle = item.itemType === 'phone'
                      ? targetItem?.title || `${getBrandNameKo(targetItem?.brand)} ${targetItem?.model}`
                      : `${getBrandNameKo(targetItem?.brand)} ${targetItem?.model_name || targetItem?.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? targetItem?.images
                      : targetItem?.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.[0];
                    const detailUrl = item.itemType === 'phone' ? `/used/${targetItem?.id}` : `/used-electronics/${targetItem?.id}`;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4
                                className="font-medium truncate cursor-pointer hover:text-blue-600"
                                onClick={() => router.push(detailUrl)}
                              >
                                {itemTitle?.slice(0, 30)}
                              </h4>
                              <Badge className="bg-green-100 text-green-700 flex-shrink-0">거래중</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              거래가격: {(item.offered_price || item.offer_price || 0).toLocaleString()}원
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchSellerInfo(item)}
                              >
                                판매자 정보
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => handleCancelTransaction(item)}
                              >
                                거래 취소
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 구매완료 (휴대폰 + 전자제품 통합)
                  if (activeSection === 'purchase-completed') {
                    // 타입에 따른 데이터 처리
                    const targetItem = item.phone || item.electronics;
                    const itemTitle = item.itemType === 'phone'
                      ? targetItem?.title || `${targetItem?.brand} ${targetItem?.model}`
                      : `${targetItem?.brand} ${targetItem?.model_name || targetItem?.model || ''}`;
                    const itemImages = item.itemType === 'phone'
                      ? targetItem?.images
                      : targetItem?.images?.map((img: any) => ({ image_url: img.imageUrl || img.image_url, is_main: img.is_primary || img.is_main }));
                    const mainImage = itemImages?.[0];
                    const detailUrl = item.itemType === 'phone' ? `/used/${targetItem?.id}` : `/used-electronics/${targetItem?.id}`;

                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {mainImage && (
                            <img
                              src={mainImage.image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => router.push(detailUrl)}
                            />
                          )}
                          <div className="flex-1">
                            <h4
                              className="font-medium truncate cursor-pointer hover:text-blue-600"
                              onClick={() => router.push(detailUrl)}
                            >
                              {itemTitle?.slice(0, 30)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              거래가: {(item.offered_price || item.offer_price || targetItem?.price || 0).toLocaleString()}원
                            </p>
                            <div className="mt-2">
                              {item.has_review ? (
                                <Button size="sm" disabled className="text-xs bg-gray-400 text-white">후기작성완료</Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => {
                                    // transaction_id가 있으면 사용, 없으면 item.id 사용
                                    const transactionId = (item as any).transaction_id || item.id;

                                    setReviewTarget({
                                      transactionId: transactionId,
                                      revieweeName: targetItem?.seller?.nickname || '판매자',
                                      productInfo: {
                                        brand: targetItem?.brand || '',
                                        model: item.itemType === 'phone' ? (targetItem?.model || '') : (targetItem?.model_name || targetItem?.model || ''),
                                        price: item.offered_price || item.offer_price || targetItem?.price || 0 // 구매자는 offered_price 우선
                                      }
                                    });
                                    setShowReviewModal(true);
                                  }}
                                >
                                  후기 작성
                                </Button>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">거래완룼</Badge>
                        </div>
                      </div>
                    );
                  }

                  // 기본 리턴
                  return null;
                })}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* 찜 목록 모달 */}
      <Dialog open={showFavoritesModal} onOpenChange={setShowFavoritesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600" />
              찜 목록 ({favoritesCount})
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <FavoritesTab />
          </div>
        </DialogContent>
      </Dialog>

      {/* 거래후기 모달 */}
      <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              거래후기
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ReviewsTab />
          </div>
        </DialogContent>
      </Dialog>

      {/* 받은 제안 모달 */}
      {selectedPhone && (
        <ReceivedOffersModal
          isOpen={showOffersModal}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedPhone(null);
          }}
          phone={selectedPhone}
          offers={receivedOffers}
          onRespond={async (offerId, action) => {
            // 제안 수락 처리 - 타입에 따른 API 호출
            try {
              if (selectedPhone?.itemType === 'phone') {
                await sellerAPI.respondToOffer(offerId, action);
              } else if (selectedPhone?.itemType === 'electronics') {
                // 전자제품용 API 호출
                await electronicsApi.respondToOffer(offerId, action);
              }
              toast('제안을 수락했습니다. 거래가 시작됩니다.');
              setShowOffersModal(false);
              // 페이지 새로고침
              setTimeout(() => window.location.reload(), 500);
            } catch (error) {
              console.error('제안 응답 오류:', error);
              toast('제안 응답 중 오류가 발생했습니다.');
            }
          }}
          onProceedTrade={async (offerId) => {
            // 거래 진행 처리
            try {
              await sellerAPI.proceedTrade(offerId);
              toast('거래가 시작되었습니다.');
              setShowOffersModal(false);
              // 페이지 새로고침
              setTimeout(() => window.location.reload(), 500);
            } catch (error) {
              toast('거래 진행 중 오류가 발생했습니다.');
            }
          }}
        />
      )}

      {/* 후기 작성 모달 */}
      {showReviewModal && reviewTarget && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewTarget(null);
          }}
          transactionId={reviewTarget.transactionId}
          revieweeName={reviewTarget.revieweeName}
          productInfo={reviewTarget.productInfo}
          onSuccess={() => {
            setShowReviewModal(false);
            setReviewTarget(null);
            // 페이지 새로고침
            setTimeout(() => window.location.reload(), 500);
          }}
        />
      )}

      {/* 구매자 정보 모달 */}
      {showBuyerInfoModal && selectedUserInfo && (
        <Dialog open={showBuyerInfoModal} onOpenChange={setShowBuyerInfoModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>구매자 정보</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUserInfo.nickname}</p>
                  <p className="text-sm text-gray-600">구매자</p>
                </div>
              </div>
              <div className="space-y-3">
                {selectedUserInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedUserInfo.phone}</span>
                  </div>
                )}
                {selectedUserInfo.region && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm">지역: {selectedUserInfo.region}</span>
                  </div>
                )}
                {selectedUserInfo.offered_price && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">거래 진행중</p>
                    <p className="text-lg font-bold text-green-700">
                      {selectedUserInfo.offered_price.toLocaleString()}원
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 판매자 정보 모달 */}
      {showSellerInfoModal && selectedUserInfo && (
        <Dialog open={showSellerInfoModal} onOpenChange={setShowSellerInfoModal}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>판매자 정보</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedUserInfo.nickname}</p>
                  <p className="text-sm text-gray-600">판매자</p>
                </div>
              </div>
              <div className="space-y-3">
                {selectedUserInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedUserInfo.phone}</span>
                  </div>
                )}
                {selectedUserInfo.region && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm">지역: {selectedUserInfo.region}</span>
                  </div>
                )}
                {selectedUserInfo.accepted_price && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-green-800 mb-2">거래 진행중</p>
                    <p className="text-lg font-bold text-green-700">
                      {selectedUserInfo.accepted_price.toLocaleString()}원
                    </p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 거래 완료 확인 다이얼로그 */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래 완료 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {isBuyerComplete ? '구매를 완료하시겠습니까?' : '판매를 완료하시겠습니까?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedCompleteItem(null);
              setIsBuyerComplete(false);
            }}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedCompleteItem) {
                handleCompleteTransaction(selectedCompleteItem, !isBuyerComplete);
                setSelectedCompleteItem(null);
                setIsBuyerComplete(false);
              }
            }}>
              네
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 거래 취소 모달 */}
      {showCancelDialog && selectedCancelItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                거래 취소
              </h3>
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setSelectedCancelItem(null);
                  setCancellationReason('');
                  setCustomReason('');
                  setReturnToSale(true);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="text-red-500">거래를 취소하시겠습니까?</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">취소 사유 선택 *</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                >
                  <option value="">취소 사유를 선택하세요</option>
                  {activeSection?.startsWith('sales-') ? (
                    // 판매자 취소 사유
                    <>
                      <option value="buyer_no_response">구매자 연락 두절</option>
                      <option value="buyer_no_show">구매자 약속 불이행</option>
                      <option value="payment_issue">결제 문제 발생</option>
                      <option value="buyer_unreasonable">구매자 무리한 요구</option>
                      <option value="schedule_conflict">거래 일정 조율 실패</option>
                      <option value="personal_reason">개인 사정으로 판매 불가</option>
                      <option value="buyer_cancel_request">구매자 취소 요청</option>
                      <option value="product_sold">다른 경로로 판매됨</option>
                    </>
                  ) : (
                    // 구매자 취소 사유
                    <>
                      <option value="seller_no_response">판매자 연락 두절</option>
                      <option value="seller_no_show">판매자 약속 불이행</option>
                      <option value="product_issue">상품 상태 문제</option>
                      <option value="price_disagreement">가격 협의 실패</option>
                      <option value="schedule_conflict">거래 일정 조율 실패</option>
                      <option value="change_of_mind">단순 변심</option>
                    </>
                  )}
                  <option value="other">기타</option>
                </select>
              </div>

              {cancellationReason === 'other' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">기타 사유 입력 *</label>
                  <textarea
                    className="w-full p-2 border rounded-lg"
                    rows={3}
                    placeholder="취소 사유를 입력해주세요"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                </div>
              )}

              {activeSection?.startsWith('sales-') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="returnToSale"
                      checked={returnToSale}
                      onChange={(e) => setReturnToSale(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="returnToSale" className="text-sm">
                      <span className="font-medium">상품을 다시 판매중으로 전환</span>
                      <p className="text-gray-600 mt-1">
                        체크하면 상품이 다시 '판매중' 상태가 되어 다른 구매자들이 제안할 수 있습니다.
                      </p>
                    </label>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">주의사항</span><br />
                  • 상대방에게 취소 알림이 전송됩니다<br />
                  • 취소 사유는 통계 자료로 활용됩니다<br />
                  • 빈번한 취소는 신뢰도에 영향을 줄 수 있습니다
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setSelectedCancelItem(null);
                  setCancellationReason('');
                  setCustomReason('');
                  setReturnToSale(true);
                }}
                className="flex-1"
              >
                닫기
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!cancellationReason) {
                    toast('취소 사유를 선택해주세요.');
                    return;
                  }
                  if (cancellationReason === 'other' && !customReason.trim()) {
                    toast('기타 사유를 입력해주세요.');
                    return;
                  }
                  if (selectedCancelItem) {
                    handleCancelTransactionWithReason(selectedCancelItem);
                  }
                }}
                className="flex-1"
              >
                거래 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 제안 취소 확인 다이얼로그 */}
      <AlertDialog open={showOfferCancelDialog} onOpenChange={setShowOfferCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>제안 취소 확인</AlertDialogTitle>
            <AlertDialogDescription>
              제안을 취소하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOfferId(null)}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedOfferId) {
                handleCancelOffer(selectedOfferId);
                setSelectedOfferId(null);
              }
            }}>
              네
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // 액션 핸들러 함수들
  async function fetchReceivedOffers(phoneId: number) {
    try {
      const data = await sellerAPI.getReceivedOffers(phoneId);
      setReceivedOffers(Array.isArray(data) ? data : (data.results || []));
      setShowOffersModal(true);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      toast('제안을 불러올 수 없습니다.');
    }
  }

  async function handleCancelOffer(offerId: number) {
    try {
      await buyerAPI.cancelOffer(offerId);
      toast('제안이 취소되었습니다.');
      // 페이지 새로고침
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      toast('제안 취소 중 오류가 발생했습니다.');
    }
  }

  async function handleCompleteTransaction(item: UnifiedMarketItem, isSeller: boolean) {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = isSeller ? 'complete-trade' : 'buyer-complete';
      const basePath = item.itemType === 'phone' ? 'phones' : 'electronics';

      // 판매내역: item.id, 구매내역: item.phone.id / item.electronics.id
      const itemId = item.itemType === 'phone'
        ? ((item as any).phone?.id || item.id)
        : ((item as any).electronics?.id || item.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/used/${basePath}/${itemId}/${endpoint}/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast(isSeller ? '판매가 완료되었습니다.' : '구매가 완료되었습니다.');
        // 페이지 새로고침
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      toast('거래 완료 처리 중 오류가 발생했습니다.');
    }
  }

  async function handleCancelTransaction(item: UnifiedMarketItem) {
    setSelectedCancelItem(item);
    setShowCancelDialog(true);
  }

  async function handleCancelTransactionWithReason(item: UnifiedMarketItem) {
    try {
      const token = localStorage.getItem('accessToken');
      // 판매자와 구매자 구분
      const isSeller = activeSection?.startsWith('sales-');
      const basePath = item.itemType === 'phone' ? 'phones' : 'electronics';

      // 판매내역: item.id, 구매내역: item.phone.id / item.electronics.id
      const itemId = item.itemType === 'phone'
        ? ((item as any).phone?.id || item.id)
        : ((item as any).electronics?.id || item.id);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/used/${basePath}/${itemId}/cancel-trade/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: cancellationReason,
            custom_reason: cancellationReason === 'other' ? customReason : null,
            // 판매자만 returnToSale 옵션 사용, 구매자는 항상 true
            return_to_sale: isSeller ? returnToSale : true
          })
        }
      );

      if (response.ok) {
        if (isSeller) {
          toast(returnToSale ? '거래가 취소되고 상품이 판매중으로 변경되었습니다.' : '거래가 취소되었습니다.');
        } else {
          toast('거래가 취소되었습니다. 상품이 다시 판매중 상태가 되었습니다.');
        }
        setShowCancelDialog(false);
        setSelectedCancelItem(null);
        setCancellationReason('');
        setCustomReason('');
        setReturnToSale(true);
        // 페이지 새로고침
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      toast('거래 취소 중 오류가 발생했습니다.');
    }
  }

  async function fetchBuyerInfo(item: UnifiedMarketItem) {
    try {
      let data;
      let itemId;

      if (item.itemType === 'phone') {
        // 판매내역: item.id, 구매내역: item.phone.id
        itemId = (item as any).phone?.id || item.id;
        data = await sellerAPI.getBuyerInfo(itemId);
      } else {
        // 판매내역: item.id, 구매내역: item.electronics.id
        itemId = (item as any).electronics?.id || item.id;
        data = await electronicsApi.getBuyerInfo(itemId);
      }

      setSelectedUserInfo(data);
      setShowBuyerInfoModal(true);
    } catch (error: any) {
      console.error('Failed to fetch buyer info:', error);
      const errorMessage = error.response?.data?.error || '구매자 정보를 불러올 수 없습니다.';
      toast(errorMessage);
    }
  }

  async function fetchSellerInfo(item: UnifiedMarketItem) {
    try {
      console.log('[DEBUG] fetchSellerInfo - item:', item);
      console.log('[DEBUG] fetchSellerInfo - item.itemType:', item.itemType);
      console.log('[DEBUG] fetchSellerInfo - item.phone:', (item as any).phone);
      console.log('[DEBUG] fetchSellerInfo - item.electronics:', (item as any).electronics);
      console.log('[DEBUG] fetchSellerInfo - item.id:', item.id);

      let data;
      let itemId;

      if (item.itemType === 'phone') {
        // 판매내역: item.id, 구매내역: item.phone.id
        itemId = (item as any).phone?.id || item.id;
        console.log('[DEBUG] Using phone API with itemId:', itemId);
        data = await buyerAPI.getSellerInfo(itemId);
      } else {
        // 판매내역: item.id, 구매내역: item.electronics.id
        itemId = (item as any).electronics?.id || item.id;
        console.log('[DEBUG] Using electronics API with itemId:', itemId);
        data = await electronicsApi.getSellerInfo(itemId);
      }

      setSelectedUserInfo(data);
      setShowSellerInfoModal(true);
    } catch (error: any) {
      console.error('[ERROR] Failed to fetch seller info:', error);
      console.error('[ERROR] Error response:', error.response);
      console.error('[ERROR] Error data:', error.response?.data);
      const errorMessage = error.response?.data?.error || '판매자 정보를 불러올 수 없습니다.';
      toast(errorMessage);
    }
  }
});

MyPageTabs.displayName = 'MyPageTabs';

export default MyPageTabs;