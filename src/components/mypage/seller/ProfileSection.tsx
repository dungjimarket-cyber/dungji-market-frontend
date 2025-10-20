'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Ticket, CheckCircle2, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import bidTokenService, { BidTokenResponse } from '@/lib/bid-token-service';
import { getSellerProfile } from '@/lib/api/sellerService';
import { SellerProfile } from '@/types/seller';

/**
 * 판매자 프로필 섹션
 */
export default function ProfileSection() {
  const { user } = useAuth();
  const [bidTokens, setBidTokens] = useState<BidTokenResponse | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 견적이용권 정보와 판매자 프로필 정보를 동시에 가져오기
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
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {/* 첫 번째 줄: 닉네임 */}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logos/seller_img.png"
                    alt="판매회원"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                  <span className="text-sm text-gray-500 font-medium">닉네임</span>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {sellerProfile?.nickname || user.nickname || user.username}
                  </h2>
                </div>
              </div>
              
              {/* 두 번째 줄: 판매회원 뱃지 및 사업자인증 마크 */}
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-500 text-white">판매회원</Badge>
                <Badge 
                  variant="outline" 
                  className={sellerProfile?.businessVerified ? 'bg-green-50 text-green-700 border-green-300' : 'text-gray-500 border-gray-300'}
                >
                  {sellerProfile?.businessVerified ? '✓ 사업자인증' : '사업자 미인증'}
                </Badge>
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
        </CardContent>
      </Card>

      {/* 견적이용권 정보 카드 - 통신/렌탈 판매자만 표시 */}
      {(sellerProfile?.sellerCategory === 'telecom' || sellerProfile?.sellerCategory === 'rental') && (
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-auto">
                <h3 className="text-base sm:text-lg font-semibold mb-1">남은 견적이용권</h3>
                <div className="flex items-center gap-2 mb-1">
                  <Ticket className="h-4 w-4 text-blue-500" />
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
                      *무제한 구독권 이용시 보유한 견적이용권은 소진되지 않습니다
                    </p>
                  </>
                ) : bidTokens && bidTokens.single_tokens > 0 && (
                  <p className="text-xs sm:text-sm text-green-600">
                    단품 견적이용권 {bidTokens.single_tokens}개 (유효기간: 무기한)
                  </p>
                )}
              </div>

              <Link href="/mypage/seller/bid-tokens" className="w-full sm:w-auto">
                <Button className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto">
                  견적이용권(지원금서비스 전용)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}