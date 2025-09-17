'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GroupBuy } from '@/types/groupbuy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { CountdownTimer } from '@/components/ui/CountdownTimer';

/**
 * 구매자 최종선택 대기중 컴포넌트
 * 낙찰되었지만 구매자들이 아직 최종선택 중인 공구
 */
export default function WaitingBuyerSelection() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaitingBuyer = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_waiting_buyer/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGroupBuys(Array.isArray(data) ? data : (data.results || []));
        }
      } catch (error) {
        console.error('구매자 대기중 공구 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaitingBuyer();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (groupBuys.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        구매자 최종선택을 기다리는 공구가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 상품 이미지와 버튼 영역 */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* 상품 이미지 */}
                <div className="relative w-24 h-24">
                  <Image
                    src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
                    alt={groupBuy.product_details?.name || '상품'}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                {/* 모바일에서 상세보기 버튼을 이미지 아래에 표시 */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/groupbuys/${groupBuy.id}`)}
                  className="sm:hidden w-24"
                >
                  상세보기
                </Button>
              </div>

              {/* 공구 정보 */}
              <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-lg mb-1">
                  {groupBuy.product_details?.name}
                </h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    참여자 {groupBuy.current_participants}명
                  </span>
                  <span className="text-yellow-600 font-medium">
                    구매자 선택 진행중
                  </span>
                </div>

                {/* 남은 시간 표시 */}
                {groupBuy.final_selection_end && (
                  <div className="mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">구매자 선택 마감: </span>
                    <CountdownTimer
                      endTime={groupBuy.final_selection_end}
                      format="compact"
                      className="inline-block text-yellow-600 font-medium text-xs sm:text-sm"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">최종 선정 지원금: </span>
                    <span className="font-semibold text-green-600 text-sm sm:text-base">
                      {(groupBuy.winning_bid_amount || 0).toLocaleString()}원
                    </span>
                  </div>
                  
                  {/* PC에서만 여기에 버튼 표시 */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/groupbuys/${groupBuy.id}`)}
                    className="hidden sm:block"
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}