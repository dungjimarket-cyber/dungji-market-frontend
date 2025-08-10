'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
    registration_type_korean?: string;
    plan_info?: string;
    contract_info?: string;
  };
  telecom_detail?: {
    telecom_carrier: string;
    subscription_type: string;
    subscription_type_korean?: string;
    plan_info: string;
    contract_period?: string;
  };
  creator: {
    id: number;
    username: string;
    profile_image?: string;
  };
  region_type?: string;
  region?: string;
  region_name?: string;
  regions?: Array<{
    id: number;
    name: string;
    parent?: string;
  }>;
  creator_name?: string;
  host_username?: string;
}

/**
 * 공구 둘러보기 메인 페이지 컴포넌트
 */
function GroupPurchasesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const fetchGroupBuys = useCallback(async (filters?: Record<string, string>, tabValue?: string) => {
    setLoading(true);
    setError('');
    const currentTab = tabValue || activeTab;
    console.log('fetchGroupBuys 호출 - currentTab:', currentTab, 'filters:', filters);
    
    try {
      const params = new URLSearchParams();
      
      // 기본 상태 설정 - 탭에 따라
      if (currentTab === 'completed') {
        // 공구완료 탭: 완료된 공구들 (ended, final_selection, seller_confirmation, completed, cancelled)
        params.append('status', 'ended,final_selection,seller_confirmation,completed,cancelled');
      } else if (currentTab === 'all') {
        // 전체 탭은 모든 상태 포함 - 상태 필터 없음
      } else {
        // 인기순, 최신순 탭은 진행중인 것만 (recruiting, bidding)
        params.append('status', 'recruiting,bidding');
      }
      
      // 탭별 정렬 설정
      if (currentTab === 'popular') {
        // 인기순: 참여자 많은 순으로 정렬
        params.append('ordering', '-current_participants');
      } else {
        // 나머지 탭들은 모두 최신순으로 정렬
        params.append('ordering', '-start_time');
      }
      
      // 사용자 필터 추가
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            // 정렬 기준은 무시 (탭별로 자동 설정됨)
            if (key === 'sort') {
              return;
            }
            // 지역 검색 필터
            else if (key === 'search') {
              params.append('region_search', value);
            }
            // 구매방식 필터 변환
            else if (key === 'purchaseType') {
              let subscriptionType = '';
              if (value === '신규가입') subscriptionType = 'new';
              else if (value === '번호이동') subscriptionType = 'transfer';
              else if (value === '기기변경') subscriptionType = 'change';
              
              if (subscriptionType) {
                params.append('subscription_type', subscriptionType);
              }
            }
            // 요금제 필터 변환
            else if (key === 'priceRange') {
              params.append('plan_info', value);
            }
            // 통신사 필터
            else if (key === 'carrier') {
              let carrierCode = value;
              if (value === 'LG U+') carrierCode = 'LGU';
              params.append('telecom_carrier', carrierCode);
            }
            // 제조사 필터
            else if (key === 'manufacturer') {
              params.append('manufacturer', value);
            }
            // 나머지 필터들
            else {
              params.append(key, value);
            }
          }
        });
      }
      
      console.log('공구 목록 요청 파라미터:', params.toString());
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('공구 목록을 불러오는데 실패했습니다.');
      }
      
      let data = await response.json();
      
      // 프론트엔드에서 추가 필터링은 제거 - 백엔드에서 처리하도록 함
      // 전체 탭은 모든 공구 표시
      
      setGroupBuys(data);
    } catch (err) {
      console.error('공구 목록 로딩 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      toast.error('공구 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, accessToken]);

  /**
   * 필터 변경 처리
   */
  const handleFiltersChange = (filters: Record<string, string>) => {
    fetchGroupBuys(filters, activeTab);
  };

  /**
   * 탭 변경 처리
   */
  const handleTabChange = useCallback((tab: string) => {
    console.log('탭 변경:', tab);
    setActiveTab(tab);
    
    // URL 쿼리 파라미터에서 필터 추출
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (['manufacturer', 'carrier', 'purchaseType', 'priceRange', 'search'].includes(key)) {
        filters[key] = value;
      }
    });
    
    // 탭에 따른 필터 설정은 fetchGroupBuys에서 처리 - 새로운 탭 값 전달
    fetchGroupBuys(filters, tab);
  }, [searchParams, fetchGroupBuys]);

  /**
   * 사용자 참여 공구 및 입찰 공구 ID 목록 가져오기
   */
  const fetchUserParticipationsAndBids = useCallback(async () => {
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
          const participationIds = data.map((p: any) => p.groupbuy);
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
  }, [accessToken, user?.role]);

  /**
   * 초기 데이터 로딩
   */
  useEffect(() => {
    // URL 쿼리 파라미터에서 필터 추출
    const filters: Record<string, string> = {};
    let hasRefreshParam = false;
    
    searchParams.forEach((value, key) => {
      if (['manufacturer', 'carrier', 'purchaseType', 'priceRange', 'sort', 'search'].includes(key)) {
        filters[key] = value;
      }
      if (key === 'refresh') {
        hasRefreshParam = true;
      }
    });
    
    fetchGroupBuys(filters, activeTab);
    
    // 사용자가 로그인한 경우 참여/입찰 정보 가져오기
    if (accessToken) {
      fetchUserParticipationsAndBids();
    }
    
    // refresh 파라미터가 있으면 URL에서 제거
    if (hasRefreshParam) {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('refresh');
      const newUrl = newSearchParams.toString() ? `?${newSearchParams.toString()}` : '';
      router.replace(`/group-purchases${newUrl}`);
    }
  }, [activeTab, searchParams, accessToken, fetchUserParticipationsAndBids, router, fetchGroupBuys]);

  /**
   * 페이지가 다시 포커스될 때 데이터 새로고침
   */
  useEffect(() => {
    const handleFocus = () => {
      // 사용자가 로그인한 경우 참여/입찰 정보 다시 가져오기
      if (accessToken) {
        console.log('페이지 포커스 감지 - 참여/입찰 정보 새로고침');
        fetchUserParticipationsAndBids();
      }
    };

    // 페이지가 포커스될 때 이벤트 리스너 추가
    window.addEventListener('focus', handleFocus);
    
    // visibility change 이벤트도 추가 (탭 전환 시)
    const handleVisibilityChange = () => {
      if (!document.hidden && accessToken) {
        console.log('페이지 가시성 변경 감지 - 참여/입찰 정보 새로고침');
        fetchUserParticipationsAndBids();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // popstate 이벤트 리스너 추가 (뒤로가기/앞으로가기)
    const handlePopState = () => {
      if (accessToken) {
        console.log('네비게이션 감지 - 참여/입찰 정보 새로고침');
        fetchUserParticipationsAndBids();
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [accessToken, fetchUserParticipationsAndBids]);

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
              <TabsTrigger value="newest">최신순</TabsTrigger>
              <TabsTrigger value="completed">공구완료</TabsTrigger>
            </TabsList>

            {/* 통합된 콘텐츠 영역 - 모든 탭이 동일한 데이터 표시 */}
            <div className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                  ))
                ) : error ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">{error}</p>
                  </div>
                ) : groupBuys.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">
                      {activeTab === 'all' && '공동구매가 없습니다.'}
                      {activeTab === 'popular' && '인기 공동구매가 없습니다.'}
                      {activeTab === 'newest' && '새로운 공동구매가 없습니다.'}
                      {activeTab === 'completed' && '종료된 공동구매가 없습니다.'}
                    </p>
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
            </div>
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
