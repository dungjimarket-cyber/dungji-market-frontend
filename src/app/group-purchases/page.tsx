'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainHeader } from '@/components/navigation/MainHeader';
import { GroupPurchaseCard } from '@/components/group-purchase/GroupPurchaseCard';
import { GroupBuyFilters } from '@/components/filters/GroupBuyFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { getSellerBids } from '@/lib/api/bidService';

interface GroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  start_time: string;
  end_time: string;
  product_details: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image_url: string;
    category_name: string;
    carrier?: string;
    registration_type?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    plan_info: string;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
}

/**
 * 공구 둘러보기 메인 페이지 컴포넌트
 */
function GroupPurchasesPageContent() {
  const searchParams = useSearchParams();
  const { user, accessToken } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [userParticipations, setUserParticipations] = useState<number[]>([]);
  const [userBids, setUserBids] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  /**
   * 공구 목록 가져오기 (필터 포함)
   */
  const fetchGroupBuys = async (filters?: Record<string, string>) => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      
      // 탭별 필터링
      if (activeTab === 'completed') {
        params.append('status', 'completed');
      } else if (activeTab === 'popular') {
        params.append('sort', 'popular');
        params.append('status', 'in_progress'); // 명시적으로 status 파라미터를 전달
      } else if (activeTab === 'new') {
        params.append('sort', 'newest');
        params.append('status', 'in_progress'); // 진행중인 것만 표시
      }
      
      // 사용자 필터 추가
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            // 정렬 기준 변환 (한글 -> API 파라미터)
            if (key === 'sort') {
              if (value === '최신순') {
                params.append('sort', 'newest');
                params.append('status', 'in_progress'); // 진행중인 것만 표시
              } else if (value === '인기순(참여자많은순)') {
                params.append('sort', 'popular');
                params.append('status', 'in_progress'); // 명시적으로 status 파라미터를 전달
              } else {
                // 기본값은 최신순
                params.append('sort', 'newest');
                params.append('status', 'in_progress'); // 진행중인 것만 표시
              }
            } else {
              params.append(key, value);
            }
          }
        });
      }
      
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('공구 목록을 불러오는데 실패했습니다.');
      }
      
      let data = await response.json();
      
      // 완료된 공구 필터링 (완료 탭이 아닌 경우에만 적용)
      if (activeTab !== 'completed') {
        // 사용자가 참여하거나 입찰한 공구는 완료되어도 보여주고, 그 외의 완료된 공구는 필터링
        data = data.filter((groupBuy: GroupBuy) => {
          // 현재 시간과 비교해서 마감된 공구인지 확인
          const now = new Date();
          const endTime = new Date(groupBuy.end_time);
          const isExpired = endTime < now;
          
          // 완료되지 않고 마감되지 않은 공구는 모두 표시
          if (groupBuy.status !== 'completed' && !isExpired && !['final_selection', 'seller_confirmation'].includes(groupBuy.status)) {
            return true;
          }
          
          // 사용자가 일반회원이고 참여한 공구인 경우 표시
          if (user?.role !== 'seller' && userParticipations.includes(groupBuy.id)) {
            return true;
          }
          
          // 사용자가 판매회원이고 입찰한 공구인 경우 표시
          if (user?.role === 'seller' && userBids.includes(groupBuy.id)) {
            return true;
          }
          
          // 그 외의 완료된 공구나 마감된 공구는 필터링
          return false;
        });
      }
      
      setGroupBuys(data);
    } catch (err) {
      console.error('공구 목록 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      toast.error('공구 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 필터 변경 처리
   */
  const handleFiltersChange = (filters: Record<string, string>) => {
    fetchGroupBuys(filters);
  };

  /**
   * 탭 변경 처리
   */
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    // URL 쿼리 파라미터에서 필터 추출
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (['manufacturer', 'carrier', 'purchaseType', 'priceRange'].includes(key)) {
        filters[key] = value;
      }
    });
    
    fetchGroupBuys(filters);
  };

  /**
   * 사용자 참여 공구 및 입찰 공구 ID 목록 가져오기
   */
  const fetchUserParticipationsAndBids = async () => {
    if (!accessToken) return;
    
    try {
      // 일반 회원: 참여한 공구 목록 가져오기
      if (user?.role !== 'seller') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/participations/`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // 참여한 공구 ID 목록 추출
          const participationIds = data.map((p: any) => p.groupbuy_id);
          setUserParticipations(participationIds);
        }
      }
      
      // 판매 회원: 입찰한 공구 목록 가져오기
      if (user?.role === 'seller') {
        try {
          const bids = await getSellerBids();
          // 입찰한 공구 ID 목록 추출
          const bidGroupBuyIds = bids.map(bid => bid.groupbuy);
          setUserBids(bidGroupBuyIds);
        } catch (error) {
          console.error('입찰 목록 조회 오류:', error);
        }
      }
    } catch (error) {
      console.error('사용자 참여/입찰 정보 조회 오류:', error);
    }
  };

  /**
   * 초기 데이터 로딩
   */
  useEffect(() => {
    // URL 쿼리 파라미터에서 필터 추출
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (['manufacturer', 'carrier', 'purchaseType', 'priceRange'].includes(key)) {
        filters[key] = value;
      }
    });
    
    fetchGroupBuys(filters);
    
    // 사용자가 로그인한 경우 참여/입찰 정보 가져오기
    if (accessToken) {
      fetchUserParticipationsAndBids();
    }
  }, [activeTab, accessToken]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader title="공구 둘러보기" />
      
      <div className="pt-16 pb-20">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto bg-white min-h-screen">
          {/* 페이지 헤더 */}
          <div className="px-4 py-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">공구 둘러보기</h1>
            <p className="text-sm text-gray-600 mt-1">다양한 공동구매에 참여해보세요</p>
          </div>

          {/* 필터 컴포넌트 */}
          <div className="px-4 py-4">
            <GroupBuyFilters onFiltersChange={handleFiltersChange} />
          </div>

          {/* 탭 메뉴 */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="px-4">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="popular">인기순</TabsTrigger>
              <TabsTrigger value="new">최신순</TabsTrigger>
              <TabsTrigger value="completed">종료</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                  ))
                ) : error ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">{error}</p>
                  </div>
                ) : groupBuys.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">진행중인 공동구매가 없습니다.</p>
                  </div>
                ) : (
                  groupBuys.map((groupBuy) => (
                    <GroupPurchaseCard 
                      key={groupBuy.id} 
                      groupBuy={groupBuy}
                      isParticipant={userParticipations.includes(groupBuy.id)}
                      hasBid={userBids.includes(groupBuy.id)}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="popular" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : groupBuys.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">인기 공동구매가 없습니다.</p>
                </div>
              ) : (
                groupBuys.map((groupBuy) => (
                  <GroupPurchaseCard 
                    key={groupBuy.id} 
                    groupBuy={groupBuy}
                    isParticipant={userParticipations.includes(groupBuy.id)}
                    hasBid={userBids.includes(groupBuy.id)}
                  />
                ))
              )}
              </div>
            </TabsContent>

            <TabsContent value="new" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : groupBuys.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">새로운 공동구매가 없습니다.</p>
                </div>
              ) : (
                groupBuys.map((groupBuy) => (
                  <GroupPurchaseCard 
                    key={groupBuy.id} 
                    groupBuy={groupBuy}
                    isParticipant={userParticipations.includes(groupBuy.id)}
                    hasBid={userBids.includes(groupBuy.id)}
                  />
                ))
              )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))
              ) : error ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : groupBuys.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">완료된 공동구매가 없습니다.</p>
                </div>
              ) : (
                groupBuys.map((groupBuy) => (
                  <GroupPurchaseCard 
                    key={groupBuy.id} 
                    groupBuy={groupBuy}
                    isParticipant={userParticipations.includes(groupBuy.id)}
                    hasBid={userBids.includes(groupBuy.id)}
                  />
                ))
              )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/**
 * 공구 둘러보기 메인 페이지
 */
export default function GroupPurchasesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <MainHeader title="공구 둘러보기" />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>        
      </div>
    }>
      <GroupPurchasesPageContent />
    </Suspense>
  );
}
