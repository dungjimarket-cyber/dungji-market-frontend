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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Store, BarChart, History } from 'lucide-react';

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
        email: user?.email
      });
      
      if (isAuthenticated && user) {
        // 판매회원 여부 확인 (역할 정보 확인)
        const hasSellerRole = await tokenUtils.hasRole('seller');
        const isSellerByRole = user.role === 'seller';
        const hasSellerInRoles = Array.isArray(user.roles) && user.roles.includes('seller');
        
        // 역할 정보만으로 판매회원 확인
        const isSeller = isSellerByRole || hasSellerRole || hasSellerInRoles;
        
        console.log('판매회원 확인 결과:', {
          isSellerByRole,
          hasSellerRole,
          hasSellerInRoles,
          userRole: user.role,
          userRoles: user.roles,
          result: isSeller
        });
        
        // 역할 정보를 토대로만 판매회원 확인
        setIsSeller(isSeller);
        
        // 판매자인 경우 자동으로 판매자 페이지로 리디렉션
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
          
          {/* 사용자 역할에 따른 탭 메뉴 */}
          <Tabs defaultValue="participating">
            <TabsList className="flex flex-wrap">
              <TabsTrigger value="participating">참여중인 공구</TabsTrigger>
              
              {/* 판매자만 '입찰 관리'와 '정산 내역' 탭 표시 */}
              {isSeller && (
                <>
                  <TabsTrigger value="bids">
                    <Store className="w-4 h-4 mr-1" /> 입찰 관리
                  </TabsTrigger>
                  <TabsTrigger value="settlements">
                    <BarChart className="w-4 h-4 mr-1" /> 정산 내역
                  </TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="participating">
              <ParticipatingGroupBuys />
            </TabsContent>
            
            {/* 판매자만 표시 */}
            {isSeller && (
              <>
                <TabsContent value="bids">
                  <BidManagement />
                </TabsContent>
                
                <TabsContent value="settlements">
                  <SettlementHistory />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-12 w-12 animate-spin text-gray-300" />
        </div>
      )}
    </div>
  );
}
