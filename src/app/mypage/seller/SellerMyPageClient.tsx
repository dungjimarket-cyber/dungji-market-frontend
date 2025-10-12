'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProfileSection from '@/components/mypage/seller/ProfileSection';
import WaitingBuyerSelection from '@/components/mypage/seller/WaitingBuyerSelection';
import PendingSellerDecision from '@/components/mypage/seller/PendingSellerDecision';
import TradingGroupBuys from '@/components/mypage/seller/TradingGroupBuys';
import CompletedSales from '@/components/mypage/seller/CompletedSales';
import CancelledGroupBuys from '@/components/mypage/seller/CancelledGroupBuys';
import PenaltyAlert from '@/components/penalty/PenaltyAlert';
// 구매활동용 컴포넌트 import
import ParticipatingGroupBuys from '@/components/mypage/ParticipatingGroupBuys';
import PendingSelectionGroupBuys from '@/components/mypage/PendingSelectionGroupBuys';
import WaitingSellerDecisionGroupBuys from '@/components/mypage/WaitingSellerDecisionGroupBuys';
import PurchaseConfirmedGroupBuys from '@/components/mypage/PurchaseConfirmedGroupBuys';
import CompletedGroupBuys from '@/components/mypage/CompletedGroupBuys';
import MyCustomParticipations from '@/components/mypage/custom/MyCustomParticipations';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Gavel, Clock, Package, CheckCircle2, XCircle, Users, ChevronRight, AlertCircle, MessageSquare, AlertTriangle, Settings, Smartphone, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getSellerProfile } from '@/lib/api/sellerService';

/**
 * 판매자 마이페이지 클라이언트 컴포넌트
 * 6개 카테고리로 구성:
 * 1. 견적제안 내역
 * 2. 구매자 최종선택 대기중
 * 3. 판매확정/포기 선택하기
 * 4. 거래중
 * 5. 판매완료
 * 6. 취소된 공구
 */
export default function SellerMyPageClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [sellerCategory, setSellerCategory] = useState<string | null>(null);

  // 각 섹션의 데이터 카운트 상태 관리 (판매활동)
  const [counts, setCounts] = useState({
    waitingBuyer: 0,
    pendingSeller: 0,
    trading: 0,
    completed: 0,
    cancelled: 0
  });

  // 구매활동 카운트 상태 관리
  const [buyerCounts, setBuyerCounts] = useState({
    participating: 0,
    pendingSelection: 0,
    waitingSeller: 0,
    purchaseInProgress: 0,
    completedGroupBuys: 0,
    cancelledGroupBuys: 0,
    customParticipations: 0
  });

  
  // 아코디언 열림 상태 관리
  const [accordionValue, setAccordionValue] = useState<string | undefined>();

  // 카운트 새로고침 함수
  const refreshCounts = async () => {
    if (!isAuthenticated || !accessToken) return;

    try {
      const responses = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_waiting_buyer/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_pending_decision/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_trading/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_completed/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_cancelled/`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      const [waitingBuyer, pendingSeller, trading, completed, cancelled] = responses;

      const newCounts = { ...counts };

      if (waitingBuyer.status === 'fulfilled' && waitingBuyer.value.ok) {
        const data = await waitingBuyer.value.json();
        newCounts.waitingBuyer = data.length;
      }
      if (pendingSeller.status === 'fulfilled' && pendingSeller.value.ok) {
        const data = await pendingSeller.value.json();
        newCounts.pendingSeller = data.length;
      }
      if (trading.status === 'fulfilled' && trading.value.ok) {
        const data = await trading.value.json();
        newCounts.trading = data.length;
      }
      if (completed.status === 'fulfilled' && completed.value.ok) {
        const data = await completed.value.json();
        newCounts.completed = data.length;
      }
      if (cancelled.status === 'fulfilled' && cancelled.value.ok) {
        const data = await cancelled.value.json();
        newCounts.cancelled = data.length;
      }

      setCounts(newCounts);
    } catch (error) {
      console.error('카운트 새로고침 오류:', error);
    }
  };

  // 판매유형 가져오기
  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!isAuthenticated || !accessToken) return;

      try {
        const profile = await getSellerProfile();
        setSellerCategory(profile.sellerCategory || null);
      } catch (error) {
        console.error('판매자 프로필 조회 오류:', error);
      } finally {
        // 판매유형 조회 후 페이지 로딩 해제
        setPageLoading(false);
      }
    };

    fetchSellerProfile();
  }, [isAuthenticated, accessToken]);

  // 구매활동 카운트 가져오기 (일반/전자제품 판매자용)
  useEffect(() => {
    const fetchBuyerCounts = async () => {
      if (!isAuthenticated || !accessToken || !sellerCategory) return;
      if (sellerCategory !== 'general' && sellerCategory !== 'electronics') return;

      try {
        const responses = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/joined_groupbuys/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/pending_selection/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/waiting_seller_decision/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/purchase_confirmed/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/purchase_completed/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/cancelled_groupbuys/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-participants/`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          })
        ]);

        const newCounts = { ...buyerCounts };

        if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
          const data = await responses[0].value.json();
          newCounts.participating = data.length;
        }
        if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
          const data = await responses[1].value.json();
          newCounts.pendingSelection = data.filter((item: any) => item.my_final_decision !== 'cancelled').length;
        }
        if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
          const data = await responses[2].value.json();
          newCounts.waitingSeller = data.length;
        }
        if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
          const data = await responses[3].value.json();
          newCounts.purchaseInProgress = data.length;
        }
        if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
          const data = await responses[4].value.json();
          newCounts.completedGroupBuys = data.length;
        }
        if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
          const data = await responses[5].value.json();
          newCounts.cancelledGroupBuys = data.length;
        }
        if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
          const data = await responses[6].value.json();
          const participations = Array.isArray(data) ? data : data.results || [];
          newCounts.customParticipations = participations.length;
        }

        setBuyerCounts(newCounts);
      } catch (error) {
        console.error('구매활동 카운트 조회 오류:', error);
      }
    };

    fetchBuyerCounts();
  }, [isAuthenticated, accessToken, sellerCategory]);

  // 각 카테고리별 데이터 개수 가져오기 (판매활동 - 통신/렌탈만)
  useEffect(() => {
    const fetchCounts = async () => {
      if (!isAuthenticated || !accessToken || !sellerCategory) return;
      if (sellerCategory !== 'telecom' && sellerCategory !== 'rental') return;

      try {
        // 중요한 항목(판매확정/포기)만 먼저 로드
        const fetchPendingSeller = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_pending_decision/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setCounts(prev => ({ ...prev, pendingSeller: data.length }));
            return data.length;
          }
          return 0;
        };

        // 먼저 중요한 데이터 로드
        await fetchPendingSeller();

        // 나머지는 비동기로 로드 (페이지 표시를 막지 않음)
        const loadRemainingCounts = async () => {
          const responses = await Promise.allSettled([
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_waiting_buyer/`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_trading/`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_completed/`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }),
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_cancelled/`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            })
          ]);

          const [waitingBuyer, trading, completed, cancelled] = responses;

          if (waitingBuyer.status === 'fulfilled' && waitingBuyer.value.ok) {
            const data = await waitingBuyer.value.json();
            setCounts(prev => ({ ...prev, waitingBuyer: data.length }));
          }
          if (trading.status === 'fulfilled' && trading.value.ok) {
            const data = await trading.value.json();
            setCounts(prev => ({ ...prev, trading: data.length }));
          }
          if (completed.status === 'fulfilled' && completed.value.ok) {
            const data = await completed.value.json();
            setCounts(prev => ({ ...prev, completed: data.length }));
          }
          if (cancelled.status === 'fulfilled' && cancelled.value.ok) {
            const data = await cancelled.value.json();
            setCounts(prev => ({ ...prev, cancelled: data.length }));
          }
        };

        loadRemainingCounts();
      } catch (error) {
        console.error('판매자 마이페이지 데이터 로딩 오류:', error);
      }
    };

    fetchCounts();
  }, [isAuthenticated, accessToken, sellerCategory]);
  
  // 판매자 권한 확인
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role !== 'seller') {
        router.push('/mypage');
      }
    }
  }, [isAuthenticated, user, router]);
  
  // URL 해시에 따라 아코디언 자동 열기
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setAccordionValue(hash);
      }
    };
    
    // 초기 로드 시 해시 확인
    handleHashChange();
    
    // 해시 변경 이벤트 리스너
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  if (isLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">마이페이지</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/used/mypage')}
            className="flex items-center"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            중고거래 내역
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/mypage/seller/settings')}
            className="flex items-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            내 정보 설정
          </Button>
        </div>
      </div>

      {/* 프로필 섹션 */}
      <ProfileSection />

      {/* 패널티 알림 표시 */}
      <PenaltyAlert penaltyInfo={user?.penalty_info || user?.penaltyInfo} userRole="seller" />

      {/* 판매유형 미설정 안내 */}
      {!sellerCategory && (
        <Card className="mt-8 border-2 border-amber-200 bg-amber-50">
          <div className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
            <h3 className="text-lg font-semibold text-amber-900">판매유형을 설정해주세요</h3>
            <p className="text-sm text-amber-800">
              마이페이지를 이용하시려면 먼저 판매유형을 설정해야 합니다.<br/>
              설정 페이지에서 판매하시는 상품/서비스 유형을 선택해주세요.
            </p>
            <Button
              onClick={() => router.push('/mypage/seller/settings')}
              className="mt-4"
            >
              <Settings className="w-4 h-4 mr-2" />
              설정 페이지로 이동
            </Button>
          </div>
        </Card>
      )}

      {/* 통신/렌탈 - 판매 활동 섹션 */}
      {(sellerCategory === 'telecom' || sellerCategory === 'rental') && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold mb-4">판매 활동</h2>

          {/* 견적내역보기 버튼 */}
          <button
            onClick={() => router.push('/mypage/seller/bids')}
            className="flex items-center gap-2 py-2 px-4 text-sm text-gray-600 hover:text-blue-600 transition-colors group mb-4"
          >
            <Gavel className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
            <span>견적내역 전체보기</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </button>

          <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          {/* 1. 구매자 최종선택 대기중 */}
          <AccordionItem value="waiting-buyer">
            <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  <span className="text-sm font-medium">구매자 최종선택 대기중</span>
                </div>
                <div className="flex items-center gap-2">
                  {counts.waitingBuyer > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-yellow-500 text-white text-sm font-semibold rounded-full">
                      {counts.waitingBuyer}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                      {counts.waitingBuyer}
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WaitingBuyerSelection />
            </AccordionContent>
          </AccordionItem>
          
          {/* 2. 판매확정/포기 선택하기 */}
          <AccordionItem value="pending-decision">
            <AccordionTrigger className="py-2 bg-orange-50 px-2 rounded-lg hover:bg-orange-100 group transition-all mt-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-orange-700">판매확정/포기 선택하기</span>
                </div>
                <div className="flex items-center gap-2">
                  {counts.pendingSeller > 0 ? (
                    <>
                      <span className="text-xs sm:text-sm text-orange-600 font-medium">선택 대기중</span>
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-orange-500 text-white text-sm font-semibold rounded-full animate-pulse">
                        {counts.pendingSeller}
                      </span>
                    </>
                  ) : (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                      {counts.pendingSeller}
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <PendingSellerDecision />
            </AccordionContent>
          </AccordionItem>
          
          {/* 3. 거래중 */}
          <AccordionItem value="trading">
            <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium">거래중</span>
                </div>
                <div className="flex items-center gap-2">
                  {counts.trading > 0 ? (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-green-500 text-white text-sm font-semibold rounded-full">
                      {counts.trading}
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                      {counts.trading}
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <TradingGroupBuys onComplete={refreshCounts} />
            </AccordionContent>
          </AccordionItem>
          
          {/* 4. 거래종료 */}
          <AccordionItem value="completed">
            <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm font-medium">거래종료</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-600 text-sm rounded-full">
                    {counts.completed}
                  </span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompletedSales />
            </AccordionContent>
          </AccordionItem>
          
          {/* 5. 취소된 공구 */}
          <AccordionItem value="cancelled">
            <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium">취소된 공구</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-600 text-sm rounded-full">
                    {counts.cancelled}
                  </span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CancelledGroupBuys />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 노쇼 관리 통합 버튼 */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/mypage/noshow-management')}
            className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5"
          >
            <AlertTriangle className="w-3 h-3" />
            노쇼관리
          </Button>
        </div>
        </div>
      )}

      {/* 일반/전자제품 - 구매 활동 섹션 */}
      {(sellerCategory === 'general' || sellerCategory === 'electronics') && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold mb-4">구매 활동</h2>

          <Accordion type="single" collapsible className="w-full">
            {/* 참여중인 공구 */}
            <AccordionItem value="participating">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-blue-500" />
                    <span className="text-sm font-medium">참여중인 공구</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyerCounts.participating > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-blue-500 text-white text-sm font-semibold rounded-full">
                        {buyerCounts.participating}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {buyerCounts.participating}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <ParticipatingGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 구매확정/포기 선택하기 */}
            <AccordionItem value="pending">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <ShoppingBag className="w-4 h-4 mr-2 text-amber-500" />
                    <span className="text-sm font-medium">구매확정/포기 선택하기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyerCounts.pendingSelection > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-amber-500 text-white text-sm font-semibold rounded-full">
                        {buyerCounts.pendingSelection}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {buyerCounts.pendingSelection}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-amber-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <PendingSelectionGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 판매자 최종선택 대기중 */}
            <AccordionItem value="waiting-seller">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="text-sm font-medium">판매자 최종선택 대기중</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyerCounts.waitingSeller > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-purple-500 text-white text-sm font-semibold rounded-full">
                        {buyerCounts.waitingSeller}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {buyerCounts.waitingSeller}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-purple-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <WaitingSellerDecisionGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 거래중 */}
            <AccordionItem value="purchase-confirmed">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm font-medium">거래중</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyerCounts.purchaseInProgress > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-green-500 text-white text-sm font-semibold rounded-full">
                        {buyerCounts.purchaseInProgress}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {buyerCounts.purchaseInProgress}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-green-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <PurchaseConfirmedGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 거래종료 */}
            <AccordionItem value="purchase-completed">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm font-medium">거래종료</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-600 text-sm rounded-full">
                      {buyerCounts.completedGroupBuys}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <CompletedGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 취소된 공구 */}
            <AccordionItem value="cancelled">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 mr-2 text-red-500" />
                    <span className="text-sm font-medium">취소된 공구</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-600 text-sm rounded-full">
                      {buyerCounts.cancelledGroupBuys}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-red-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <CompletedGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 커스텀 특가 참여내역 */}
            <AccordionItem value="custom-participations">
              <AccordionTrigger className="py-2 bg-gray-50 px-2 rounded-lg hover:bg-gray-100 group transition-all mt-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                    <span className="text-sm font-medium">커스텀 특가 참여내역</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyerCounts.customParticipations > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-purple-500 text-white text-sm font-semibold rounded-full">
                        {buyerCounts.customParticipations}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {buyerCounts.customParticipations}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-purple-500" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <MyCustomParticipations />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* 노쇼 관리 통합 버튼 */}
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/mypage/noshow-management')}
              className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5"
            >
              <AlertTriangle className="w-3 h-3" />
              노쇼관리
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}