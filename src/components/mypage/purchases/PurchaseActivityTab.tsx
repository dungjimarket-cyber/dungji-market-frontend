'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Heart, Clock, CheckCircle, XCircle, MessageSquare, Banknote, Phone, Mail, MapPin, Info, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buyerAPI } from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import ReviewModal from '@/components/used/ReviewModal';
import { executeTransactionAction, TransactionPollingManager } from '@/lib/utils/transactionHelper';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UnifiedMarketItem, PhoneItem, ElectronicsItem } from '@/types/market';
import { isPhoneItem, isElectronicsItem, getMainImageUrl, getItemDetailUrl } from '@/types/market';

interface OfferItem {
  id: number;
  itemType?: 'phone' | 'electronics'; // 아이템 타입 추가
  phone?: {
    id: number;
    title: string;
    brand: string;
    model: string;
    price: number;
    status?: 'active' | 'trading' | 'sold';
    images: { image_url: string; is_main: boolean }[];
    seller: {
      nickname: string;
    };
  };
  electronics?: {
    id: number;
    brand: string;
    model_name: string;
    price: number;
    status?: 'active' | 'trading' | 'sold';
    images: { imageUrl: string; is_primary: boolean }[];
    seller: {
      nickname: string;
    };
  };
  electronics_info?: {
    id: number;
    brand: string;
    model_name: string;
    price: number;
    status: string;
  };
  offered_price: number;
  offer_price?: number; // 전자제품용 필드
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}


interface TradingItem {
  id: number;
  itemType?: 'phone' | 'electronics';
  phone?: {
    id: number;
    title: string;
    brand: string;
    model: string;
    price: number;
    images: { image_url: string; is_main: boolean }[];
    status: 'trading' | 'sold' | 'active';
    seller_completed: boolean;
    buyer_completed: boolean;
    seller: {
      id: number;
      nickname: string;
      phone?: string;
      email?: string;
      region?: string;
    };
  };
  electronics?: {
    id: number;
    brand: string;
    model_name: string;
    price: number;
    images: { imageUrl: string; is_primary: boolean }[];
    status: 'trading' | 'sold' | 'active';
    seller_completed: boolean;
    buyer_completed: boolean;
    seller: {
      id: number;
      nickname: string;
      phone?: string;
      email?: string;
      region?: string;
    };
  };
  electronics_info?: {
    id: number;
    brand: string;
    model_name: string;
    price: number;
    status: string;
  };
  offered_price: number;
  offer_price?: number;
  status: 'accepted' | 'cancelled';
  created_at: string;
  has_review?: boolean;
}

interface SellerInfo {
  id: number;
  nickname: string;
  phone?: string;
  email?: string;
  region?: string;
  profile_image?: string;
  accepted_price: number;
}

// 헬퍼 함수들
const getItemFromOffer = (offer: OfferItem) => {
  return offer.phone || offer.electronics || offer.electronics_info;
};

const getItemId = (offer: OfferItem) => {
  const item = getItemFromOffer(offer);
  return item?.id || 0;
};

const getItemTitle = (offer: OfferItem) => {
  if (offer.phone) {
    return `${offer.phone.brand} ${offer.phone.model}`;
  } else if (offer.electronics) {
    return `${offer.electronics.brand} ${offer.electronics.model_name}`;
  } else if (offer.electronics_info) {
    return `${offer.electronics_info.brand} ${offer.electronics_info.model_name}`;
  }
  return '';
};

const getItemPrice = (offer: OfferItem | TradingItem) => {
  if ('phone' in offer && offer.phone) {
    return offer.phone.price;
  } else if ('electronics' in offer && offer.electronics) {
    return offer.electronics.price;
  } else if ('electronics_info' in offer && offer.electronics_info) {
    return offer.electronics_info.price;
  }
  return 0;
};

const getItemImages = (offer: OfferItem | TradingItem) => {
  if ('phone' in offer && offer.phone) {
    return offer.phone.images;
  } else if ('electronics' in offer && offer.electronics) {
    // 전자제품 이미지 배열 그대로 반환 (imageUrl, is_primary 사용)
    return offer.electronics.images;
  }
  // electronics_info doesn't have images, return empty array
  return [];
};

const getItemSeller = (offer: OfferItem | TradingItem) => {
  if ('phone' in offer && offer.phone) {
    return offer.phone.seller;
  } else if ('electronics' in offer && offer.electronics) {
    return offer.electronics.seller;
  }
  return { nickname: '알 수 없음' };
};

const getItemStatus = (offer: OfferItem | TradingItem) => {
  if ('phone' in offer && offer.phone) {
    return offer.phone.status;
  } else if ('electronics' in offer && offer.electronics) {
    return offer.electronics.status;
  } else if ('electronics_info' in offer && offer.electronics_info) {
    return offer.electronics_info.status;
  }
  return 'active';
};

const getItemUrl = (offer: OfferItem | TradingItem) => {
  const itemType = offer.itemType || (offer.phone ? 'phone' : 'electronics');
  const itemId = offer.phone?.id || offer.electronics?.id || offer.electronics_info?.id || 0;
  return itemType === 'phone' ? `/used/${itemId}` : `/used-electronics/${itemId}`;
};

// 필터 헬퍼 함수
const filterActiveOffers = (offers: OfferItem[]) => {
  return offers.filter(offer => {
    const status = getItemStatus(offer);
    return status !== 'trading' && status !== 'sold' && offer.status !== 'cancelled';
  });
};

const filterTradingItems = (items: TradingItem[]) => {
  return items.filter(item => {
    const status = getItemStatus(item);
    return status === 'trading';
  });
};

const filterCompletedItems = (items: TradingItem[]) => {
  return items.filter(item => {
    const status = getItemStatus(item);
    return status === 'sold';
  });
};

export default function PurchaseActivityTab() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  // URL 파라미터에 따라 초기 탭 설정
  const [activeTab, setActiveTab] = useState(() => {
    if (filterParam === 'trading') return 'trading';
    if (filterParam === 'completed') return 'completed';
    return 'offers';
  });
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [tradingItems, setTradingItems] = useState<TradingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);
  const [showSellerInfoModal, setShowSellerInfoModal] = useState(false);
  const [selectedSellerInfo, setSelectedSellerInfo] = useState<SellerInfo | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingItem, setCancellingItem] = useState<TradingItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    transactionId: number;
    offerId?: number; // offer_id 추가
    itemType?: 'phone' | 'electronics'; // itemType 추가
    sellerName: string;
    phoneInfo: {
      brand: string;
      model: string;
      price: number;
    };
  } | null>(null);
  const [pollingManager] = useState(() => new TransactionPollingManager());

  // URL 파라미터 변경 감지하여 탭 업데이트
  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'trading') {
      setActiveTab('trading');
    } else if (filter === 'completed') {
      setActiveTab('completed');
    }
  }, [searchParams]);

  // 내 제안 목록 조회 - 휴대폰과 전자제품 통합
  const fetchMyOffers = async () => {
    setLoading(true);
    try {
      // 병렬로 휴대폰과 전자제품 제안 가져오기
      const [phoneOffers, electronicsOffers] = await Promise.all([
        buyerAPI.getMySentOffers().catch((err) => {
          console.error('Phone offers error:', err);
          return { results: [] };
        }),
        electronicsApi.getMySentOffers().catch((err) => {
          console.error('Electronics offers error:', err);
          return { results: [] };
        })
      ]);

      // 각 데이터에 itemType 추가
      const phoneOfferItems = (phoneOffers.results || phoneOffers || [])
        .map((item: any) => ({ ...item, itemType: 'phone' as const }));

      // Fetch electronics details for offers that only have electronics_info
      const electronicsOfferItemsPromises = (electronicsOffers.results || electronicsOffers || [])
        .map(async (item: any) => {
          // If we have electronics_info but no full electronics data, fetch the detail
          if (item.electronics_info && !item.electronics) {
            try {
              const detail = await electronicsApi.getElectronicsDetail(item.electronics_info.id);
              return {
                ...item,
                itemType: 'electronics' as const,
                electronics: {
                  id: detail.id,
                  brand: detail.brand,
                  model_name: detail.model_name,
                  price: detail.price,
                  status: detail.status,
                  images: detail.images,
                  seller: detail.seller
                }
              };
            } catch (error) {
              console.error('Failed to fetch electronics detail:', error);
              // Fallback to using electronics_info
              return {
                ...item,
                itemType: 'electronics' as const,
                electronics: item.electronics_info
              };
            }
          }
          return { ...item, itemType: 'electronics' as const };
        });

      const electronicsOfferItems = await Promise.all(electronicsOfferItemsPromises);

      const allOffers = [
        ...phoneOfferItems,
        ...electronicsOfferItems
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOffers(allOffers);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      // 목업 데이터
      setOffers([
        {
          id: 1,
          phone: {
            id: 10,
            title: 'iPhone 15 Pro Max',
            brand: 'Apple',
            model: 'iPhone 15 Pro Max',
            price: 1200000,
            images: [{ image_url: '/placeholder.png', is_main: true }],
            seller: { nickname: '판매자A' },
          },
          offered_price: 1100000,
          message: '상태 좋으면 바로 구매하겠습니다.',
          status: 'pending',
          created_at: '2024-12-25T10:00:00',
        },
        {
          id: 2,
          phone: {
            id: 11,
            title: 'Galaxy S24 Ultra',
            brand: 'Samsung',
            model: 'Galaxy S24 Ultra',
            price: 1000000,
            images: [{ image_url: '/placeholder.png', is_main: true }],
            seller: { nickname: '판매자B' },
          },
          offered_price: 950000,
          message: '직거래 가능한지 궁금합니다.',
          status: 'accepted',
          created_at: '2024-12-24T15:30:00',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 거래중 목록 조회 - 휴대폰과 전자제품 통합
  const fetchTradingItems = async () => {
    setLoading(true);
    try {
      // 병렬로 휴대폰과 전자제품 거래중 항목 가져오기
      const [phoneTrading, electronicsTrading] = await Promise.all([
        buyerAPI.getMyTradingItems().catch((err) => {
          console.error('Phone trading items error:', err);
          return { results: [] };
        }),
        electronicsApi.getMyTradingItems().catch((err) => {
          console.error('Electronics trading items error:', err);
          return { results: [] };
        })
      ]);

      // 데이터 구조로 정확하게 타입 판단
      const phoneItems = (Array.isArray(phoneTrading) ? phoneTrading : phoneTrading.results || [])
        .map((item: any) => ({ ...item, itemType: item.phone ? 'phone' : 'electronics' }));

      const electronicsItems = (Array.isArray(electronicsTrading) ? electronicsTrading : electronicsTrading.results || [])
        .map((item: any) => ({ ...item, itemType: item.electronics ? 'electronics' : 'phone' }));

      // 디버깅: 전자제품 sold 상태 확인
      console.log('[DEBUG] Electronics trading items:', electronicsItems);
      const electronicsSoldCount = electronicsItems.filter((item: any) =>
        item.electronics?.status === 'sold' ||
        (item.electronics_info?.status === 'sold')
      ).length;
      console.log('[DEBUG] Electronics sold count:', electronicsSoldCount);

      const allTrading = [
        ...phoneItems,
        ...electronicsItems
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 디버깅: 전체 sold 상태 확인
      const totalSoldCount = allTrading.filter(item => {
        const status = getItemStatus(item);
        return status === 'sold';
      }).length;
      console.log('[DEBUG] Total sold count:', totalSoldCount);

      setTradingItems(allTrading);
    } catch (error) {
      console.error('Failed to fetch trading items:', error);
      setTradingItems([]);
    } finally {
      setLoading(false);
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

  // 페이징 처리된 데이터 계산
  const getPaginatedItems = <T,>(items: T[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // 총 페이지 수 계산
  const getTotalPages = <T,>(items: T[]) => {
    return Math.ceil(items.length / itemsPerPage);
  };

  // 페이지네이션 컴포넌트
  const Pagination = <T,>({ items }: { items: T[] }) => {
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

  // 제안 취소
  const handleCancelOffer = async (offerId: number, itemType?: 'phone' | 'electronics') => {
    await executeTransactionAction(
      () => {
        // itemType에 따라 적절한 API 호출
        if (itemType === 'electronics') {
          return electronicsApi.cancelOffer(offerId);
        }
        return buyerAPI.cancelOffer(offerId);
      },
      {
        successMessage: '제안이 취소되었습니다.',
        onRefresh: fetchMyOffers,
        onTabChange: setActiveTab,
      }
    );
  };


  // 판매자 정보 조회
  const fetchSellerInfo = async (itemId: number, itemType: 'phone' | 'electronics' = 'phone') => {
    try {
      let data;
      if (itemType === 'electronics') {
        data = await electronicsApi.getSellerInfo(itemId);
      } else {
        data = await buyerAPI.getSellerInfo(itemId);
      }
      setSelectedSellerInfo(data);
      setShowSellerInfoModal(true);
    } catch (error) {
      console.error('Failed to fetch seller info:', error);
      toast({
        title: '오류',
        description: '판매자 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    }
  };

  // 거래 취소 모달 열기
  // 구매 완료 처리
  const handleCompleteTransaction = async (phoneId: number, itemType: 'phone' | 'electronics' = 'phone') => {
    await executeTransactionAction(
      async () => {
        if (itemType === 'electronics') {
          await electronicsApi.buyerCompleteTransaction(phoneId);
        } else {
          // Phone API doesn't have buyerComplete in the API module, use direct fetch
          const token = localStorage.getItem('accessToken');
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com/api';
          const apiUrl = baseUrl.includes('api.dungjimarket.com')
            ? `${baseUrl}/used/phones/${phoneId}/buyer-complete/`
            : `${baseUrl}/api/used/phones/${phoneId}/buyer-complete/`;

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw { response: { data: errorData } };
          }
          return response;
        }
      },
      {
        successMessage: '구매가 완료되었습니다.',
        onRefresh: fetchTradingItems,
        onTabChange: setActiveTab,
      }
    );
  };

  const openCancelModal = (item: TradingItem) => {
    setCancellingItem(item);
    setCancellationReason('');
    setCustomReason('');
    setShowCancelModal(true);
  };

  // 거래 취소 처리
  const handleCancelTransaction = async () => {
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

    await executeTransactionAction(
      async () => {
        const itemId = cancellingItem.phone?.id || cancellingItem.electronics?.id;
        if (!itemId) throw new Error('No item ID found');

        const cancellationData = {
          reason: cancellationReason,
          custom_reason: cancellationReason === 'other' ? customReason : undefined,
        };

        if (cancellingItem.itemType === 'electronics') {
          await electronicsApi.cancelTrade(itemId, cancellationData);
        } else {
          // Phone API doesn't have cancelTrade in the API module, use direct fetch
          const token = localStorage.getItem('accessToken');
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com/api';
          const apiUrl = `${baseUrl}/used/phones/${itemId}/cancel-trade/`;

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cancellationData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw { response: { data: errorData } };
          }
          return response;
        }
      },
      {
        successMessage: '거래가 취소되었습니다.',
        onSuccess: () => {
          setShowCancelModal(false);
          setCancellingItem(null);
        },
        onRefresh: fetchTradingItems,
        onTabChange: setActiveTab,
      }
    );
  };

  // 후기 작성 모달 열기
  const openReviewModal = async (item: TradingItem) => {
    console.log('openReviewModal - item:', item);
    console.log('openReviewModal - item.type:', (item as any).type);
    console.log('openReviewModal - item.transaction_id:', (item as any).transaction_id);
    console.log('openReviewModal - item.offer_id:', (item as any).offer_id);

    // transaction_id 우선, 없으면 0 (백엔드가 offer_id로 처리)
    const transactionId = (item as any).transaction_id || 0;

    // itemType 사용 (이미 데이터 구조로 정확히 설정됨)
    const itemType = item.itemType;

    console.log('Using transactionId:', transactionId);
    console.log('Using itemType:', itemType);
    console.log('Has electronics:', !!item.electronics);
    console.log('Has phone:', !!item.phone);

    // type 필드로 명확하게 구분
    if (itemType === 'electronics' && item.electronics) {
      console.log('Setting reviewTarget for electronics');
      setReviewTarget({
        transactionId: transactionId,
        offerId: (item as any).offer_id,
        itemType: 'electronics',
        sellerName: item.electronics.seller.nickname,
        phoneInfo: {
          brand: item.electronics.brand,
          model: item.electronics.model_name,
          price: item.offered_price,
        },
      });
    } else if (itemType === 'phone' && item.phone) {
      console.log('Setting reviewTarget for phone');
      setReviewTarget({
        transactionId: transactionId,
        itemType: 'phone',
        sellerName: item.phone.seller.nickname,
        phoneInfo: {
          brand: item.phone.brand,
          model: item.phone.model,
          price: item.offered_price,
        },
      });
    }
    setShowReviewModal(true);
  };

  // 후기 작성 완료 후 콜백
  const handleReviewSuccess = () => {
    setShowReviewModal(false);
    setReviewTarget(null);
    // 목록 새로고침하여 리뷰 작성 상태 업데이트
    fetchTradingItems();
  };

  // 처음 로드시 모든 데이터 가져오기
  useEffect(() => {
    fetchMyOffers();
    fetchTradingItems();
  }, []);

  // 탭 변경시 해당 데이터 새로고침
  useEffect(() => {
    if (activeTab === 'offers') {
      fetchMyOffers();
    } else if (activeTab === 'trading') {
      fetchTradingItems();
    } else if (activeTab === 'completed') {
      fetchTradingItems();
    }
  }, [activeTab]);

  // 실시간 상태 동기화 폴링
  useEffect(() => {
    if (activeTab === 'trading') {
      // 거래중 탭에서만 폴링 (30초 간격)
      pollingManager.start(() => {
        fetchTradingItems();
      }, 30000);
    } else if (activeTab === 'offers') {
      // 제안 탭에서는 더 긴 간격 (1분)
      pollingManager.start(() => {
        fetchMyOffers();
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

  const getOfferStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            수락됨
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            거절됨
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">구매 내역</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="offers" className="text-xs sm:text-sm">
            제안내역 ({filterActiveOffers(offers).length})
          </TabsTrigger>
          <TabsTrigger value="trading" className="text-xs sm:text-sm">
            거래중 ({filterTradingItems(tradingItems).length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            거래완료 ({filterCompletedItems(tradingItems).length})
          </TabsTrigger>
        </TabsList>

        {/* 제안내역 탭 */}
        <TabsContent value="offers" className="space-y-3">
          {loading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : filterActiveOffers(offers).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              제안한 상품이 없습니다
            </div>
          ) : (
            <>
              {getPaginatedItems(filterActiveOffers(offers)).map((offer) => {
                const itemId = getItemId(offer);
                const itemUrl = getItemUrl(offer);
                const itemTitle = getItemTitle(offer);
                const itemImages = getItemImages(offer);
                const itemPrice = getItemPrice(offer);
                const itemSeller = getItemSeller(offer);
                const primaryImage = itemImages[0] as any;
                // 휴대폰은 image_url, 전자제품은 imageUrl 사용
                const imageUrl = offer.phone
                  ? primaryImage?.image_url
                  : primaryImage?.imageUrl;

                // 디버깅 로그
                console.log('=== 구매내역 아이템 렌더링 ===');
                console.log('Offer:', offer);
                console.log('Item Type:', offer.itemType || (offer.phone ? 'phone' : 'electronics'));
                console.log('Item URL:', itemUrl);
                console.log('Phone ID:', offer.phone?.id);
                console.log('Electronics ID:', offer.electronics?.id || offer.electronics_info?.id);

                return (
                  <Card key={offer.id} className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <Link
                        href={itemUrl}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
                      >
                        <Image
                          src={imageUrl || '/placeholder.png'}
                          alt={itemTitle}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={itemUrl}
                              className="hover:text-dungji-primary transition-colors"
                            >
                              <h4 className="font-medium text-sm truncate">
                                {itemTitle}
                              </h4>
                            </Link>
                            <p className="text-xs text-gray-500">
                              판매자: {itemSeller?.nickname || '알 수 없음'}
                            </p>
                          </div>
                          {getOfferStatusBadge(offer.status)}
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">판매가</span>
                            <span>{itemPrice?.toLocaleString() || '0'}원</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">제안가</span>
                        <span className="font-semibold text-dungji-primary">
                          {offer.offered_price?.toLocaleString() || '0'}원
                        </span>
                      </div>
                    </div>

                    {offer.message && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedMessage(
                            expandedMessage === offer.id ? null : offer.id
                          )}
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                        >
                          <MessageSquare className="w-3 h-3" />
                          보낸 메시지 {expandedMessage === offer.id ? '접기' : '보기'}
                        </button>
                        {expandedMessage === offer.id && (
                          <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700">
                            {offer.message}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(offer.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      <div className="flex gap-2">
                        {offer.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelOffer(offer.id, offer.itemType)}
                          >
                            제안 취소
                          </Button>
                        )}
                        {/* 수락된 제안은 거래중 탭으로 이동 */}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
              <Pagination items={filterActiveOffers(offers)} />
            </>
          )}
        </TabsContent>

        {/* 거래중 탭 */}
        <TabsContent value="trading" className="space-y-3">
          {loading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : filterTradingItems(tradingItems).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              거래중인 상품이 없습니다
            </div>
          ) : (
            <>
              {getPaginatedItems(filterTradingItems(tradingItems)).map((item) => {
                const itemId = getItemId(item);
                const itemUrl = getItemUrl(item);
                const itemTitle = getItemTitle(item);
                const itemImages = getItemImages(item);
                const primaryImage = itemImages[0] as any;
                const imageUrl = item.phone ? primaryImage?.image_url : primaryImage?.imageUrl;
                const product = item.phone || item.electronics;

                return (
                  <Card key={item.id} className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <Link href={itemUrl} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <Image
                          src={imageUrl || '/placeholder.png'}
                          alt={itemTitle}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <Link href={itemUrl} className="cursor-pointer hover:opacity-80 transition-opacity">
                              <h4 className="font-medium text-sm truncate">
                                {itemTitle}
                              </h4>
                            </Link>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-gray-500">거래가격</span>
                          <p className="text-base font-semibold text-green-600">
                            {item.offered_price?.toLocaleString() || '0'}원
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700">거래중</Badge>
                    </div>

                    {/* 거래 진행 상태 */}
                    <div className="bg-green-50 rounded-lg px-2 py-1.5 mb-3 text-xs inline-block">
                      <div className="flex items-center gap-1.5 text-green-700">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>판매자와 거래가 진행중입니다</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => fetchSellerInfo(itemId, item.itemType || 'phone')}
                      >
                        <User className="w-3.5 h-3.5" />
                        판매자 정보
                      </Button>
                      {/* 판매자가 완료하지 않은 경우에만 취소 버튼 표시 */}
                      {!product?.seller_completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5"
                          onClick={() => openCancelModal(item)}
                        >
                          거래 취소
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
              <Pagination items={filterTradingItems(tradingItems)} />
            </>
          )}
        </TabsContent>

        {/* 구매완료 탭 */}
        {/* 거래완료 탭 */}
        <TabsContent value="completed" className="space-y-3">
          {loading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : filterCompletedItems(tradingItems).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              거래완료된 상품이 없습니다
            </div>
          ) : (
            <>
              {getPaginatedItems(filterCompletedItems(tradingItems)).map((item) => {
                const itemTitle = getItemTitle(item);
                const itemImages = getItemImages(item);
                const itemSeller = getItemSeller(item);
                const primaryImage = itemImages[0] as any;
                const imageUrl = item.phone ? primaryImage?.image_url : primaryImage?.imageUrl;

                return (
                  <Card key={item.id} className="p-3 sm:p-4">
                    <div className="flex gap-3 sm:gap-4">
                      <Link href={getItemUrl(item)} className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <Image
                          src={imageUrl || '/placeholder.png'}
                          alt={itemTitle}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <Link href={getItemUrl(item)} className="cursor-pointer hover:opacity-80 transition-opacity">
                              <h4 className="font-medium text-sm truncate">
                                {itemTitle}
                              </h4>
                            </Link>
                            <p className="text-base font-semibold text-green-600">
                              {item.offered_price?.toLocaleString() || '0'}원
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 mb-2">
                          판매자: {itemSeller?.nickname || '알 수 없음'}
                        </p>

                      <div className="flex gap-2">
                        {item.has_review === true ? (
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
              );
            })}
              <Pagination items={filterCompletedItems(tradingItems)} />
            </>
          )}
        </TabsContent>

      </Tabs>

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
                  <option value="change_mind">단순 변심</option>
                  <option value="found_better">다른 상품 구매 결정</option>
                  <option value="seller_no_response">판매자 연락 두절</option>
                  <option value="condition_mismatch">상품 상태가 설명과 다름</option>
                  <option value="price_disagreement">추가 비용 요구</option>
                  <option value="schedule_conflict">거래 일정 조율 실패</option>
                  <option value="location_issue">거래 장소 너무 멀음</option>
                  <option value="seller_cancel_request">판매자 취소 요청</option>
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">주의사항</span><br />
                  • 판매자에게 취소 알림이 전송됩니다<br />
                  • 상품은 다시 '판매중' 상태로 변경됩니다<br />
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

      {/* 판매자 정보 모달 */}
      {showSellerInfoModal && selectedSellerInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">판매자 정보</h3>
              <button
                onClick={() => {
                  setShowSellerInfoModal(false);
                  setSelectedSellerInfo(null);
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
                  {selectedSellerInfo.profile_image ? (
                    <Image
                      src={selectedSellerInfo.profile_image}
                      alt={selectedSellerInfo.nickname}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedSellerInfo.nickname}</p>
                  <p className="text-sm text-gray-600">판매자</p>
                </div>
              </div>
              
              {/* 거래 정보 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800 mb-2">거래 진행중</p>
                <p className="text-lg font-bold text-green-700">
                  {selectedSellerInfo.accepted_price?.toLocaleString() || '0'}원
                </p>
              </div>
              
              {/* 연락처 정보 */}
              <div className="space-y-3">
                {selectedSellerInfo.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedSellerInfo.phone}</span>
                    <button
                      onClick={() => {
                        window.location.href = `tel:${selectedSellerInfo.phone}`;
                      }}
                      className="ml-auto text-blue-600 text-sm hover:underline"
                    >
                      전화하기
                    </button>
                  </div>
                )}

                {selectedSellerInfo.region && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedSellerInfo.region}</span>
                  </div>
                )}
              </div>
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
                setShowSellerInfoModal(false);
                setSelectedSellerInfo(null);
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
        <>
          {console.log('Rendering ReviewModal with reviewTarget:', reviewTarget)}
          {console.log('reviewTarget.itemType:', reviewTarget.itemType)}
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setReviewTarget(null);
            }}
            transactionId={reviewTarget.transactionId}
            offerId={reviewTarget.offerId}
            itemType={reviewTarget.itemType}
            revieweeName={reviewTarget.sellerName}
            productInfo={reviewTarget.phoneInfo}
            onSuccess={handleReviewSuccess}
          />
        </>
      )}
    </div>
  );
}