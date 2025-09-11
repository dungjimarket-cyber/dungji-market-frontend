'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, Clock, CheckCircle, XCircle, MessageSquare, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buyerAPI } from '@/lib/api/used';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface OfferItem {
  id: number;
  phone: {
    id: number;
    title: string;
    brand: string;
    model: string;
    price: number;
    images: { image_url: string; is_main: boolean }[];
    seller: {
      nickname: string;
    };
  };
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface FavoriteItem {
  id: number;
  phone: {
    id: number;
    title: string;
    brand: string;
    model: string;
    price: number;
    images: { image_url: string; is_main: boolean }[];
    seller: {
      nickname: string;
    };
  };
  created_at: string;
}

export default function PurchaseActivityTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('offers');
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState<number | null>(null);

  // 내 제안 목록 조회
  const fetchMyOffers = async () => {
    setLoading(true);
    try {
      const data = await buyerAPI.getMySentOffers();
      setOffers(data.results || data);
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

  // 찜 목록 조회
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await buyerAPI.getFavorites();
      setFavorites(data.results || data);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      // 목업 데이터
      setFavorites([
        {
          id: 1,
          phone: {
            id: 20,
            title: 'AirPods Pro 2',
            brand: 'Apple',
            model: 'AirPods Pro 2',
            price: 280000,
            images: [{ image_url: '/placeholder.png', is_main: true }],
            seller: { nickname: '애플매니아' },
          },
          created_at: '2024-12-23T09:00:00',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 제안 취소
  const handleCancelOffer = async (offerId: number) => {
    try {
      await buyerAPI.cancelOffer(offerId);
      toast({
        title: '제안 취소',
        description: '제안이 취소되었습니다.',
      });
      fetchMyOffers();
    } catch (error) {
      toast({
        title: '오류',
        description: '제안 취소에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 찜 해제
  const handleRemoveFavorite = async (phoneId: number) => {
    try {
      await buyerAPI.toggleFavorite(phoneId);
      toast({
        title: '찜 해제',
        description: '찜 목록에서 제거되었습니다.',
      });
      fetchFavorites();
    } catch (error) {
      toast({
        title: '오류',
        description: '찜 해제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'offers') {
      fetchMyOffers();
    } else if (activeTab === 'favorites') {
      fetchFavorites();
    }
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

  const calculateDiscount = (originalPrice: number, offeredPrice: number) => {
    const discount = ((originalPrice - offeredPrice) / originalPrice) * 100;
    return discount.toFixed(1);
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-4">구매 활동</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="offers" className="text-xs sm:text-sm">
            제안내역 ({offers.length})
          </TabsTrigger>
          <TabsTrigger value="trading" className="text-xs sm:text-sm">
            거래중 (0)
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">
            구매완료 (0)
          </TabsTrigger>
          <TabsTrigger value="favorites" className="text-xs sm:text-sm">
            찜 ({favorites.length})
          </TabsTrigger>
        </TabsList>

        {/* 제안내역 탭 */}
        <TabsContent value="offers" className="space-y-3">
          {loading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              제안한 상품이 없습니다
            </div>
          ) : (
            offers.map((offer) => (
              <Card key={offer.id} className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={offer.phone.images[0]?.image_url || '/placeholder.png'}
                      alt={offer.phone.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm truncate">
                          {offer.phone.brand} {offer.phone.model}
                        </h4>
                        <p className="text-xs text-gray-500">
                          판매자: {offer.phone.seller.nickname}
                        </p>
                      </div>
                      {getOfferStatusBadge(offer.status)}
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">판매가</span>
                        <span>{offer.phone.price.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">제안가</span>
                        <span className="font-semibold text-dungji-primary">
                          {offer.offered_price.toLocaleString()}원
                          <span className="text-xs text-gray-500 ml-1">
                            (-{calculateDiscount(offer.phone.price, offer.offered_price)}%)
                          </span>
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
                            onClick={() => handleCancelOffer(offer.id)}
                          >
                            제안 취소
                          </Button>
                        )}
                        {offer.status === 'accepted' && (
                          <Button size="sm">
                            판매자 연락하기
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* 거래중 탭 */}
        <TabsContent value="trading" className="space-y-3">
          <div className="text-center py-8 text-gray-500">
            거래중인 상품이 없습니다
          </div>
        </TabsContent>

        {/* 구매완료 탭 */}
        <TabsContent value="completed" className="space-y-3">
          <div className="text-center py-8 text-gray-500">
            구매완료된 상품이 없습니다
          </div>
        </TabsContent>

        {/* 찜 목록 탭 */}
        <TabsContent value="favorites" className="space-y-3">
          {loading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              찜한 상품이 없습니다
            </div>
          ) : (
            favorites.map((item) => (
              <Card key={item.id} className="p-3 sm:p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.phone.images[0]?.image_url || '/placeholder.png'}
                      alt={item.phone.title}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {item.phone.brand} {item.phone.model}
                    </h4>
                    <p className="text-base sm:text-lg font-semibold mt-1">
                      {item.phone.price.toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-500">
                      판매자: {item.phone.seller.nickname}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm">
                          가격 제안
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRemoveFavorite(item.phone.id)}
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          찜 해제
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}