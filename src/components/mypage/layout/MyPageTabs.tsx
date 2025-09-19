'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, ShoppingCart, MessageSquare, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SalesActivityTab from '../sales/SalesActivityTab';
import PurchaseActivityTab from '../purchases/PurchaseActivityTab';
import ReviewsTab from '../reviews/ReviewsTab';
import FavoritesTab from '../favorites/FavoritesTab';
import { buyerAPI, sellerAPI } from '@/lib/api/used';
import { cn } from '@/lib/utils';

interface StatusCounts {
  sales: {
    active: number;
    reserved: number;
    sold: number;
    hidden: number;
  };
  purchases: {
    offers: number;
    trading: number;
    completed: number;
  };
}

export default function MyPageTabs() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    sales: { active: 0, reserved: 0, sold: 0, hidden: 0 },
    purchases: { offers: 0, trading: 0, completed: 0 }
  });
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [sectionData, setSectionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 상태별 카운트 조회
  const fetchStatusCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // 판매 내역 카운트
      try {
        const salesData = await sellerAPI.getMyListings();
        const salesItems = salesData.results || salesData.items || [];

        const salesCount = {
          active: salesItems.filter((item: any) => item.status === 'for_sale').length,
          reserved: salesItems.filter((item: any) => item.status === 'reserved').length,
          sold: salesItems.filter((item: any) => item.status === 'sold').length,
          hidden: salesItems.filter((item: any) => item.status === 'hidden').length,
        };

        setStatusCounts(prev => ({ ...prev, sales: salesCount }));
      } catch (error) {
        console.error('Failed to fetch sales counts:', error);
      }

      // 구매 내역 카운트
      try {
        const purchaseData = await buyerAPI.getMySentOffers();
        const purchaseItems = purchaseData.results || purchaseData.items || [];

        const purchaseCount = {
          offers: purchaseItems.filter((item: any) => item.status === 'pending').length,
          trading: purchaseItems.filter((item: any) =>
            item.status === 'accepted' && item.phone?.status === 'trading'
          ).length,
          completed: purchaseItems.filter((item: any) =>
            item.status === 'accepted' && item.phone?.status === 'sold'
          ).length,
        };

        setStatusCounts(prev => ({ ...prev, purchases: purchaseCount }));
      } catch (error) {
        console.error('Failed to fetch purchase counts:', error);
      }

      // 찜 개수
      try {
        const favorites = await buyerAPI.getFavorites().catch(() => ({ items: [] }));
        const favoriteItems = favorites.items || favorites.results || [];
        setFavoritesCount(favoriteItems.length || 0);
      } catch (error) {
        console.error('Failed to fetch favorites count:', error);
      }

      // 거래후기 개수 (임시 - 실제 API 연결 필요)
      setReviewsCount(23);

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

      // 판매 내역
      if (section.startsWith('sales-')) {
        const status = section.replace('sales-', '');
        const salesData = await sellerAPI.getMyListings();
        const allItems = salesData.results || salesData.items || [];

        switch(status) {
          case 'active':
            data = allItems.filter((item: any) => item.status === 'for_sale');
            break;
          case 'reserved':
            data = allItems.filter((item: any) => item.status === 'reserved');
            break;
          case 'sold':
            data = allItems.filter((item: any) => item.status === 'sold');
            break;
          case 'hidden':
            data = allItems.filter((item: any) => item.status === 'hidden');
            break;
        }
      }

      // 구매 내역
      else if (section.startsWith('purchase-')) {
        const status = section.replace('purchase-', '');
        const purchaseData = await buyerAPI.getMySentOffers();
        const allItems = purchaseData.results || purchaseData.items || [];

        switch(status) {
          case 'offers':
            data = allItems.filter((item: any) => item.status === 'pending');
            break;
          case 'trading':
            data = allItems.filter((item: any) =>
              item.status === 'accepted' && item.phone?.status === 'trading'
            );
            break;
          case 'completed':
            data = allItems.filter((item: any) =>
              item.status === 'accepted' && item.phone?.status === 'sold'
            );
            break;
        }
      }

      setSectionData(data);
    } catch (error) {
      console.error('Failed to fetch section data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {/* 상단 버튼 영역 */}
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFavoritesModal(true)}
          className="flex items-center gap-2"
        >
          <Heart className="w-4 h-4" />
          찜 목록 ({favoritesCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReviewsModal(true)}
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          거래후기 ({reviewsCount})
        </Button>
      </div>

      {/* 판매내역 테이블 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">판매내역</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleSectionClick('sales-active')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-active' && "bg-blue-50 border-blue-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">판매중</div>
            <div className="text-xl font-bold">{statusCounts.sales.active}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-reserved')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-reserved' && "bg-orange-50 border-orange-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">예약중</div>
            <div className="text-xl font-bold">{statusCounts.sales.reserved}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-sold')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-sold' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">거래완료</div>
            <div className="text-xl font-bold">{statusCounts.sales.sold}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-hidden')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-hidden' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">숨김</div>
            <div className="text-xl font-bold">{statusCounts.sales.hidden}</div>
          </button>
        </div>
      </Card>

      {/* 구매내역 테이블 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">구매내역</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSectionClick('purchase-offers')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-offers' && "bg-purple-50 border-purple-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">제안중</div>
            <div className="text-xl font-bold">{statusCounts.purchases.offers}</div>
          </button>
          <button
            onClick={() => handleSectionClick('purchase-trading')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-trading' && "bg-green-50 border-green-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">거래중</div>
            <div className="text-xl font-bold">{statusCounts.purchases.trading}</div>
          </button>
          <button
            onClick={() => handleSectionClick('purchase-completed')}
            className={cn(
              "p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-completed' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600 mb-1">구매완료</div>
            <div className="text-xl font-bold">{statusCounts.purchases.completed}</div>
          </button>
        </div>
      </Card>

      {/* 선택된 섹션 리스트 */}
      {activeSection && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {activeSection.includes('sales') ? '판매 ' : '구매 '}
              {activeSection.includes('active') && '판매중 상품'}
              {activeSection.includes('reserved') && '예약중 상품'}
              {activeSection.includes('sold') && '거래완료 상품'}
              {activeSection.includes('hidden') && '숨김 상품'}
              {activeSection.includes('offers') && '제안중 상품'}
              {activeSection.includes('trading') && '거래중 상품'}
              {activeSection.includes('completed') && '구매완료 상품'}
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
              {/* 기존 컴포넌트 재사용 또는 새로운 리스트 컴포넌트 */}
              <div className="space-y-3">
                {paginatedData.map((item: any) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.images?.[0] && (
                        <img
                          src={item.images[0].image_url || item.phone?.images?.[0]?.image_url}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title || item.phone?.title}</h4>
                        <p className="text-sm text-gray-600">
                          {(item.price || item.phone?.price || item.offered_price || 0).toLocaleString()}원
                        </p>
                      </div>
                      <Badge variant={
                        item.status === 'for_sale' || item.status === 'active' ? 'default' :
                        item.status === 'trading' ? 'secondary' :
                        item.status === 'sold' ? 'outline' :
                        item.status === 'pending' ? 'default' :
                        item.status === 'accepted' ? 'secondary' :
                        'outline'
                      }>
                        {item.status === 'for_sale' && '판매중'}
                        {item.status === 'reserved' && '예약중'}
                        {item.status === 'sold' && '거래완료'}
                        {item.status === 'hidden' && '숨김'}
                        {item.status === 'pending' && '제안중'}
                        {item.status === 'accepted' && item.phone?.status === 'trading' && '거래중'}
                        {item.status === 'accepted' && item.phone?.status === 'sold' && '구매완료'}
                      </Badge>
                    </div>
                  </div>
                ))}
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
              거래후기 ({reviewsCount})
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <ReviewsTab />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}