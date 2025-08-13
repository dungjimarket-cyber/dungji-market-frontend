'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, LogOut, User, Star, Ticket, CheckCircle2, Trophy } from 'lucide-react';
import Link from 'next/link';
import bidTokenService, { BidTokenResponse } from '@/lib/bid-token-service';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';

/**
 * 판매자 프로필 섹션
 */
export default function ProfileSection() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bidTokens, setBidTokens] = useState<BidTokenResponse | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 입찰권 정보와 판매자 프로필 정보를 동시에 가져오기
        const [tokenData, profileData] = await Promise.all([
          bidTokenService.getBidTokens(),
          getSellerProfile()
        ]);
        setBidTokens(tokenData);
        setSellerProfile(profileData);
      } catch (error) {
        console.error('데이터 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <>
      {/* 비대면 판매 인증 알림 */}
      {(sellerProfile?.remoteSalesVerified || sellerProfile?.remoteSalesStatus === 'approved') && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              ✅ 전국 배송 가능 - 비대면 판매 인증 완료
            </span>
          </div>
        </div>
      )}
      
      {/* 프로필 카드 */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full sm:w-auto">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden bg-gray-100">
                <User className="h-full w-full p-3 sm:p-4 text-gray-400" />
              </div>

              <div className="text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-1">
                  <h2 className="text-lg sm:text-xl font-bold">{user.username}</h2>
                  <Badge className="bg-blue-500">판매회원</Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-center text-gray-600 text-sm sm:text-base">
                  <span>평판 점수</span>
                  <div className="flex items-center sm:ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${
                          star <= 3
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-xs sm:text-sm">(3.0)</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start mt-2 text-xs sm:text-sm gap-2">
                  <Badge variant="outline">
                    본인인증 완료
                  </Badge>
                  <Badge variant="outline">사업자 인증</Badge>
                  {/* 비대면 판매 인증 뱃지 */}
                  {(sellerProfile?.remoteSalesVerified || sellerProfile?.remoteSalesStatus === 'approved') && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <Trophy className="h-3 w-3 mr-1" />
                      비대면 판매 인증
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
              <Link href="/mypage/seller/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 입찰권 정보 카드 */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h3 className="text-base sm:text-lg font-semibold mb-1">남은 입찰권</h3>
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <p className="text-xl sm:text-2xl font-bold">
                  {bidTokens?.unlimited_subscription
                    ? '무제한'
                    : `${bidTokens?.single_tokens || 0}개`}
                </p>
              </div>
              
              {bidTokens?.unlimited_subscription ? (
                <>
                  <p className="text-xs sm:text-sm text-blue-600">
                    무제한 구독권 사용중
                    {bidTokens.unlimited_expires_at && (
                      <span className="block sm:inline">
                        ({new Date(bidTokens.unlimited_expires_at).toLocaleDateString()} 만료)
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    *무제한 입찰권 이용시 보유한 입찰권은 소진되지 않습니다
                  </p>
                </>
              ) : bidTokens && bidTokens.single_tokens > 0 && (
                <p className="text-xs sm:text-sm text-green-600">
                  단품 입찰권 {bidTokens.single_tokens}개 (유효기간: 무기한)
                </p>
              )}
            </div>

            <Link href="/mypage/seller/bid-tokens" className="w-full sm:w-auto">
              <Button className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
                입찰권 관리
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}