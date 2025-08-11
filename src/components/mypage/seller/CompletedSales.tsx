'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GroupBuy } from '@/types/groupbuy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Calendar, Users } from 'lucide-react';
import Image from 'next/image';

/**
 * 판매완료 컴포넌트
 * 거래가 완전히 완료된 공구 목록
 */
export default function CompletedSales() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompleted = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_completed/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGroupBuys(data);
        }
      } catch (error) {
        console.error('판매완료 공구 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompleted();
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
        판매 완료된 공구가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 상품 이미지 */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
                  alt={groupBuy.product_details?.name || '상품'}
                  fill
                  className="object-cover rounded-md"
                />
              </div>

              {/* 공구 정보 */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {groupBuy.product_details?.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(groupBuy.completed_at || groupBuy.end_time).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    판매 {groupBuy.confirmed_buyers || 0}건
                  </span>
                  <span className="flex items-center gap-1 text-purple-600">
                    <CheckCircle2 className="h-4 w-4" />
                    판매완료
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">최종 낙찰지원금: </span>
                    <span className="font-semibold text-purple-600">
                      {groupBuy.winning_bid_amount?.toLocaleString() || 0}원
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/groupbuys/${groupBuy.id}`)}
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