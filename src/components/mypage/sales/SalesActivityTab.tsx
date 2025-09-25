'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, Heart, MessageCircle, MoreVertical, Edit, Trash2, User, Banknote, Clock, CheckCircle, Phone, Mail, MapPin, Info, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sellerAPI } from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';
import { useToast } from '@/hooks/use-toast';
import ReceivedOffersModal from './ReceivedOffersModal';
import ReviewModal from '@/components/used/ReviewModal';
import { executeTransactionAction, TransactionPollingManager } from '@/lib/utils/transactionHelper';
import type { UnifiedMarketItem, PhoneItem, ElectronicsItem } from '@/types/market';
import { isPhoneItem, isElectronicsItem, getMainImageUrl, getItemTitle, getItemDetailUrl, getItemEditUrl } from '@/types/market';

// 통합 아이템 사용
type SalesItem = UnifiedMarketItem;

interface ReceivedOffer {
  id: number;
  buyer: {
    id: number;
    nickname: string;
    profile_image?: string;
    phone?: string;
    email?: string;
    region?: string;
  };
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'cancelled';
  created_at: string;
}

interface BuyerInfo {
  id: number;
  nickname: string;
  phone?: string;
  email?: string;
  region?: string;
  profile_image?: string;
  offered_price: number;
  message?: string;
}

export default function SalesActivityTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const { toast } = useToast();

  // URL 파라미터에 따라 초기 탭 설정
  const [activeTab, setActiveTab] = useState(() => {
    if (filterParam === 'trading') return 'trading';
    if (filterParam === 'offers') return 'offers';
    if (filterParam === 'sold') return 'sold';
    return 'active';
  });
  const [listings, setListings] = useState<UnifiedMarketItem[]>([]);
  const [allListings, setAllListings] = useState<UnifiedMarketItem[]>([]); // 전체 목록 캐시
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [selectedPhone, setSelectedPhone] = useState<SalesItem | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showBuyerInfoModal, setShowBuyerInfoModal] = useState(false);
  const [selectedBuyerInfo, setSelectedBuyerInfo] = useState<BuyerInfo | null>(null);
  const [loadingBuyerInfo, setLoadingBuyerInfo] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingItem, setCancellingItem] = useState<SalesItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [returnToSale, setReturnToSale] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    transactionId: number;
    buyerName: string;
    phoneInfo: SalesItem;
  } | null>(null);
  const [pollingManager] = useState(() => new TransactionPollingManager());

  // URL 파라미터 변경 감지하여 탭 업데이트
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'trading') {
      setActiveTab('trading');
    } else if (filter === 'offers') {
      setActiveTab('offers');
    } else if (filter === 'sold') {
      setActiveTab('sold');
    }
  }, [searchParams]);

  // 전체 목록 가져오기 (캐싱용) - 휴대폰과 전자제품 통합
  const fetchAllListings = async () => {
    try {
      console.log('=== fetchAllListings 호출 (status 없이 전체) ===');

      // 병렬로 휴대폰과 전자제품 데이터 가져오기 (전체)
      const [phoneData, electronicsData] = await Promise.all([
        sellerAPI.getMyListings().catch((err) => {
          console.error('Phone API error:', err);
          return { results: [] };
        }),
        electronicsApi.getMyListings().catch((err) => {
          console.error('Electronics API error:', err);
          return { results: [] };
        })
      ]);

      console.log('Phone data:', phoneData);
      console.log('Electronics data:', electronicsData);

      // 데이터 정규화 및 타입 추가
      const phones: PhoneItem[] = (Array.isArray(phoneData) ? phoneData : (phoneData.results || []))
        .map((item: any) => ({ ...item, itemType: 'phone' as const }));
      const electronics: ElectronicsItem[] = (Array.isArray(electronicsData) ? electronicsData : (electronicsData.results || []))
        .map((item: any) => {
          console.log('Processing electronics item:', item);
          return { ...item, itemType: 'electronics' as const };
        });

      console.log('Processed phones:', phones.length, phones);
      console.log('Processed electronics:', electronics.length, electronics);

      // 통합 및 날짜순 정렬
      const allItems = [...phones, ...electronics].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('All items:', allItems.length, allItems);
      setAllListings(allItems); // 전체 목록 캐싱
      return allItems;
    } catch (error) {
      console.error('Failed to fetch all listings:', error);
      return [];
    }
  };

  // 판매 상품 목록 조회 (상태별 필터링)
  const fetchListings = async (status?: string) => {
    setLoading(true);
    try {
      console.log('=== fetchListings 호출 ===');
      console.log('status 파라미터:', status);

      // 전체 목록을 먼저 가져오기 (캐시 업데이트)
      await fetchAllListings();

      // 병렬로 휴대폰과 전자제품 데이터 가져오기 (상태별)
      const [phoneData, electronicsData] = await Promise.all([
        sellerAPI.getMyListings(status).catch((err) => {
          console.error('Phone API error:', err);
          return { results: [] };
        }),
        electronicsApi.getMyListings({ status }).catch((err) => {
          console.error('Electronics API error:', err);
          return { results: [] };
        })
      ]);

      console.log('Status filtered phone data:', phoneData);
      console.log('Status filtered electronics data:', electronicsData);

      // 데이터 정규화 및 타입 추가
      const phones: PhoneItem[] = (Array.isArray(phoneData) ? phoneData : (phoneData.results || []))
        .map((item: any) => ({ ...item, itemType: 'phone' as const }));
      const electronics: ElectronicsItem[] = (Array.isArray(electronicsData) ? electronicsData : (electronicsData.results || []))
        .map((item: any) => {
          console.log('Processing electronics item:', item);
          return { ...item, itemType: 'electronics' as const };
        });

      // 통합 및 날짜순 정렬
      const filteredItems = [...phones, ...electronics].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      console.log('Filtered items for listings:', filteredItems.length, filteredItems);
      setListings(filteredItems);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setListings([]);
      toast({
        title: '데이터 로드 실패',
        description: '판매 상품 목록을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 받은 제안 조회 - 타입에 따라 다른 API 호출
  const fetchReceivedOffers = async (item: UnifiedMarketItem) => {
    try {
      let data;
      if (isPhoneItem(item)) {
        data = await sellerAPI.getReceivedOffers(item.id);
      } else {
        data = await electronicsApi.getOffers(item.id);
      }
      const offers = Array.isArray(data) ? data : (data.results || []);
      setReceivedOffers(offers);
      setShowOffersModal(true);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      // 에러 발생 시 빈 배열로 설정
      setReceivedOffers([]);
      setShowOffersModal(true);
      toast({
        title: '제안 로드 실패',
        description: '받은 제안을 불러올 수 없습니다.',
        variant: 'destructive',
      });
    }
  };

  // 제안 응답 (수락만 가능)
  const handleOfferResponse = async (offerId: number, action: 'accept') => {
    await executeTransactionAction(
      () => sellerAPI.respondToOffer(offerId, action),
      {
        successMessage: '제안을 수락했습니다. 거래가 시작됩니다.',
        onSuccess: () => {
          setShowOffersModal(false);
          setSelectedPhone(null);
        },
        onRefresh: fetchAllListings,
        onTabChange: setActiveTab,
      }
    );
  };

  // 거래 진행 (수락된 제안을 거래중으로 전환)
  const handleProceedTrade = async (offerId: number) => {
    try {
      await sellerAPI.proceedTrade(offerId);
      toast({
        title: '거래 시작',
        description: '거래가 시작되었습니다. 구매자 정보를 확인해주세요.',
      });
      setShowOffersModal(false);
      setSelectedPhone(null);
      fetchListings(); // 목록 새로고침
    } catch (error) {
      toast({
        title: '오류',
        description: '거래 진행에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 페이지 변경 시 스크롤 위치 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // 탭 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // 상태별 데이터 필터링
  useEffect(() => {
    if (activeTab === 'offers') {
      // 받은제안 탭 선택 시 전체 상품 목록 조회 (offer_count가 있는 상품만 표시)
      fetchListings(); // status 없이 전체 조회
    } else {
      const statusMap: { [key: string]: string } = {
        active: 'active',
        trading: 'trading',
        sold: 'sold',
      };
      fetchListings(statusMap[activeTab]);
    }
  }, [activeTab]);

  // 실시간 상태 동기화 폴링 (거래중 탭에서만)
  useEffect(() => {
    if (activeTab === 'trading') {
      // 거래중 탭에서만 폴링 (30초 간격, 유휴시 자동 증가)
      pollingManager.start(() => {
        fetchAllListings();
      }, 30000);
    } else if (activeTab === 'offers') {
      // 제안 탭에서는 더 긴 간격 (1분)
      pollingManager.start(() => {
        fetchAllListings();
      }, 60000);
    } else {
      // 다른 탭에서는 폴링 중지
      pollingManager.stop();
    }

    // 컴포넌트 언마운트 시 폴링 중지
    return () => {
      pollingManager.stop();
    };
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge variant="default">판매중</Badge>,
      trading: <Badge variant="warning">거래중</Badge>,
      sold: <Badge variant="soft">거래완료</Badge>,
    };
    return badges[status as keyof typeof badges];
  };

  const getTabCount = (status: string) => {
    // 전체 목록에서 카운트 계산
    return allListings.filter(item => item.status === status).length;
  };

  // 판매 완료 처리
  const handleCompleteTransaction = async (item: UnifiedMarketItem) => {
    await executeTransactionAction(
      async () => {
        const token = localStorage.getItem('accessToken');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
        const apiUrl = isPhoneItem(item)
          ? `${baseUrl}/used/phones/${item.id}/complete-trade/`
          : `${baseUrl}/used/electronics/${item.id}/complete-transaction/`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw { response: { data: errorData } };
        }

        const data = await response.json();
        return data;
      },
      {
        successMessage: '거래가 완료되었습니다.',
        onSuccess: () => {
          // 거래완료 탭으로 이동
          setTimeout(() => {
            setActiveTab('sold');
            fetchListings('sold');
          }, 500);
        },
      }
    );
  };

  // 거래 취소 모달 열기
  const openCancelModal = (item: SalesItem) => {
    setCancellingItem(item);
    setCancellationReason('');
    setCustomReason('');
    setReturnToSale(true);
    setShowCancelModal(true);
  };

  // 거래 취소 처리
  const handleCancelTransaction = async () => {
    console.log('🔥 handleCancelTransaction 함수가 호출되었습니다!');
    if (!cancellingItem) return;

    if (!cancellationReason) {
      toast({
        title: '오류',
        description: '취소 사유를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (cancellationReason === 'other' && !customReason.trim()) {
      toast({
        title: '오류',
        description: '기타 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const itemId = cancellingItem.id;
    const itemType = isPhoneItem(cancellingItem) ? 'phone' : 'electronics';

    // 디버그 로그 추가
    console.log('=== SalesActivityTab 취소 요청 데이터 ===');
    console.log('itemType:', itemType);
    console.log('itemId:', itemId);
    console.log('cancellationReason:', cancellationReason);
    console.log('customReason:', customReason);
    console.log('returnToSale:', returnToSale);

    // 새로고침 전에 확인 가능한 alert
    alert(`취소 요청 데이터:\nitemType: ${itemType}\nreason: ${cancellationReason}\ncustomReason: ${customReason}`);

    await executeTransactionAction(
      async () => {
        const token = localStorage.getItem('accessToken');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
        const apiUrl = itemType === 'phone'
          ? `${baseUrl}/used/phones/${itemId}/cancel-trade/`
          : `${baseUrl}/used/electronics/${itemId}/cancel-trade/`;

        console.log('API URL:', apiUrl);

        const requestData = {
          reason: cancellationReason,
          custom_reason: cancellationReason === 'other' ? customReason : null,
          return_to_sale: returnToSale
        };

        console.log('Request data:', requestData);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          throw { response: { data: errorData } };
        }

        const responseData = await response.json();
        console.log('Success response data:', responseData);

        // 응답 데이터 반환
        return responseData;
      },
      {
        successMessage: returnToSale ? '거래가 취소되고 상품이 판매중으로 변경되었습니다.' : '거래가 취소되었습니다.',
        onSuccess: () => {
          setShowCancelModal(false);
          setCancellingItem(null);

          // 취소 성공 후 처리
          if (returnToSale) {
            // 판매중 탭으로 이동
            setTimeout(() => {
              setActiveTab('active');
              fetchListings('active');
            }, 500);
          } else {
            // 새로고침만
            fetchListings(activeTab === 'active' ? 'active' : activeTab === 'trading' ? 'trading' : undefined);
          }
        },
      }
    );
  };
  
  const getTotalOfferCount = () => {
    // 거래중이 아닌 상품들의 offer_count 합계 계산
    return allListings
      .filter(item => item.status !== 'trading')
      .reduce((sum, item) => sum + (item.offer_count || 0), 0);
  };

  // 거래 상대 정보 조회 - 타입에 따라 다른 API 호출
  const fetchBuyerInfo = async (item: UnifiedMarketItem) => {
    setLoadingBuyerInfo(true);
    try {
      let data;
      if (isPhoneItem(item)) {
        data = await sellerAPI.getBuyerInfo(item.id);
      } else {
        data = await electronicsApi.getBuyerInfo(item.id);
      }
      setSelectedBuyerInfo(data);
      setShowBuyerInfoModal(true);
    } catch (error) {
      console.error('Failed to fetch buyer info:', error);
      toast({
        title: '오류',
        description: '구매자 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBuyerInfo(false);
    }
  };

  // 후기 작성 모달 열기
  const openReviewModal = async (item: SalesItem) => {
    console.log('openReviewModal - item:', item);

    // transaction_id가 있으면 사용, 없으면 item.id 사용
    const transactionId = (item as any).transaction_id || item.id;
    console.log('Using transactionId:', transactionId);

    // buyer 정보가 있으면 사용, 없으면 기본값
    const buyerInfo = (item as any).buyer;
    const buyerName = buyerInfo?.nickname || buyerInfo?.username || '구매자';
    console.log('Buyer info:', buyerInfo, 'Buyer name:', buyerName);

    setReviewTarget({
      transactionId: transactionId,
      buyerName: buyerName,
      phoneInfo: item,
    });
    setShowReviewModal(true);
  };

  // 후기 작성 완료 후 콜백
  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setReviewTarget(null);
    // 필요시 목록 새로고침
    fetchAllListings();
  };

  // 페이징 처리된 데이터 계산
  const getPaginatedItems = (items: SalesItem[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // 총 페이지 수 계산
  const getTotalPages = (items: SalesItem[]) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // 페이지네이션 컴포넌트
  const Pagination = ({ items }: { items: SalesItem[] }) => {
    const totalPages = getTotalPages(items);

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pageNumbers = [];
      const maxVisible = 5; // 최대 표시 페이지 수

      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = Math.min(totalPages, startPage + maxVisible - 1);

      if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      return pageNumbers;
    };

    return (
      <div className="flex justify-center items-center gap-2 mt-6">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          이전
        </Button>

        {currentPage > 3 && totalPages > 5 && (
          <>
            <Button
              size="sm"
              variant={currentPage === 1 ? "default" : "outline"}
              onClick={() => setCurrentPage(1)}
              className="w-8 h-8 p-0"
            >
              1
            </Button>
            {currentPage > 4 && <span className="px-1">...</span>}
          </>
        )}

        {getPageNumbers().map((num) => (
          <Button
            key={num}
            size="sm"
            variant={currentPage === num ? "default" : "outline"}
            onClick={() => setCurrentPage(num)}
            className="w-8 h-8 p-0"
          >
            {num}
          </Button>
        ))}

        {currentPage < totalPages - 2 && totalPages > 5 && (
          <>
            {currentPage < totalPages - 3 && <span className="px-1">...</span>}
            <Button
              size="sm"
              variant={currentPage === totalPages ? "default" : "outline"}
              onClick={() => setCurrentPage(totalPages)}
              className="w-8 h-8 p-0"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          다음
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">판매 내역</h3>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              판매중 ({getTabCount('active')})
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs sm:text-sm">
              받은제안 ({getTotalOfferCount()})
            </TabsTrigger>
            <TabsTrigger value="trading" className="text-xs sm:text-sm">
              거래중 ({getTabCount('trading')})
            </TabsTrigger>
            <TabsTrigger value="sold" className="text-xs sm:text-sm">
              거래완료 ({getTabCount('sold')})
            </TabsTrigger>
          </TabsList>

          {/* 판매중 탭 */}
          <TabsContent value="active" className="space-y-3">
            {loading ? (
              <div className="text-center py-8">로딩중...</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                판매중인 상품이 없습니다
              </div>
            ) : (
              <>
                {getPaginatedItems(listings).map((item) => (
                  <Card key={item.id} className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push(getItemDetailUrl(item))}
                      >
                        <Image
                          src={getMainImageUrl(item)}
                          alt={getItemTitle(item)}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div
                            className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => router.push(getItemDetailUrl(item))}
                          >
                            <h4 className="font-medium text-sm truncate hover:text-blue-600">
                              {getItemTitle(item)}
                            </h4>
                            <p className="text-base sm:text-lg font-semibold">
                              {item.price.toLocaleString()}원
                            </p>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            {item.view_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Heart className="w-3 h-3" />
                            {item.favorite_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <MessageCircle className="w-3 h-3" />
                            {item.offer_count}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPhone(item);
                              fetchReceivedOffers(item);
                            }}
                          >
                            제안 확인
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const editUrl = getItemEditUrl(item);
                              console.log('=== 판매내역 상품 수정 버튼 클릭 ===');
                              console.log('Item:', item);
                              console.log('Item Type:', item.itemType);
                              console.log('Edit URL:', editUrl);
                              console.log('Is Phone Item:', isPhoneItem(item));
                              console.log('Is Electronics Item:', isElectronicsItem(item));
                              router.push(editUrl);
                            }}
                          >
                            상품 수정
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                <Pagination items={listings} />
              </>
            )}
          </TabsContent>

          {/* 받은 제안 탭 - offer_count가 0보다 크고 거래중이 아닌 상품만 표시 */}
          <TabsContent value="offers" className="space-y-3">
            {listings.filter(item => item.offer_count > 0 && item.status !== 'trading' && item.status !== 'sold').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                받은 제안이 없습니다
              </div>
            ) : (
              <>
              {getPaginatedItems(listings.filter(item => item.offer_count > 0 && item.status !== 'trading' && item.status !== 'sold')).map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <Link href={getItemDetailUrl(item)} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <Image
                        src={getMainImageUrl(item)}
                        alt={getItemTitle(item)}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link href={getItemDetailUrl(item)} className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity">
                        <h4 className="font-medium text-sm truncate">
                          {getItemTitle(item)}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-600">
                        판매가: {item.price.toLocaleString()}원
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          제안 {item.offer_count}건
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPhone(item);
                            fetchReceivedOffers(item);
                          }}
                        >
                          제안 확인
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Pagination items={listings.filter(item => item.offer_count > 0 && item.status !== 'trading' && item.status !== 'sold')} />
              </>
            )}
          </TabsContent>

          {/* 거래중 탭 */}
          <TabsContent value="trading" className="space-y-3">
            {listings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                거래중인 상품이 없습니다
              </div>
            ) : (
              <>
              {getPaginatedItems(listings).map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <Link href={getItemDetailUrl(item)} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <Image
                        src={getMainImageUrl(item)}
                        alt={getItemTitle(item)}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <Link href={getItemDetailUrl(item)} className="cursor-pointer hover:opacity-80 transition-opacity">
                            <h4 className="font-medium text-sm truncate">
                              {getItemTitle(item)}
                            </h4>
                          </Link>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-gray-500">거래가격</span>
                            <p className="text-base font-semibold text-green-600">
                              {(item as any).final_offer_price ? (item as any).final_offer_price.toLocaleString() : item.price.toLocaleString()}원
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">거래중</Badge>
                      </div>
                      
                      {/* 거래 진행 상태 */}
                      <div className="bg-green-50 rounded-lg px-2 py-1.5 mb-3 text-xs inline-block">
                        <div className="flex items-center gap-1.5 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>구매자와 거래가 진행중입니다</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => fetchBuyerInfo(item)}
                            disabled={loadingBuyerInfo}
                          >
                            <User className="w-3.5 h-3.5" />
                            구매자 정보
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              if (confirm('판매를 완료하시겠습니까?')) {
                                handleCompleteTransaction(item);
                              }
                            }}
                          >
                            판매 완료
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 text-xs"
                          onClick={() => openCancelModal(item)}
                        >
                          거래 취소
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Pagination items={listings} />
              </>
            )}
          </TabsContent>

          {/* 거래완료 탭 */}
          <TabsContent value="sold" className="space-y-3">
            {listings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                거래완료된 상품이 없습니다
              </div>
            ) : (
              <>
              {getPaginatedItems(listings).map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <Link href={getItemDetailUrl(item)} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                      <Image
                        src={getMainImageUrl(item)}
                        alt={getItemTitle(item)}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <Link href={getItemDetailUrl(item)} className="cursor-pointer hover:opacity-80 transition-opacity">
                            <h4 className="font-medium text-sm truncate">
                              {getItemTitle(item)}
                            </h4>
                          </Link>
                          <p className="text-base font-semibold">
                            {item.price.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {(item as any).has_review === true ? (
                          <Button
                            size="sm"
                            disabled
                            className="text-xs bg-gray-200 hover:bg-gray-200 text-gray-600"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            후기작성완료
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewModal(item)}
                            className="text-xs"
                          >
                            후기 작성
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Pagination items={listings} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 받은 제안 모달 */}
      {selectedPhone && (
        <ReceivedOffersModal
          isOpen={showOffersModal}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedPhone(null);
          }}
          phone={selectedPhone as any}
          offers={receivedOffers}
          onRespond={handleOfferResponse}
          onProceedTrade={handleProceedTrade}
        />
      )}

      {/* 거래 취소 모달 */}
      {showCancelModal && cancellingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                거래 취소
              </h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingItem(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">상품: {getItemTitle(cancellingItem)}</p>
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
                  <option value="product_sold">다른 경로로 판매됨</option>
                  <option value="buyer_no_response">구매자 연락 두절</option>
                  <option value="buyer_no_show">구매자 약속 불이행</option>
                  <option value="payment_issue">결제 문제 발생</option>
                  <option value="buyer_unreasonable">구매자 무리한 요구</option>
                  <option value="schedule_conflict">거래 일정 조율 실패</option>
                  <option value="personal_reason">개인 사정으로 판매 불가</option>
                  <option value="buyer_cancel_request">구매자 취소 요청</option>
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">주의사항</span><br />
                  • 구매자에게 취소 알림이 전송됩니다<br />
                  • 취소 사유는 통계 자료로 활용됩니다<br />
                  • 빈번한 취소는 신뢰도에 영향을 줄 수 있습니다
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingItem(null);
                }}
                className="flex-1"
              >
                닫기
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelTransaction}
                className="flex-1"
              >
                거래 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 구매자 정보 모달 */}
      {showBuyerInfoModal && selectedBuyerInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">구매자 정보</h3>
              <button
                onClick={() => {
                  setShowBuyerInfoModal(false);
                  setSelectedBuyerInfo(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1">
              {/* 프로필 섹션 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  {selectedBuyerInfo.profile_image ? (
                    <Image
                      src={selectedBuyerInfo.profile_image}
                      alt={selectedBuyerInfo.nickname}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedBuyerInfo.nickname}</p>
                  <p className="text-sm text-gray-600">구매자</p>
                </div>
              </div>
              
              {/* 거래 정보 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800 mb-2">거래 진행중</p>
                <p className="text-lg font-bold text-green-700">
                  {selectedBuyerInfo.offered_price.toLocaleString()}원
                </p>
              </div>
              
              {/* 연락처 정보 */}
              <div className="space-y-3">
                {selectedBuyerInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedBuyerInfo.phone}</span>
                    <button
                      onClick={() => {
                        window.location.href = `tel:${selectedBuyerInfo.phone}`;
                      }}
                      className="ml-auto text-blue-600 text-sm hover:underline"
                    >
                      전화하기
                    </button>
                  </div>
                )}

                {selectedBuyerInfo.region && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedBuyerInfo.region}</span>
                  </div>
                )}
              </div>
              
              {/* 메시지 */}
              {selectedBuyerInfo.message && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">구매자 메시지</p>
                  <p className="text-sm">{selectedBuyerInfo.message}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p>• 거래 약속을 잡아 안전한 장소에서 만나세요</p>
                  <p>• 물품과 대금을 직접 확인 후 거래하세요</p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => {
                setShowBuyerInfoModal(false);
                setSelectedBuyerInfo(null);
              }}
              className="w-full mt-4"
            >
              확인
            </Button>
          </div>
        </div>
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
          revieweeName={reviewTarget.buyerName}
          productInfo={{
            brand: reviewTarget.phoneInfo.brand,
            model: isPhoneItem(reviewTarget.phoneInfo) ? reviewTarget.phoneInfo.model : (reviewTarget.phoneInfo as any).model_name || '',
            price: reviewTarget.phoneInfo.price,
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}