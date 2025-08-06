'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, LogOut, User, Star, Ticket } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import bidTokenService, { BidTokenResponse } from '@/lib/bid-token-service';

/**
 * 판매자 프로필 섹션
 */
export default function ProfileSection() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bidTokens, setBidTokens] = useState<BidTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBidTokens = async () => {
      try {
        const data = await bidTokenService.getBidTokens();
        setBidTokens(data);
      } catch (error) {
        console.error('입찰권 정보 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidTokens();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  return (
    <>
      {/* 프로필 카드 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                {user.profile_image ? (
                  <Image
                    src={user.profile_image}
                    alt={user.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="h-full w-full p-4 text-gray-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <Badge className="bg-blue-500">판매회원</Badge>
                </div>

                <div className="flex items-center text-gray-600">
                  <span>평판 점수</span>
                  <div className="flex items-center ml-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(user.rating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm">({user.rating || 0})</span>
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
        </CardContent>
      </Card>

      {/* 입찰권 정보 카드 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-1">남은 입찰권</h3>
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">
                  {bidTokens?.unlimited_subscription
                    ? '무제한'
                    : `${bidTokens?.single_tokens || 0}개`}
                </p>
              </div>
              
              {bidTokens?.unlimited_subscription ? (
                <>
                  <p className="text-sm text-blue-600">
                    무제한 구독권 사용중
                    {bidTokens.unlimited_expires_at && (
                      <> ({new Date(bidTokens.unlimited_expires_at).toLocaleDateString()} 만료)</>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    *무제한 입찰권 이용시 보유한 입찰권은 소진되지 않습니다
                  </p>
                </>
              ) : bidTokens && bidTokens.single_tokens > 0 && (
                <p className="text-sm text-green-600">
                  단품 입찰권 {bidTokens.single_tokens}개 (유효기간: 무기한)
                </p>
              )}
            </div>

            <Link href="/bid-tickets">
              <Button className="bg-blue-500 hover:bg-blue-600">
                입찰권 구매하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}