'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProfileSection from '@/components/mypage/ProfileSection';
import ParticipatingGroupBuys from '@/components/mypage/ParticipatingGroupBuys';
import CreatedGroupBuys from '@/components/mypage/CreatedGroupBuys';
import BidManagement from '@/components/mypage/BidManagement';
import SettlementHistory from '@/components/mypage/SettlementHistory';
import PendingSelectionGroupBuys from '@/components/mypage/PendingSelectionGroupBuys';
import { ConsentNotification } from '@/components/notification/ConsentNotification';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Store, BarChart, Package, ShoppingBag, ChevronRight, PlusCircle } from 'lucide-react';

/**
 * 마이페이지 클라이언트 컴포넌트
 * 사용자 역할에 따라 다른 UI를 보여줍니다.
 * - 일반 사용자: 참여 중인 공구, 내가 만든 공구, 주문 내역
 * - 판매회원(셀러): 참여 중인 공구, 입찰 관리, 정산 내역
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
  const [sellerActivityCount, setSellerActivityCount] = useState(0);
  const [purchaseInProgressCount, setPurchaseInProgressCount] = useState(0);
  const [createdGroupBuysCount, setCreatedGroupBuysCount] = useState(0);

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
    
    // 최종 선택 대기중인 상품 개수 가져오기 (API 가정)
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
          setPendingSelectionCount(data.length);
        }
      } catch (error) {
        console.error('최종 선택 대기중 개수 조회 오류:', error);
        // API가 아직 없다면 임시값 설정
        setPendingSelectionCount(0);
      }
    };
    
    // 판매자 활동 개수 가져오기 (판매자만 실행)
    const fetchSellerActivityCount = async () => {
      if (!isAuthenticated || !accessToken || !isSeller) return;
      
      try {
        // 입찰 관리에서 데이터 개수 가져오기
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/bids/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSellerActivityCount(data.length);
        }
      } catch (error) {
        console.error('판매자 활동 개수 조회 오류:', error);
        // API가 아직 없다면 임시값 설정
        setSellerActivityCount(0);
      }
    };
    
    // 구매 진행중인 상품 개수 가져오기 (판매자만 실행)
    const fetchPurchaseInProgressCount = async () => {
      if (!isAuthenticated || !accessToken || !isSeller) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/settlements/`, {
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
        // API가 아직 없다면 임시값 설정
        setPurchaseInProgressCount(0);
      }
    };
    
    // 내가 만든 공구 개수 가져오기
    const fetchCreatedGroupBuysCount = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/my_groupbuys/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCreatedGroupBuysCount(data.length);
        }
      } catch (error) {
        console.error('내가 만든 공구 개수 조회 오류:', error);
        setCreatedGroupBuysCount(0);
      }
    };
    
    if (isAuthenticated && accessToken) {
      fetchParticipatingCount();
      fetchPendingSelectionCount();
      fetchCreatedGroupBuysCount();
      
      if (isSeller) {
        fetchSellerActivityCount();
        fetchPurchaseInProgressCount();
      }
    }
  }, [isAuthenticated, accessToken, isSeller]);
  
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">마이페이지</h1>
      
            {user ? (
        <div className="space-y-6">
          <ProfileSection />
          
          {/* 동의 알림 표시 */}
          <ConsentNotification />
          
          {/* 아코디언 스타일 메뉴 */}
          <Accordion type="single" collapsible className="w-full">
            {/* 참여중인 공구 */}
            <AccordionItem value="participating">
              <AccordionTrigger className="py-4 bg-gray-50 px-4 rounded-lg hover:bg-gray-100 group transition-all">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="font-medium">참여중인 공구</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <span className="mr-1 text-sm">{participatingCount}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-blue-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <ParticipatingGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 최종 선택 대기중 */}
            <AccordionItem value="pending">
              <AccordionTrigger className="py-4 bg-gray-50 px-4 rounded-lg hover:bg-gray-100 group transition-all mt-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 text-amber-500" />
                    <span className="font-medium">최종 선택 대기중</span>
                  </div>
                  <div className="flex items-center text-amber-600">
                    <span className="mr-1 text-sm">{pendingSelectionCount}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <PendingSelectionGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 내가 만든 공구 */}
            <AccordionItem value="created">
              <AccordionTrigger className="py-4 bg-gray-50 px-4 rounded-lg hover:bg-gray-100 group transition-all mt-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <PlusCircle className="w-5 h-5 mr-2 text-purple-500" />
                    <span className="font-medium">내가 만든 공구</span>
                  </div>
                  <div className="flex items-center text-purple-600">
                    <span className="mr-1 text-sm">{createdGroupBuysCount}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-purple-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <CreatedGroupBuys />
              </AccordionContent>
            </AccordionItem>

            {/* 판매자 활동 (판매자만 표시) */}
            {isSeller && (
              <>
                <AccordionItem value="bids">
                  <AccordionTrigger className="py-4 bg-gray-50 px-4 rounded-lg hover:bg-gray-100 group transition-all mt-3">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Store className="w-5 h-5 mr-2 text-green-500" />
                        <span className="font-medium">판매자 활동 대기중</span>
                      </div>
                      <div className="flex items-center text-green-600">
                        <span className="mr-1 text-sm">{sellerActivityCount}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-green-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <BidManagement />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="settlements">
                  <AccordionTrigger className="py-4 bg-gray-50 px-4 rounded-lg hover:bg-gray-100 group transition-all mt-3">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <BarChart className="w-5 h-5 mr-2 text-purple-500" />
                        <span className="font-medium">구매 진행중</span>
                      </div>
                      <div className="flex items-center text-purple-600">
                        <span className="mr-1 text-sm">{purchaseInProgressCount}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-purple-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <SettlementHistory />
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
          </Accordion>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-gray-300" />
        </div>
      )}
    </div>
  );
}
