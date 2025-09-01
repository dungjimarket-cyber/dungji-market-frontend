'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProfileSection from '@/components/mypage/seller/ProfileSection';
import BidHistory from '@/components/mypage/seller/BidHistory';
import WaitingBuyerSelection from '@/components/mypage/seller/WaitingBuyerSelection';
import PendingSellerDecision from '@/components/mypage/seller/PendingSellerDecision';
import TradingGroupBuys from '@/components/mypage/seller/TradingGroupBuys';
import CompletedSales from '@/components/mypage/seller/CompletedSales';
import CancelledGroupBuys from '@/components/mypage/seller/CancelledGroupBuys';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Gavel, Clock, Package, CheckCircle2, XCircle, Users, ChevronRight, AlertCircle } from 'lucide-react';

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
  const [bidHistoryCount, setBidHistoryCount] = useState(0);
  const [waitingBuyerCount, setWaitingBuyerCount] = useState(0);
  const [pendingSellerCount, setPendingSellerCount] = useState(0);
  const [tradingCount, setTradingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  
  // 아코디언 열림 상태 관리
  const [accordionValue, setAccordionValue] = useState<string | undefined>();

  // 각 카테고리별 데이터 개수 가져오기
  useEffect(() => {
    const fetchCounts = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        // 견적내역 개수
        const fetchBidHistory = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_bids/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setBidHistoryCount(data.length);
          }
        };
        
        // 구매자 최종선택 대기중 개수
        const fetchWaitingBuyer = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_waiting_buyer/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setWaitingBuyerCount(data.length);
          }
        };
        
        // 판매확정/포기 선택하기 개수
        const fetchPendingSeller = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_pending_decision/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setPendingSellerCount(data.length);
          }
        };
        
        // 거래중 개수
        const fetchTrading = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_trading/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setTradingCount(data.length);
          }
        };
        
        // 판매완료 개수
        const fetchCompleted = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_completed/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setCompletedCount(data.length);
          }
        };
        
        // 취소된 공구 개수
        const fetchCancelled = async () => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_cancelled/`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setCancelledCount(data.length);
          }
        };
        
        // 모든 API 호출을 병렬로 실행
        await Promise.all([
          fetchBidHistory(),
          fetchWaitingBuyer(),
          fetchPendingSeller(),
          fetchTrading(),
          fetchCompleted(),
          fetchCancelled()
        ]);
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
      
      {/* 판매 활동 섹션 */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold mb-4">판매 활동</h2>
        
        <Accordion 
          type="single" 
          collapsible 
          className="w-full"
          value={accordionValue}
          onValueChange={setAccordionValue}
        >
          {/* 1. 견적제안 내역 */}
          <AccordionItem value="bid-history">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Gavel className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">견적제안 내역</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                  <span className="text-xs sm:text-sm text-gray-500">총 {bidHistoryCount}건</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <BidHistory />
            </AccordionContent>
          </AccordionItem>
          
          {/* 2. 구매자 최종선택 대기중 */}
          <AccordionItem value="waiting-buyer">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">구매자 최종선택 대기중</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                  <span className="text-xs sm:text-sm text-gray-500">총 {waitingBuyerCount}건</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WaitingBuyerSelection />
            </AccordionContent>
          </AccordionItem>
          
          {/* 3. 판매확정/포기 선택하기 */}
          <AccordionItem value="pending-decision" className="border-orange-200">
            <AccordionTrigger className="hover:no-underline bg-orange-50">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                  <span className="font-medium text-orange-700 text-sm sm:text-base">판매확정/포기 선택하기</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                  <span className="text-xs sm:text-sm text-orange-600 font-semibold">
                    {pendingSellerCount}건 선택 대기중
                  </span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <PendingSellerDecision />
            </AccordionContent>
          </AccordionItem>
          
          {/* 4. 거래중 */}
          <AccordionItem value="trading">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">거래중</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                  <span className="text-xs sm:text-sm text-gray-500">총 {tradingCount}건</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <TradingGroupBuys />
            </AccordionContent>
          </AccordionItem>
          
          {/* 5. 판매완료 */}
          <AccordionItem value="completed">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">판매완료</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                  <span className="text-xs sm:text-sm text-gray-500">총 {completedCount}건</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CompletedSales />
            </AccordionContent>
          </AccordionItem>
          
          {/* 6. 취소된 공구 */}
          <AccordionItem value="cancelled">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 sm:gap-3">
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">취소된 공구</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2">
                  <span className="text-xs sm:text-sm text-gray-500">총 {cancelledCount}건</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CancelledGroupBuys />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 노쇼 신고 내역 버튼 */}
        <div className="mt-6 flex justify-end">
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