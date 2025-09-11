'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Eye, Heart, MessageCircle, MoreVertical, Edit, Trash2, User, DollarSign, Clock, CheckCircle, Phone, Mail, MapPin, Info, X } from 'lucide-react';
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
  status: 'active' | 'trading' | 'sold';
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
    phone?: string;
    email?: string;
    region?: string;
  };
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [listings, setListings] = useState<SalesItem[]>([]);
  const [allListings, setAllListings] = useState<SalesItem[]>([]); // 전체 목록 캐시
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<SalesItem | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showBuyerInfoModal, setShowBuyerInfoModal] = useState(false);
  const [selectedBuyerInfo, setSelectedBuyerInfo] = useState<BuyerInfo | null>(null);
  const [loadingBuyerInfo, setLoadingBuyerInfo] = useState(false);

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
        trading: 'trading',
        sold: 'sold',
      };
      fetchListings(statusMap[activeTab]);
    }
  }, [activeTab]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge variant="default">판매중</Badge>,
      trading: <Badge variant="warning">거래중</Badge>,
      sold: <Badge variant="soft">판매완료</Badge>,
    };
    return badges[status as keyof typeof badges];
  };

  const getTabCount = (status: string) => {
    // 전체 목록에서 카운트 계산
    return allListings.filter(item => item.status === status).length;
  };

  // 거래 완료 처리
  const handleCompleteTransaction = async (phoneId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/complete/`
        : `${baseUrl}/api/used/phones/${phoneId}/complete/`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: '거래 완료',
          description: '거래가 완료되었습니다.',
        });
        // 목록 새로고침
        fetchAllListings();
        setActiveTab('sold');
      } else {
        throw new Error('거래 완료 처리 실패');
      }
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      toast({
        title: '오류',
        description: '거래 완료 처리 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 거래 취소 처리
  const handleCancelTransaction = async (phoneId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/cancel-trade/`
        : `${baseUrl}/api/used/phones/${phoneId}/cancel-trade/`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: '거래 취소',
          description: '거래가 취소되었습니다.',
        });
        // 목록 새로고침
        fetchAllListings();
        setActiveTab('active');
      } else {
        throw new Error('거래 취소 처리 실패');
      }
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
      toast({
        title: '오류',
        description: '거래 취소 처리 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };
  
  const getTotalOfferCount = () => {
    // 전체 목록에서 offer_count 합계 계산
    return allListings.reduce((sum, item) => sum + (item.offer_count || 0), 0);
  };

  // 거래 상대 정보 조회
  const fetchBuyerInfo = async (phoneId: number) => {
    setLoadingBuyerInfo(true);
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/buyer-info/`
        : `${baseUrl}/api/used/phones/${phoneId}/buyer-info/`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedBuyerInfo(data);
        setShowBuyerInfoModal(true);
      } else {
        throw new Error('구매자 정보 조회 실패');
      }
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
            <TabsTrigger value="trading" className="text-xs sm:text-sm">
              거래중 ({getTabCount('trading')})
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
          <TabsContent value="trading" className="space-y-3">
            {listings.filter(item => item.status === 'trading').length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                거래중인 상품이 없습니다
              </div>
            ) : (
              listings.filter(item => item.status === 'trading').map((item) => (
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
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-medium text-sm truncate">
                            {item.brand} {item.model}
                          </h4>
                          <p className="text-base font-semibold text-green-600">
                            {item.price.toLocaleString()}원
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">거래중</Badge>
                      </div>
                      
                      {/* 거래 진행 상태 */}
                      <div className="bg-green-50 rounded-lg p-2 mb-3 text-xs">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>구매자와 거래가 진행중입니다</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-1"
                            onClick={() => fetchBuyerInfo(item.id)}
                            disabled={loadingBuyerInfo}
                          >
                            <User className="w-3.5 h-3.5" />
                            구매자 정보
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              if (confirm('거래를 완료하시겠습니까?')) {
                                handleCompleteTransaction(item.id);
                              }
                            }}
                          >
                            거래 완료
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 w-full"
                          onClick={() => {
                            if (confirm('거래를 취소하시겠습니까? 구매자에게 알림이 전송됩니다.')) {
                              handleCancelTransaction(item.id);
                            }
                          }}
                        >
                          거래 취소
                        </Button>
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

      {/* 구매자 정보 모달 */}
      {showBuyerInfoModal && selectedBuyerInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
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
            
            <div className="space-y-4">
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
                
                {selectedBuyerInfo.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedBuyerInfo.email}</span>
                    <button
                      onClick={() => {
                        window.location.href = `mailto:${selectedBuyerInfo.email}`;
                      }}
                      className="ml-auto text-blue-600 text-sm hover:underline"
                    >
                      이메일
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
    </>
  );
}