'use client';

import { useEffect, useState, Suspense } from 'react';
import Categories from '@/components/Categories';
import Link from 'next/link';
import { GroupPurchaseCard } from '@/components/group-purchase/GroupPurchaseCard';
import { RoleButton } from '@/components/auth/RoleButton';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { IoMdClose } from 'react-icons/io';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { getSellerBids } from '@/lib/api/bidService';
import BannerCarousel from '@/components/banner/BannerCarousel';

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
  const [showIframe, setShowIframe] = useState(false);
  const [userParticipations, setUserParticipations] = useState<number[]>([]);
  const [userBids, setUserBids] = useState<number[]>([]);
  
  // iframe이 열렸을 때 뒤로가기 버튼 처리
  useEffect(() => {
    if (showIframe) {
      // 현재 상태를 history에 추가
      window.history.pushState(null, '', window.location.pathname);
      
      // popstate 이벤트 리스너 추가 (뒤로가기 버튼 클릭 시 발생)
      const handlePopState = () => {
        setShowIframe(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      
      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [showIframe]);
  
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
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?sort=popular&limit=10`),
          // 더 많이 가져와서 필터링 후 선택
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/?sort=newest&limit=10`)
        ]);
        
        if (popularResponse.ok && newResponse.ok) {
          const popularData = await popularResponse.json();
          const newData = await newResponse.json();
          
          // 최종선택중(final_selection, voting, seller_confirmation), 완료(completed), 취소(cancelled) 상태 제외
          const excludedStatuses = ['final_selection', 'voting', 'seller_confirmation', 'completed', 'cancelled'];
          
          // 인기 공구 필터링
          const filteredPopular = popularData.filter((groupBuy: GroupBuy) => 
            !excludedStatuses.includes(groupBuy.status)
          );
          
          // 새로운 공구 필터링
          const filteredNew = newData.filter((groupBuy: GroupBuy) => 
            !excludedStatuses.includes(groupBuy.status)
          );
          
          setPopularGroupBuys(filteredPopular.slice(0, 2));
          setNewGroupBuys(filteredNew.slice(0, 2));
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
      {/* 모바일 환경에서만 표시되는 헤더 */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      <div className="container mx-auto px-4 py-8">
      {/* iframe 팝업 */}
      {showIframe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[80vh] relative">
            <button 
              onClick={() => setShowIframe(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-10"
              aria-label="닫기"
            >
              <IoMdClose size={24} />
            </button>
            <iframe 
              src="https://dungjimarket-guide-wnop7bf.gamma.site/" 
              className="w-full h-full rounded-lg"
              title="둥지마켓 알아보기"
            />
          </div>
        </div>
      )}
      <section className="mb-12">       
        {/* 메인 배너 이미지 */}
        <section className="mb-2">
          
        </section>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-8 mt-4 px-4">
          {/* 판매자 역할이 아닐 때만 공구 등록 버튼 표시 - 클라이언트 컴포넌트 */}
          <RoleButton 
            href="/group-purchases/create"
            className="btn-animated btn-primary whitespace-nowrap px-4 py-3 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            disableForRoles={['seller']}            
          >
            <span className="text-sm sm:text-base">공구 등록하기</span>
          </RoleButton>
          
          <Link 
            href="/group-purchases"
            className="btn-animated btn-secondary whitespace-nowrap px-4 py-3 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-sm sm:text-base">공구 둘러보기</span>
          </Link>
          
          <Link 
            href="/events"
            className="btn-animated btn-accent whitespace-nowrap px-4 py-3 sm:px-6 sm:py-2 shadow-md hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto"
          >
            <span className="text-sm sm:text-base">이벤트</span>
          </Link>
          
          <button
            onClick={() => setShowIframe(!showIframe)}
            className="btn-animated btn-outline whitespace-nowrap px-4 py-3 sm:px-6 sm:py-2 hover:bg-gray-50 transition-all w-full sm:w-auto"
          >
            <span className="text-sm sm:text-base">둥지마켓 알아보기</span>
          </button>
        </div>
      </section>

      {/* 배너 캐러셀 추가 */}
      <section className="mb-12">
        <BannerCarousel />
      </section>

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
                {popularGroupBuys.map((groupBuy) => (
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
