'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Package, ShoppingCart, MessageSquare, Heart, X, User, Phone, CheckCircle, XCircle } from 'lucide-react';
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
import { toast } from 'sonner';
import ReceivedOffersModal from '../sales/ReceivedOffersModal';
import ReviewModal from '@/components/used/ReviewModal';

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

export default function MyPageTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    sales: { active: 0, offers: 0, trading: 0, sold: 0 },
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

  // Modals and handlers
  const [selectedPhone, setSelectedPhone] = useState<any>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [showSellerInfoModal, setShowSellerInfoModal] = useState(false);
  const [showBuyerInfoModal, setShowBuyerInfoModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<any>(null);

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
          active: salesItems.filter((item: any) => item.status === 'active' && item.offer_count === 0).length,
          offers: salesItems.filter((item: any) => item.status === 'active' && item.offer_count > 0).length,
          trading: salesItems.filter((item: any) => item.status === 'trading').length,
          sold: salesItems.filter((item: any) => item.status === 'sold').length,
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

      // 거래후기 개수 조회
      try {
        const reviewsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/used/reviews/my/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          const reviews = reviewsData.results || reviewsData.reviews || reviewsData;
          setReviewsCount(Array.isArray(reviews) ? reviews.length : 0);
        }
      } catch (error) {
        console.error('Failed to fetch reviews count:', error);
        setReviewsCount(0);
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

      // 판매 내역
      if (section.startsWith('sales-')) {
        const status = section.replace('sales-', '');
        const salesData = await sellerAPI.getMyListings();
        const allItems = salesData.results || salesData.items || [];

        switch(status) {
          case 'active':
            data = allItems.filter((item: any) => item.status === 'active' && item.offer_count === 0);
            break;
          case 'offers':
            data = allItems.filter((item: any) => item.status === 'active' && item.offer_count > 0);
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
      <div className="flex justify-end gap-1 sm:gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFavoritesModal(true)}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 border-gray-300 text-xs px-2 py-1.5"
        >
          <Heart className="w-3 h-3 text-red-500" />
          <span className="hidden sm:inline">찜 목록</span>
          <span className="sm:hidden">찜</span>
          <span className="text-gray-600">({favoritesCount})</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReviewsModal(true)}
          className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 border-gray-300 text-xs px-2 py-1.5"
        >
          <MessageSquare className="w-3 h-3" />
          <span className="hidden sm:inline">거래후기</span>
          <span className="sm:hidden">후기</span>
          <span className="text-gray-600">({reviewsCount})</span>
        </Button>
      </div>

      {/* 판매내역 테이블 */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">판매내역</h3>
        </div>
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          <button
            onClick={() => handleSectionClick('sales-active')}
            className={cn(
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-active' && "bg-blue-50 border-blue-500"
            )}
          >
            <div className="text-xs text-gray-600">판매중</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.sales.active}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-offers')}
            className={cn(
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-offers' && "bg-orange-50 border-orange-500"
            )}
          >
            <div className="text-xs text-gray-600">받은제안</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.sales.offers}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-trading')}
            className={cn(
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-trading' && "bg-green-50 border-green-500"
            )}
          >
            <div className="text-xs text-gray-600">거래중</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.sales.trading}</div>
          </button>
          <button
            onClick={() => handleSectionClick('sales-sold')}
            className={cn(
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'sales-sold' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600">판매완료</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.sales.sold}</div>
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
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-offers' && "bg-purple-50 border-purple-500"
            )}
          >
            <div className="text-xs text-gray-600">구매제안</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.purchases.offers}</div>
          </button>
          <button
            onClick={() => handleSectionClick('purchase-trading')}
            className={cn(
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-trading' && "bg-green-50 border-green-500"
            )}
          >
            <div className="text-xs text-gray-600">거래중</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.purchases.trading}</div>
          </button>
          <button
            onClick={() => handleSectionClick('purchase-completed')}
            className={cn(
              "p-2 sm:p-3 text-center border rounded-lg transition-all hover:bg-gray-50",
              activeSection === 'purchase-completed' && "bg-gray-100 border-gray-500"
            )}
          >
            <div className="text-xs text-gray-600">거래완료</div>
            <div className="text-lg sm:text-xl font-bold">{statusCounts.purchases.completed}</div>
          </button>
        </div>
      </Card>

      {/* 선택된 섹션 리스트 */}
      {activeSection && (
        <Card className="p-4">
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
                  // 판매중 상품
                  if (activeSection === 'sales-active') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.images?.[0] && (
                            <img
                              src={item.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-gray-600">
                              {item.price.toLocaleString()}원
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.href = `/used/${item.id}`}
                              >
                                제안 확인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.href = `/used/${item.id}/edit`}
                              >
                                상품 수정
                              </Button>
                            </div>
                          </div>
                          <Badge variant="default">판매중</Badge>
                        </div>
                      </div>
                    );
                  }

                  // 받은 제안
                  if (activeSection === 'sales-offers') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.images?.[0] && (
                            <img
                              src={item.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-gray-600">
                              판매가: {item.price.toLocaleString()}원
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              제안 {item.offer_count}건
                            </Badge>
                            <div className="mt-2">
                              <Button
                                size="sm"
                                onClick={() => window.location.href = `/used/${item.id}`}
                              >
                                제안 확인
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 판매자 거래중
                  if (activeSection === 'sales-trading') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.images?.[0] && (
                            <img
                              src={item.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-gray-600">
                              거래가격: {(item.final_offer_price || item.price).toLocaleString()}원
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline">구매자 정보</Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">판매 완료</Button>
                              <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">거래 취소</Button>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">거래중</Badge>
                        </div>
                      </div>
                    );
                  }

                  // 판매완료
                  if (activeSection === 'sales-sold') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.images?.[0] && (
                            <img
                              src={item.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-gray-600">
                              {item.price.toLocaleString()}원
                            </p>
                            <div className="mt-2">
                              {item.has_review ? (
                                <Button size="sm" disabled className="text-xs bg-gray-200">후기작성완료</Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => {
                                    setReviewTarget({
                                      transactionId: item.transaction_id || item.id,
                                      revieweeName: item.buyer?.nickname || '구매자',
                                      productInfo: {
                                        brand: item.brand || '',
                                        model: item.model || '',
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
                          <Badge variant="outline">판매완료</Badge>
                        </div>
                      </div>
                    );
                  }

                  // 구매제안
                  if (activeSection === 'purchase-offers') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.phone?.images?.[0] && (
                            <img
                              src={item.phone.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.phone?.title}</h4>
                            <p className="text-sm text-gray-600">
                              제안가: {item.offered_price.toLocaleString()}원
                            </p>
                            <div className="mt-2">
                              {item.status === 'pending' && (
                                <Button size="sm" variant="outline" className="text-red-600">제안 취소</Button>
                              )}
                            </div>
                          </div>
                          <Badge variant={item.status === 'pending' ? 'default' : 'secondary'}>
                            {item.status === 'pending' ? '대기중' : '수락됨'}
                          </Badge>
                        </div>
                      </div>
                    );
                  }

                  // 구매자 거래중
                  if (activeSection === 'purchase-trading') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.phone?.images?.[0] && (
                            <img
                              src={item.phone.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.phone?.title}</h4>
                            <p className="text-sm text-gray-600">
                              거래가격: {item.offered_price.toLocaleString()}원
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="outline">판매자 정보</Button>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">구매 완료</Button>
                              <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">거래 취소</Button>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">거래중</Badge>
                        </div>
                      </div>
                    );
                  }

                  // 구매완료
                  if (activeSection === 'purchase-completed') {
                    return (
                      <div key={item.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.phone?.images?.[0] && (
                            <img
                              src={item.phone.images[0].image_url}
                              alt=""
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.phone?.title}</h4>
                            <p className="text-sm text-gray-600">
                              {(item.phone?.price || item.offered_price).toLocaleString()}원
                            </p>
                            <div className="mt-2">
                              {item.has_review ? (
                                <Button size="sm" disabled className="text-xs bg-gray-200">후기작성완료</Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs"
                                  onClick={() => {
                                    setReviewTarget({
                                      transactionId: item.transaction_id || item.id,
                                      revieweeName: item.phone?.seller?.nickname || '판매자',
                                      productInfo: {
                                        brand: item.phone?.brand || '',
                                        model: item.phone?.model || '',
                                        price: item.phone?.price || item.offered_price
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
                          <Badge variant="outline">거래완료</Badge>
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
              거래후기 ({reviewsCount})
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
            // 제안 수락 처리
            try {
              await sellerAPI.respondToOffer(offerId, action);
              toast('제안을 수락했습니다. 거래가 시작됩니다.');
              setShowOffersModal(false);
              fetchStatusCounts();
            } catch (error) {
              toast('제안 응답 중 오류가 발생했습니다.');
            }
          }}
          onProceedTrade={async (offerId) => {
            // 거래 진행 처리
            try {
              await sellerAPI.proceedTrade(offerId);
              toast('거래가 시작되었습니다.');
              setShowOffersModal(false);
              fetchStatusCounts();
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
            fetchStatusCounts();
          }}
        />
      )}
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
      fetchStatusCounts();
    } catch (error) {
      toast('제안 취소 중 오류가 발생했습니다.');
    }
  }

  async function handleCompleteTransaction(phoneId: number, isSeller: boolean) {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = isSeller ? 'complete-trade' : 'buyer-complete';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/used/phones/${phoneId}/${endpoint}/`,
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
        fetchStatusCounts();
      }
    } catch (error) {
      toast('거래 완료 처리 중 오류가 발생했습니다.');
    }
  }

  async function handleCancelTransaction(phoneId: number) {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/used/phones/${phoneId}/cancel-trade/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: 'user_cancel',
            return_to_sale: true
          })
        }
      );

      if (response.ok) {
        toast('거래가 취소되었습니다.');
        fetchStatusCounts();
      }
    } catch (error) {
      toast('거래 취소 중 오류가 발생했습니다.');
    }
  }
}