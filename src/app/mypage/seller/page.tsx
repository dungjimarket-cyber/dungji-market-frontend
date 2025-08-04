'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  ShoppingBag,
  Clock,
  CheckCircle,
  CreditCard,
  Package,
  BadgeCheck,
  User,
  Settings,
  LogOut,
  Ticket,
  XCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { tokenUtils } from '@/lib/tokenUtils';
import bidTokenService, { BidTokenResponse } from '@/lib/bid-token-service';

/**
 * 판매자 마이페이지 컴포넌트
 */
export default function SellerMyPage() {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [bidTokens, setBidTokens] = useState<BidTokenResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cancelledCount, setCancelledCount] = useState(0);
  const { logout } = useAuth();
  const router = useRouter();
  
  // 로그아웃 처리 함수
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    // 로그인 여부 확인
    const checkAuth = async () => {
      const token = await tokenUtils.getAccessToken();
      setIsLoggedIn(!!token);
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 병렬로 모든 데이터 가져오기
        const [profileData, tokenData, cancelledResponse] = await Promise.all([
          getSellerProfile(),
          bidTokenService.getBidTokens(),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/cancelled_groupbuys/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);
        
        setProfile(profileData);
        setBidTokens(tokenData);
        
        // 취소된 공구 개수 설정
        if (cancelledResponse.ok) {
          const cancelledData = await cancelledResponse.json();
          setCancelledCount(cancelledData.length);
        }
        
        // 프로필 데이터에 입찰권 정보 통합
        if (profileData && tokenData) {
          setProfile({
            ...profileData,
            remainingBids: tokenData.single_tokens,
            hasUnlimitedBids: tokenData.unlimited_subscription,
            unlimited_expires_at: tokenData.unlimited_expires_at
          });
        }
      } catch (error) {
        console.error('데이터 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">판매자 마이페이지</h1>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="flex items-center text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-1" />
            로그아웃
          </Button>
          <Link href="/mypage/seller/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {profile ? (
        <>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                  {profile.profileImage ? (
                    <Image
                      src={profile.profileImage}
                      alt={profile.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <User className="h-full w-full p-4 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    {profile.isVip && (
                      <Badge className="bg-blue-500">VIP회원</Badge>
                    )}
                  </div>

                  <div className="flex items-center text-gray-600">
                    <span>나의 평판 점수</span>
                    <div className="flex items-center ml-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(profile.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-sm">({profile.rating})</span>
                    </div>
                  </div>

                  <div className="flex mt-2 text-sm">
                    <Badge variant="outline" className="mr-2">
                      본인인증 완료
                    </Badge>
                    <Badge variant="outline">사업자 인증</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-xl font-bold mb-4">판매 활동</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="입찰내역"
              count={profile.activeBids}
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              href="/mypage/seller/bids"
            />
            <SummaryCard
              title="최종선택 대기중"
              count={profile.pendingSelection}
              icon={<Star className="h-5 w-5 text-yellow-500" />}
              href="/mypage/seller/final-selection"
            />
            <SummaryCard
              title="판매확정"
              count={profile.confirmedSales || profile.pendingSales || 0}
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              href="/mypage/seller/sales-confirmed"
            />
            <SummaryCard
              title="판매완료"
              count={profile.completedSales}
              icon={<ShoppingBag className="h-5 w-5 text-purple-500" />}
              href="/mypage/seller/sales?filter=completed"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="취소된 공구"
              count={cancelledCount}
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              href="/mypage/seller/cancelled"
            />
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold mb-1">남은 입찰권</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket className="h-5 w-5 text-blue-500" />
                    <p className="text-2xl font-bold">
                      {profile.hasUnlimitedBids || (bidTokens && bidTokens.unlimited_subscription)
                        ? '무제한'
                        : `${profile.remainingBids}개`}
                    </p>
                  </div>
                  
                  {(profile.hasUnlimitedBids || (bidTokens && bidTokens.unlimited_subscription)) ? (
                    <p className="text-sm text-blue-600">
                      *무제한 입찰권 이용시 보유한 입찰권은 소진되지 않습니다
                    </p>
                  ) : profile.remainingBids > 0 && (
                    <p className="text-sm text-green-600">
                      단품 입찰권 {profile.remainingBids}개 (유효기간: 무기한)
                    </p>
                  )}
                  
                  {profile.hasUnlimitedBids && profile.unlimited_expires_at && (
                    <p className="text-sm text-blue-600">
                      무제한 구독권 사용중 (
                      {new Date(profile.unlimited_expires_at).toLocaleDateString()} 만료)
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    *무제한 입찰권 이용시 보유한 입찰권은 소진되지 않습니다
                  </p>
                </div>

                <Link href="/mypage/seller/bid-tokens">
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    입찰권 살펴보기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Link href="/mypage/seller/bid-tokens" className="w-full max-w-md">
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                입찰권 구매하기
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <h3 className="text-xl font-semibold">판매자 정보를 찾을 수 없습니다</h3>
          <p className="text-gray-500 mt-2">
            판매자 계정으로 로그인하시거나 판매자 등록을 해주세요
          </p>
          <Button className="mt-4">판매자 등록하기</Button>
        </div>
      )}
    </div>
  );
}

/**
 * 요약 카드 컴포넌트
 */
interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}

function SummaryCard({ title, count, icon, href }: SummaryCardProps) {
  return (
    <Link href={href}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="mb-2">{icon}</div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{count}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * 프로필 로딩 스켈레톤
 */
function ProfileSkeleton() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-32 w-full mb-6" />
      <Skeleton className="h-12 w-full max-w-md mx-auto" />
    </div>
  );
}
