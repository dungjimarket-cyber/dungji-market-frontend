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
import { PopupManager } from '@/components/popup/PopupDisplay';
import { Black_Han_Sans } from 'next/font/google';

const blackHanSans = Black_Han_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

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
  const [customDeals, setCustomDeals] = useState<any[]>([]);
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
    
    // 커공특가와 견적받기 데이터 가져오기
    const fetchGroupBuys = async () => {
      try {
        const [customDealsResponse, newResponse] = await Promise.all([
          // 커공특가: 최신순 4개
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?status=recruiting&ordering=-created_at&limit=4`, {
            next: { revalidate: 60 } // 1분 캐시
          }),
          // 견적받기: recruiting,bidding 상태만, 시작시간 최신순으로 정렬
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?status=recruiting,bidding&ordering=-start_time&limit=10`, {
            next: { revalidate: 60 } // 1분 캐시
          })
        ]);

        if (customDealsResponse.ok && newResponse.ok) {
          const customDealsData = await customDealsResponse.json();
          const newData = await newResponse.json();

          // 페이징 응답 형식과 배열 형식 모두 지원
          const customDealsItems = Array.isArray(customDealsData)
            ? customDealsData
            : (customDealsData.results || []);
          const newItems = Array.isArray(newData)
            ? newData
            : (newData.results || []);

          setCustomDeals(customDealsItems);
          setNewGroupBuys(newItems.slice(0, 2));
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
      {/* 팝업 매니저 */}
      <PopupManager />
      
      {/* 공지사항 섹션 - 최상단 */}
      <NoticeSection />
      
      {/* 모바일 환경에서만 표시되는 헤더 */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      <div className="container mx-auto px-4 py-1 md:py-6 pb-16 sm:pb-20 md:pb-6 max-w-full">
      {/* 배너 캐러셀을 맨 위로 이동 - PC에서 간격 더 줄임 */}
      <section className="mb-2 md:mb-6">
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
          <Link
            href="/custom-deals"
            className="btn-animated bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">커스텀공구</span>
          </Link>

          <Link
            href="/group-purchases"
            className="btn-animated btn-secondary whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">지원금 견적서비스</span>
          </Link>

          <Link
            href="/used"
            className="btn-animated btn-primary whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">중고거래</span>
          </Link>

          <Link
            href="/events"
            className="btn-animated bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">이벤트</span>
          </Link>
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
        {/* 커공특가 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <h2 className={`${blackHanSans.className} text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600`}>
              커공특가
            </h2>
            <span className="text-sm sm:text-base text-gray-600 font-medium">
              차원이 다른 선착순 할인 혜택!
            </span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-40 rounded-lg"></div>
                ))}
              </div>
            ) : customDeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">진행 중인 커공특가가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {customDeals.map((deal) => (
                  <Link key={deal.id} href={`/custom-deals/${deal.id}`}>
                    <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex flex-col gap-3">
                        {/* 상단: 이미지 + 할인정보 */}
                        <div className="flex gap-4">
                          {/* 이미지 */}
                          {deal.primary_image ? (
                            <img
                              src={deal.primary_image}
                              alt={deal.title}
                              className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg flex-shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-gray-400 text-xs">이미지 없음</span>
                            </div>
                          )}

                          {/* 가격 정보 */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {deal.pricing_type === 'coupon_only' ? (
                              // 쿠폰전용: 선착순 이벤트 뱃지만 표시
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black tracking-tighter text-white bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm">
                                  선착순 이벤트
                                </span>
                              </div>
                            ) : deal.original_price && deal.final_price ? (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg sm:text-xl font-bold text-red-600">
                                    {deal.discount_rate}%
                                  </span>
                                  <span className="text-xs font-black tracking-tighter text-white bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                                    커공특가
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 line-through mb-1">
                                  {deal.original_price.toLocaleString()}원
                                </div>
                                <div className="text-lg sm:text-xl font-bold text-slate-900">
                                  {typeof deal.final_price === 'object' && deal.final_price !== null
                                    ? ((deal.final_price as any).min || 0).toLocaleString()
                                    : deal.final_price.toLocaleString()}원
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-blue-600">
                                    {deal.discount_rate}% 할인
                                  </span>
                                  <span className="text-xs font-black tracking-tighter text-white bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-1 rounded-md whitespace-nowrap shadow-sm">
                                    커공특가
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">전품목</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 하단: 상품명 (2줄 말줄임) */}
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2">
                          {deal.title}
                        </h3>

                        {/* 참여 현황 - 주석 처리 */}
                        {/* <div className="flex items-center gap-2 text-base text-gray-600">
                          <span className="font-medium">{deal.current_participants}/{deal.target_participants}명</span>
                          <span>•</span>
                          <span className="text-sm">
                            {deal.type === 'offline' ? '오프라인매장' : '온라인'}
                          </span>
                        </div> */}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="text-center mt-6">
              <Link href="/custom-deals" className="text-green-600 hover:underline text-base font-medium">
                더 많은 커공특가 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* 견적받기 섹션 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className={`${blackHanSans.className} text-3xl sm:text-4xl mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500`}>견적받기</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
                ))}
              </div>
            ) : newGroupBuys.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">견적 요청 가능한 상품이 없습니다.</p>
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
              <Link href="/group-purchases" className="text-blue-600 hover:underline text-sm">
                더 많은 견적 상품 보기 →
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dungji-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
