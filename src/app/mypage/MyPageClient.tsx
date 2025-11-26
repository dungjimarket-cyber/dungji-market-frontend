'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
// ProfileSection을 별도 페이지로 분리
import ParticipatingGroupBuys from '@/components/mypage/ParticipatingGroupBuys';
import PurchaseConfirmedGroupBuys from '@/components/mypage/PurchaseConfirmedGroupBuys';
import PendingSelectionGroupBuys from '@/components/mypage/PendingSelectionGroupBuys';
import WaitingSellerDecisionGroupBuys from '@/components/mypage/WaitingSellerDecisionGroupBuys';
import CompletedGroupBuys from '@/components/mypage/CompletedGroupBuys';
import CancelledGroupBuys from '@/components/mypage/CancelledGroupBuys';
import { ConsentNotification } from '@/components/notification/ConsentNotification';
import PenaltyAlert from '@/components/penalty/PenaltyAlert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Package, ShoppingBag, ChevronRight, CheckCircle2, XCircle, Clock, Settings, User, AlertCircle, MessageSquare, AlertTriangle, Shield, X, Smartphone, FileText } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * 마이페이지 클라이언트 컴포넌트
 * 사용자 역할에 따라 다른 UI를 보여줍니다.
 * - 일반 사용자: 참여중인 공구, 최종선택 대기중, 구매 확정, 구매 완료
 * - 판매회원(셀러): 별도 판매자 마이페이지로 리디렉션
 */
export default function MyPageClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // 각 섹션의 데이터 카운트 상태 관리
  const [participatingCount, setParticipatingCount] = useState(0);
  const [pendingSelectionCount, setPendingSelectionCount] = useState(0);
  const [waitingSellerCount, setWaitingSellerCount] = useState(0);
  const [purchaseInProgressCount, setPurchaseInProgressCount] = useState(0);
  const [completedGroupBuysCount, setCompletedGroupBuysCount] = useState(0);
  const [cancelledGroupBuysCount, setCancelledGroupBuysCount] = useState(0);


  // 참여중인 공구 개수 가져오기
  useEffect(() => {
    const fetchParticipatingCount = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/joined_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setParticipatingCount(data.length);
        }
      } catch (error) {
        console.error('참여중인 공구 개수 조회 오류:', error);
      }
    };
    
    // 구매확정/포기 선택하기 상품 개수 가져오기
    const fetchPendingSelectionCount = async () => {
      if (!isAuthenticated || !accessToken) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/pending_selection/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          // 포기하지 않은 공구만 카운트
          const activeCount = data.filter((item: any) => item.my_final_decision !== 'cancelled').length;
          setPendingSelectionCount(activeCount);
        }
      } catch (error) {
        console.error('구매확정/포기 선택하기 개수 조회 오류:', error);
        setPendingSelectionCount(0);
      }
    };
    
    // 판매자 최종선택 대기중인 상품 개수 가져오기
    const fetchWaitingSellerCount = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/waiting_seller_decision/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setWaitingSellerCount(data.length);
        }
      } catch (error) {
        console.error('판매자 최종선택 대기중 개수 조회 오류:', error);
        setWaitingSellerCount(0);
      }
    };
    
    // 구매 진행중인 상품 개수 가져오기
    const fetchPurchaseInProgressCount = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/purchase_confirmed/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setPurchaseInProgressCount(data.length);
        }
      } catch (error) {
        console.error('구매 진행중 개수 조회 오류:', error);
        setPurchaseInProgressCount(0);
      }
    };
    
    // 종료된 공구 개수 가져오기
    const fetchCompletedGroupBuysCount = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/purchase_completed/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCompletedGroupBuysCount(data.length);
        }
      } catch (error) {
        console.error('종료된 공구 개수 조회 오류:', error);
        setCompletedGroupBuysCount(0);
      }
    };
    
    // 취소된 공구 개수 가져오기
    const fetchCancelledGroupBuysCount = async () => {
      if (!isAuthenticated || !accessToken) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/cancelled_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          setCancelledGroupBuysCount(data.length);
        }
      } catch (error) {
        console.error('취소된 공구 개수 조회 오류:', error);
        setCancelledGroupBuysCount(0);
      }
    };

    if (isAuthenticated && accessToken) {
      // 모든 API 호출을 병렬로 실행하여 로딩 시간 단축
      Promise.all([
        fetchParticipatingCount(),
        fetchPendingSelectionCount(),
        fetchWaitingSellerCount(),
        fetchCompletedGroupBuysCount(),
        fetchPurchaseInProgressCount(),
        fetchCancelledGroupBuysCount()
      ]).catch(error => {
        console.error('마이페이지 데이터 로딩 오류:', error);
      });
    }
  }, [isAuthenticated, accessToken]);
  
  useEffect(() => {
    // 사용자 역할 확인
    const checkSellerRole = async () => {
      console.log('마이페이지 인증 상태:', {
        isAuthenticated,
        user,
        email: user?.email,
        role: user?.role
      });
      
      if (isAuthenticated && user) {
        // 판매회원 여부 확인 - user.role 값만 사용
        // 다른 방식(tokenUtils.hasRole 등)으로 확인하는 방식 삭제
        const isSeller = user.role === 'seller';
        
        console.log('판매회원 확인 결과:', {
          role: user.role,
          isSeller: isSeller
        });
        
        // 역할 정보 저장
        setIsSeller(isSeller);
        
        // 판매자인 경우에만 판매자 페이지로 리디렉션
        if (isSeller && !redirecting) {
          console.log('판매자 확인됨: 판매자 마이페이지로 리디렉션');
          setRedirecting(true);
          router.push('/mypage/seller');
          return;
        }
      }
      setPageLoading(false);
    };

    checkSellerRole();
  }, [isAuthenticated, user, router, redirecting]);


  if (isLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-lg font-bold">견적 서비스 내역</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/group-purchases')}
            className="flex items-center"
          >
            <ShoppingBag className="w-4 h-4 mr-1" />
            같이 견적받기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/mypage/settings')}
            className="flex items-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            내 정보 설정
          </Button>
        </div>
      </div>

            {user ? (
        <div className="space-y-6">
          {/* 사용자 정보 카드 */}
          <Card>
            <CardContent className="py-6">
              <div className="flex gap-6 items-center">
                {/* 둥지마켓 메인 이미지 */}
                <div className="flex-shrink-0">
                  <Image
                    src="/logos/dungji_logo.jpg"
                    alt="둥지마켓"
                    width={60}
                    height={60}
                    className="rounded-lg object-contain"
                  />
                </div>
                {/* 사용자 정보 - 수직 중앙 정렬 */}
                <div className="flex-1 flex flex-col justify-center space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">닉네임</p>
                    <p className="text-sm font-medium">{user.nickname || user.username || '설정 필요'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">주요활동지역</p>
                    <p className="text-sm font-medium">
                      {user.address_region?.full_name || '설정 필요'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 패널티 알림 표시 */}
          <PenaltyAlert penaltyInfo={user?.penalty_info || user?.penaltyInfo} userRole="buyer" />
          
          {/* 동의 알림 표시 */}
          <ConsentNotification />
          
          {/* 아코디언 스타일 메뉴 */}
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
                    {participatingCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-blue-500 text-white text-sm font-semibold rounded-full">
                        {participatingCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {participatingCount}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                    {pendingSelectionCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-amber-500 text-white text-sm font-semibold rounded-full">
                        {pendingSelectionCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {pendingSelectionCount}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                    <Clock className="w-4 h-4 mr-2 text-dungji-primary" />
                    <span className="text-sm font-medium">판매자 최종선택 대기중</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {waitingSellerCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-dungji-primary text-white text-sm font-semibold rounded-full">
                        {waitingSellerCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {waitingSellerCount}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-dungji-primary transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                    {purchaseInProgressCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-green-500 text-white text-sm font-semibold rounded-full">
                        {purchaseInProgressCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-gray-200 text-gray-500 text-sm rounded-full">
                        {purchaseInProgressCount}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 shrink-0 text-green-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                      {completedGroupBuysCount}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                      {cancelledGroupBuysCount}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-red-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <CancelledGroupBuys />
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          {/* 하단 버튼들 */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/mypage/consultations')}
              className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-3 py-1.5"
            >
              <FileText className="w-3 h-3" />
              상담내역 관리
            </Button>
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
      ) : (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-gray-300" />
        </div>
      )}


    </div>
  );
}
