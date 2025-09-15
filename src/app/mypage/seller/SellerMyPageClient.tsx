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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Gavel, Clock, Package, CheckCircle2, XCircle, Users, ChevronRight, AlertCircle, MessageSquare } from 'lucide-react';

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
  
  // 각 섹션의 데이터 카운트 상태 관리
  const [counts, setCounts] = useState({
    waitingBuyer: 0,
    pendingSeller: 0,
    trading: 0,
    completed: 0,
    cancelled: 0
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

  // 각 카테고리별 데이터 개수 가져오기
  useEffect(() => {
    const fetchCounts = async () => {
      if (!isAuthenticated || !accessToken) return;
      
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
        const pendingCount = await fetchPendingSeller();
        setPageLoading(false); // 중요한 데이터 로드 후 즉시 페이지 표시
        
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
      } finally {
        setPageLoading(false);
      }
    };
    
    fetchCounts();
  }, [isAuthenticated, accessToken]);
  
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
      <h1 className="text-2xl font-bold mb-6">판매자 마이페이지</h1>
      
      {/* 프로필 섹션 */}
      <ProfileSection />
      
      {/* 패널티 알림 표시 */}
      <PenaltyAlert penaltyInfo={user?.penalty_info || user?.penaltyInfo} userRole="seller" />
      
      {/* 판매 활동 섹션 */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold mb-4">판매 활동</h2>
        
        {/* 견적내역보기 버튼 - 판매활동 바로 아래로 이동 */}
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

        {/* 노쇼 관련 버튼들 */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => router.push('/mypage/noshow-objections')}
            className="flex items-center gap-2 py-2 px-4 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
          >
            <MessageSquare className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
            <span>이의제기 내역</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </button>
          <button
            onClick={() => router.push('/mypage/noshow-reports')}
            className="flex items-center gap-2 py-2 px-4 text-sm text-gray-600 hover:text-orange-600 transition-colors group"
          >
            <AlertCircle className="w-4 h-4 text-orange-500 group-hover:text-orange-600" />
            <span>노쇼 신고 내역</span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}