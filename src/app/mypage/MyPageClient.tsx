'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { tokenUtils } from '@/lib/tokenUtils';
import ProfileSection from '@/components/mypage/ProfileSection';
import ParticipatingGroupBuys from '@/components/mypage/ParticipatingGroupBuys';
import CreatedGroupBuys from '@/components/mypage/CreatedGroupBuys';
import BidManagement from '@/components/mypage/BidManagement';
import SettlementHistory from '@/components/mypage/SettlementHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, Store, BarChart, History, Package, ShoppingBag, ChevronRight } from 'lucide-react';

/**
 * 마이페이지 클라이언트 컴포넌트
 * 사용자 역할에 따라 다른 UI를 보여줍니다.
 * - 일반 사용자: 참여 중인 공구, 내가 만든 공구, 주문 내역
 * - 판매회원(셀러): 참여 중인 공구, 입찰 관리, 정산 내역
 */
export default function MyPageClient() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

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
                    <span className="mr-1 text-sm">3</span>
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
                    <span className="mr-1 text-sm">2</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-gray-500 text-center">최종 선택 대기중인 상품이 표시됩니다.</p>
                  </CardContent>
                </Card>
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
                        <span className="mr-1 text-sm">1</span>
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
                        <span className="mr-1 text-sm">1</span>
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
