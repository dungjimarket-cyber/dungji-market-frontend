'use client';

import { useEffect, useState, Suspense } from 'react';
import Categories from '@/components/Categories';
import Link from 'next/link';
import { GroupPurchaseCard } from '@/components/group-purchase/GroupPurchaseCard';
import { RoleButton } from '@/components/auth/RoleButton';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSellerBids } from '@/lib/api/bidService';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search/SearchBar';
import { ResponsiveAdSense } from '@/components/ads/GoogleAdSense';
import NoticeSection from '@/components/home/NoticeSection';

const BannerCarousel = dynamic(() => import('@/components/banner/BannerCarousel'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />,
  ssr: false
});

/**
 * 메인 홈페이지 컴포넌트
 */
/**
 * 공구 정보 인터페이스
 */
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
 * 메인 홈페이지 컨텐츠 컴포넌트
 */
function HomeContent() {
  const { isAuthenticated, user, accessToken } = useAuth();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [popularGroupBuys, setPopularGroupBuys] = useState<GroupBuy[]>([]);
  const [newGroupBuys, setNewGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [userParticipations, setUserParticipations] = useState<number[]>([]);
  const [userBids, setUserBids] = useState<number[]>([]);
  
  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    
    if (error && message) {
      toast.error(decodeURIComponent(message));
      // URL에서 에러 파라미터 제거
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

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
  };
  
  useEffect(() => {
    setMounted(true);
    
    // 인기 공구와 새로운 공구 데이터 가져오기
    const fetchGroupBuys = async () => {
      try {
        const [popularResponse, newResponse] = await Promise.all([
          // 인기순: recruiting,bidding 상태만, 참여자 많은 순으로 정렬
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?status=recruiting,bidding&ordering=-current_participants&limit=10`, {
            next: { revalidate: 60 } // 1분 캐시
          }),
          // 최신순: recruiting,bidding 상태만, 시작시간 최신순으로 정렬
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?status=recruiting,bidding&ordering=-start_time&limit=10`, {
            next: { revalidate: 60 } // 1분 캐시
          })
        ]);
        
        if (popularResponse.ok && newResponse.ok) {
          const popularData = await popularResponse.json();
          const newData = await newResponse.json();
          
          // 프론트엔드 필터링 제거 - 백엔드에서 이미 필터링됨
          setPopularGroupBuys(popularData.slice(0, 2));
          setNewGroupBuys(newData.slice(0, 2));
        }
      } catch (error) {
        console.error('공구 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupBuys();
    
    // 사용자가 로그인한 경우 참여/입찰 정보 가져오기
    if (accessToken) {
      fetchUserParticipationsAndBids();
    }
  }, [accessToken, user?.role]);
  
  // 클라이언트 사이드 마운트 전에는 인증 상태를 확인할 수 없음
  const showAuthButtons = mounted ? !isAuthenticated : true;

  return (
    <>
      {/* 공지사항 섹션 - 최상단 */}
      <NoticeSection />
      
      {/* 모바일 환경에서만 표시되는 헤더 */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      <div className="container mx-auto px-4 py-2 md:py-6 pb-28 md:pb-8 max-w-full">
      {/* 배너 캐러셀을 맨 위로 이동 - PC에서 간격 더 줄임 */}
      <section className="mb-4 md:mb-6">
        <BannerCarousel />
      </section>

      {/* 검색 섹션 - 모바일에서는 헤더에 있으므로 숨김 */}
      <section className="mb-6 md:mb-8 hidden md:block">
        <SearchBar 
          className="max-w-2xl mx-auto"
          placeholder="통합검색 (상품명, 지역, 통신사 등)"
          showMyRegionButton={false}
        />
      </section>
      
      <section className="mb-12">       
        <div className="grid grid-cols-2 sm:flex sm:flex-row justify-center items-center gap-2 mb-8 mt-4">
          {/* 판매자 역할이 아닐 때만 공구 등록 버튼 표시 - 클라이언트 컴포넌트 */}
          <RoleButton 
            href="/group-purchases/create"
            className="btn-animated btn-primary whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            disableForRoles={['seller']}            
          >
            <span className="text-xs sm:text-base">공구 등록하기</span>
          </RoleButton>
          
          <Link 
            href="/group-purchases"
            className="btn-animated btn-secondary whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">공구 둘러보기</span>
          </Link>
          
          <Link 
            href="/events"
            className="btn-animated btn-accent whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">이벤트</span>
          </Link>
          
          <a
            href="https://doongji-market-1vi5n3i.gamma.site/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-animated btn-purple whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
          >
            <span className="text-xs sm:text-base">이용가이드</span>
          </a>
        </div>
      </section>

      {/* Google AdSense Banner - 광고 승인 후 활성화 */}
      {/* <section className="mb-8">
        <ResponsiveAdSense className="my-6" />
      </section> */}

      {/* <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">카테고리</h2>
        <Categories />
      </section> */}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">인기 공동구매</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            ) : popularGroupBuys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">인기 공동구매가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {popularGroupBuys.map((groupBuy, index) => (
                  <GroupPurchaseCard 
                    key={groupBuy.id} 
                    groupBuy={groupBuy}
                    isParticipant={userParticipations.includes(groupBuy.id)}
                    hasBid={userBids.includes(groupBuy.id)}
                    priority={index < 2}
                  />
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <Link href="/group-purchases?sort=popular" className="text-blue-600 hover:underline text-sm">
                더 많은 인기 공구 보기 →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4">새로운 공동구매</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            ) : newGroupBuys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">새로운 공동구매가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {newGroupBuys.map((groupBuy) => (
                  <GroupPurchaseCard 
                    key={groupBuy.id} 
                    groupBuy={groupBuy}
                    isParticipant={userParticipations.includes(groupBuy.id)}
                    hasBid={userBids.includes(groupBuy.id)}
                  />
                ))}
              </div>
            )}
            <div className="text-center mt-4">
              <Link href="/group-purchases?sort=newest" className="text-blue-600 hover:underline text-sm">
                더 많은 새로운 공구 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

/**
 * 메인 홈페이지 컴포넌트 (Suspense boundary 포함)
 */
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
