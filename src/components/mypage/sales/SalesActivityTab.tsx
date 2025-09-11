'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Eye, Heart, MessageCircle, MoreVertical, Edit, Trash2, User, DollarSign, Clock, CheckCircle } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import ReceivedOffersModal from './ReceivedOffersModal';

interface SalesItem {
  id: number;
  title: string;
  price: number;
  images: { image_url: string; is_main: boolean }[];
  status: 'active' | 'reserved' | 'sold';
  view_count: number;
  favorite_count: number;
  offer_count: number;
  created_at: string;
  brand: string;
  model: string;
  storage: number;
}

interface ReceivedOffer {
  id: number;
  buyer: {
    id: number;
    nickname: string;
    profile_image?: string;
  };
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function SalesActivityTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [listings, setListings] = useState<SalesItem[]>([]);
  const [allListings, setAllListings] = useState<SalesItem[]>([]); // 전체 목록 캐시
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<SalesItem | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);

  // 전체 목록 가져오기 (캐싱용)
  const fetchAllListings = async () => {
    try {
      const data = await sellerAPI.getMyListings(); // status 없이 전체 조회
      const listings = Array.isArray(data) ? data : (data.results || []);
      setAllListings(listings);
      return listings;
    } catch (error) {
      console.error('Failed to fetch all listings:', error);
      return [];
    }
  };

  // 판매 상품 목록 조회
  const fetchListings = async (status?: string) => {
    setLoading(true);
    try {
      // 전체 목록이 없으면 먼저 가져오기
      let allItems = allListings;
      if (allItems.length === 0) {
        allItems = await fetchAllListings();
      }
      
      // status에 따라 필터링
      if (status) {
        const filtered = allItems.filter(item => item.status === status);
        setListings(filtered);
      } else {
        setListings(allItems);
      }
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

  // 받은 제안 조회
  const fetchReceivedOffers = async (phoneId: number) => {
    try {
      const data = await sellerAPI.getReceivedOffers(phoneId);
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

  // 제안 응답
  const handleOfferResponse = async (offerId: number, action: 'accept' | 'reject') => {
    try {
      await sellerAPI.respondToOffer(offerId, action);
      toast({
        title: action === 'accept' ? '제안 수락' : '제안 거절',
        description: action === 'accept' ? '제안을 수락했습니다.' : '제안을 거절했습니다.',
      });
      if (selectedPhone) {
        fetchReceivedOffers(selectedPhone.id);
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '제안 응답에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 상태별 데이터 필터링
  useEffect(() => {
    if (activeTab === 'offers') {
      // 받은제안 탭 선택 시 전체 상품 목록 조회 (offer_count가 있는 상품만 표시)
      fetchListings(); // status 없이 전체 조회
    } else {
      const statusMap: { [key: string]: string } = {
        active: 'active',
        reserved: 'reserved',
        sold: 'sold',
      };
      fetchListings(statusMap[activeTab]);
    }
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge variant="default">판매중</Badge>,
      reserved: <Badge variant="warning">예약중</Badge>,
      sold: <Badge variant="soft">판매완료</Badge>,
    };
    return badges[status as keyof typeof badges];
  };

  const getTabCount = (status: string) => {
    // 전체 목록에서 카운트 계산
    return allListings.filter(item => item.status === status).length;
  };
  
  const getTotalOfferCount = () => {
    // 전체 목록에서 offer_count 합계 계산
    return allListings.reduce((sum, item) => sum + (item.offer_count || 0), 0);
  };

  return (
    <>
      <div className="bg-white rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-4">판매 활동</h3>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              판매중 ({getTabCount('active')})
            </TabsTrigger>
            <TabsTrigger value="offers" className="text-xs sm:text-sm">
              받은제안 ({getTotalOfferCount()})
            </TabsTrigger>
            <TabsTrigger value="reserved" className="text-xs sm:text-sm">
              거래중 ({getTabCount('reserved')})
            </TabsTrigger>
            <TabsTrigger value="sold" className="text-xs sm:text-sm">
              판매완료 ({getTabCount('sold')})
            </TabsTrigger>
          </TabsList>

          {/* 판매중 탭 */}
          <TabsContent value="active" className="space-y-3">
            {loading ? (
              <div className="text-center py-8">로딩중...</div>
            ) : listings.filter(item => item.status === 'active').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                판매중인 상품이 없습니다
              </div>
            ) : (
              listings.filter(item => item.status === 'active').map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.images[0]?.image_url || '/placeholder.png'}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.brand} {item.model}
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
                            fetchReceivedOffers(item.id);
                          }}
                        >
                          제안 확인
                        </Button>
                        <Button size="sm" variant="outline">
                          수정
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 받은 제안 탭 */}
          <TabsContent value="offers" className="space-y-3">
            {listings.filter(item => item.offer_count > 0).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                받은 제안이 없습니다
              </div>
            ) : (
              listings.filter(item => item.offer_count > 0).map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.images[0]?.image_url || '/placeholder.png'}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.brand} {item.model}
                      </h4>
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
                            fetchReceivedOffers(item.id);
                          }}
                        >
                          제안 확인
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 거래중 탭 */}
          <TabsContent value="reserved" className="space-y-3">
            {listings.filter(item => item.status === 'reserved').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                거래중인 상품이 없습니다
              </div>
            ) : (
              listings.filter(item => item.status === 'reserved').map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.images[0]?.image_url || '/placeholder.png'}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.brand} {item.model}
                      </h4>
                      <p className="text-base font-semibold">
                        {item.price.toLocaleString()}원
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button size="sm">거래 완료</Button>
                        <Button size="sm" variant="outline">거래 취소</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 판매완료 탭 */}
          <TabsContent value="sold" className="space-y-3">
            {listings.filter(item => item.status === 'sold').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                판매완료된 상품이 없습니다
              </div>
            ) : (
              listings.filter(item => item.status === 'sold').map((item) => (
                <Card key={item.id} className="p-3 sm:p-4">
                  <div className="flex gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.images[0]?.image_url || '/placeholder.png'}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.brand} {item.model}
                      </h4>
                      <p className="text-base font-semibold">
                        {item.price.toLocaleString()}원
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        거래완료
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
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
          phone={selectedPhone}
          offers={receivedOffers}
          onRespond={handleOfferResponse}
        />
      )}
    </>
  );
}