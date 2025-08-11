'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Clock, AlertTriangle, Info } from 'lucide-react';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatNumberWithCommas } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WaitingSellerGroupBuy {
  id: number;
  title: string;
  product_name: string;
  winning_bid_amount: number;
  seller_selection_end: string;
  created_at: string;
  buyer_decision: 'confirmed' | 'cancelled' | 'pending';
  buyer_decision_at?: string;
  confirmed_participants: number;
  total_participants: number;
}

export default function WaitingSellerDecisionGroupBuys() {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuth();
  const [groupBuys, setGroupBuys] = useState<WaitingSellerGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupBuys = async () => {
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }

      try {
        // 판매자 최종선택 대기중인 공구 조회
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/waiting_seller_decision/`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGroupBuys(data);
        } else if (response.status === 404) {
          // API가 아직 없는 경우
          setGroupBuys([]);
        } else {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('판매자 최종선택 대기중 공구 조회 오류:', error);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupBuys();
  }, [isAuthenticated, accessToken]);

  const handleGroupBuyClick = (groupBuyId: number) => {
    router.push(`/groupbuys/${groupBuyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (groupBuys.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">판매자 최종선택을 기다리는 공구가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupBuys.map((groupBuy) => (
        <Card 
          key={groupBuy.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleGroupBuyClick(groupBuy.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{groupBuy.product_name}</p>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                판매자 대기중
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">최종 낙찰지원금</p>
                <p className="font-bold">{formatNumberWithCommas(groupBuy.winning_bid_amount)}원</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">구매확정 인원</p>
                <p className="font-bold">
                  {groupBuy.confirmed_participants}/{groupBuy.total_participants}명
                </p>
              </div>
            </div>

            {/* 내 결정 상태 */}
            {groupBuy.buyer_decision === 'confirmed' && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-medium">
                  ✓ 구매확정 완료
                </p>
                {groupBuy.buyer_decision_at && (
                  <p className="text-xs text-green-600 mt-1">
                    {new Date(groupBuy.buyer_decision_at).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>
            )}

            {/* 판매자 선택 마감시간 */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  판매자 최종선택 마감시간
                </span>
              </div>
              <CountdownTimer
                endTime={groupBuy.seller_selection_end}
                format="full"
                urgent={60} // 1시간 미만일 때 urgent
              />
              <p className="text-xs text-purple-600 mt-2">
                판매자가 판매확정/포기를 결정하는 중입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}