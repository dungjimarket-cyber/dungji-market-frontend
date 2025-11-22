'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { SearchBar } from '@/components/search/SearchBar';
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
 * 메인 홈페이지 컨텐츠 컴포넌트
 */
function HomeContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [customDeals, setCustomDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    setMounted(true);

    // 커공특가 데이터 가져오기
    const fetchGroupBuys = async () => {
      try {
        // 커공특가: 최신순 8개 (양쪽 4개씩)
        const customDealsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?status=recruiting&ordering=-created_at&limit=8`,
          { next: { revalidate: 60 } } // 1분 캐시
        );

        if (customDealsResponse.ok) {
          const customDealsData = await customDealsResponse.json();

          // 페이징 응답 형식과 배열 형식 모두 지원
          const customDealsItems = Array.isArray(customDealsData)
            ? customDealsData
            : (customDealsData.results || []);

          // 시장가와 공구가 기반으로 할인율 재계산
          const recalculatedCustomDeals = customDealsItems.map((deal: any) => {
            if (deal.original_price && deal.final_price) {
              const calculatedRate = Math.floor((1 - deal.final_price / deal.original_price) * 100);
              return {
                ...deal,
                discount_rate: Math.max(0, Math.min(99, calculatedRate))
              };
            }
            return deal;
          });

          setCustomDeals(recalculatedCustomDeals);
        }
      } catch (error) {
        console.error('공구 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupBuys();
  }, []);
  
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

          {/* <Link
            href="/group-purchases"
            className="btn-animated btn-secondary whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">지원금 견적서비스</span>
          </Link> */}

          <Link
            href="/local-businesses"
            className="btn-animated btn-secondary whitespace-nowrap px-3 py-4 sm:px-6 sm:py-2 flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-xs sm:text-base">우리동네 전문가</span>
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
        {/* 커공/이벤트 섹션 - 왼쪽 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <h2 className={`${blackHanSans.className} text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600`}>
              커공/이벤트
            </h2>
            <span className="text-sm sm:text-base text-gray-600 font-medium">
              차원이 다른 혜택 정보!
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
                <p className="text-gray-500">진행 중인 커공/이벤트가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {customDeals.slice(0, 4).map((deal) => (
                  <Link key={deal.id} href={`/custom-deals/${deal.id}`}>
                    <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:items-center">
                        {/* 상단: 이미지 + 할인정보 */}
                        <div className="flex gap-6 md:gap-4">
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
                              // 쿠폰전용: 기간행사는 "기간행사", 인원모집은 "선착순 이벤트"
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black tracking-tighter text-white bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm">
                                  {deal.deal_type === 'time_based' ? '기간행사' : '선착순 이벤트'}
                                </span>
                              </div>
                            ) : deal.original_price && deal.final_price ? (
                              <>
                                {deal.discount_rate > 0 ? (
                                  <>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-lg sm:text-xl font-bold text-red-600">
                                        {deal.discount_rate}%
                                      </span>
                                      {/* 기간행사 vs 커공특가 배지 구분 */}
                                      <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                        deal.deal_type === 'time_based'
                                          ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                          : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                      }`}>
                                        {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 line-through mb-1">
                                      {deal.original_price.toLocaleString()}원
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-end mb-1">
                                    {/* 할인율 0%: 배지만 오른쪽 정렬 */}
                                    <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                      deal.deal_type === 'time_based'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                    }`}>
                                      {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                    </span>
                                  </div>
                                )}
                                <div className="text-lg sm:text-xl font-bold text-slate-900">
                                  {typeof deal.final_price === 'object' && deal.final_price !== null
                                    ? ((deal.final_price as any).min || 0).toLocaleString()
                                    : deal.final_price.toLocaleString()}원
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {deal.discount_rate > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-blue-600">
                                      {deal.discount_rate}% 할인
                                    </span>
                                    {/* 기간행사 vs 커공특가 배지 구분 */}
                                    <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                      deal.deal_type === 'time_based'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                    }`}>
                                      {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end">
                                    {/* 할인율 0%: 배지만 오른쪽 정렬 */}
                                    <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                      deal.deal_type === 'time_based'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                    }`}>
                                      {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                    </span>
                                  </div>
                                )}
                                <div className="text-xs text-gray-600">전품목</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 하단: 상품명 (2줄 말줄임) */}
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 md:flex-1 md:min-w-0">
                          {deal.title}
                        </h3>

                        {/* 기간행사: 판매기간 표시 */}
                        {deal.deal_type === 'time_based' && deal.expired_at && (
                          <div className="flex items-center gap-2 text-sm text-orange-600 mt-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">
                              판매기간: {(() => {
                                const now = new Date();
                                const expire = new Date(deal.expired_at);
                                const diff = expire.getTime() - now.getTime();
                                if (diff <= 0) return '마감';
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                if (days > 0) return `${days}일 남음`;
                                return `${hours}시간 남음`;
                              })()}
                            </span>
                          </div>
                        )}

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
                더 많은 커공/이벤트 보기 →
              </Link>
            </div>
          </div>
        </div>

        {/* 커공/이벤트 섹션 - 오른쪽 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <h2 className={`${blackHanSans.className} text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600`}>
              커공/이벤트
            </h2>
            <span className="text-sm sm:text-base text-gray-600 font-medium">
              차원이 다른 혜택 정보!
            </span>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-40 rounded-lg"></div>
                ))}
              </div>
            ) : customDeals.length <= 4 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">더 많은 커공/이벤트가 곧 등록됩니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {customDeals.slice(4, 8).map((deal) => (
                  <Link key={deal.id} href={`/custom-deals/${deal.id}`}>
                    <div className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer">
                      <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:items-center">
                        {/* 상단: 이미지 + 할인정보 */}
                        <div className="flex gap-6 md:gap-4">
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
                              // 쿠폰전용: 기간행사는 "기간행사", 인원모집은 "선착순 이벤트"
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black tracking-tighter text-white bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-md whitespace-nowrap shadow-sm">
                                  {deal.deal_type === 'time_based' ? '기간행사' : '선착순 이벤트'}
                                </span>
                              </div>
                            ) : deal.original_price && deal.final_price ? (
                              <>
                                {deal.discount_rate > 0 ? (
                                  <>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-lg sm:text-xl font-bold text-red-600">
                                        {deal.discount_rate}%
                                      </span>
                                      {/* 기간행사 vs 커공특가 배지 구분 */}
                                      <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                        deal.deal_type === 'time_based'
                                          ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                          : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                      }`}>
                                        {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500 line-through mb-1">
                                      {deal.original_price.toLocaleString()}원
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-end mb-1">
                                    {/* 할인율 0%: 배지만 오른쪽 정렬 */}
                                    <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                      deal.deal_type === 'time_based'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                    }`}>
                                      {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                    </span>
                                  </div>
                                )}
                                <div className="text-lg sm:text-xl font-bold text-slate-900">
                                  {typeof deal.final_price === 'object' && deal.final_price !== null
                                    ? ((deal.final_price as any).min || 0).toLocaleString()
                                    : deal.final_price.toLocaleString()}원
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {deal.discount_rate > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-blue-600">
                                      {deal.discount_rate}% 할인
                                    </span>
                                    {/* 기간행사 vs 커공특가 배지 구분 */}
                                    <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                      deal.deal_type === 'time_based'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                    }`}>
                                      {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-end">
                                    {/* 할인율 0%: 배지만 오른쪽 정렬 */}
                                    <span className={`text-xs font-black tracking-tighter text-white px-2 py-1 rounded-md whitespace-nowrap shadow-sm ${
                                      deal.deal_type === 'time_based'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500'
                                        : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                    }`}>
                                      {deal.deal_type === 'time_based' ? '기간행사' : '커공특가'}
                                    </span>
                                  </div>
                                )}
                                <div className="text-xs text-gray-600">전품목</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 하단: 상품명 (2줄 말줄임) */}
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2 md:flex-1 md:min-w-0">
                          {deal.title}
                        </h3>

                        {/* 기간행사: 판매기간 표시 */}
                        {deal.deal_type === 'time_based' && deal.expired_at && (
                          <div className="flex items-center gap-2 text-sm text-orange-600 mt-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold">
                              판매기간: {(() => {
                                const now = new Date();
                                const expire = new Date(deal.expired_at);
                                const diff = expire.getTime() - now.getTime();
                                if (diff <= 0) return '마감';
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                if (days > 0) return `${days}일 남음`;
                                return `${hours}시간 남음`;
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <div className="text-center mt-6">
              <Link href="/custom-deals" className="text-green-600 hover:underline text-base font-medium">
                더 많은 커공/이벤트 보기 →
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
