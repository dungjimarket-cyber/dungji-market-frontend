'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Clock } from 'lucide-react';
import { tokenUtils } from '@/lib/tokenUtils';
import { toast } from '@/components/ui/use-toast';
import { CountdownTimer } from '@/components/ui/CountdownTimer';

interface FinalSelectionGroupBuy {
  id: number;
  product_name: string;
  product_category: string;
  bid_amount: number;
  participants_count: number;
  voting_end: string;
  final_decision: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export default function SellerFinalSelection() {
  const router = useRouter();
  const [groupbuys, setGroupbuys] = useState<FinalSelectionGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinalSelectionGroupBuys = async () => {
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login?callbackUrl=/mypage/seller/final-selection');
          return;
        }

        // 최종선택 대기중인 공구 목록 조회
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // final_selection 상태인 입찰만 필터링
          const finalSelectionBids = data.filter((bid: any) => 
            bid.groupbuy_status === 'final_selection' && 
            bid.is_selected === true
          );
          setGroupbuys(finalSelectionBids.map((bid: any) => ({
            id: bid.groupbuy,
            product_name: bid.groupbuy_product_name || bid.product_name || '상품명',
            product_category: bid.product_category || '카테고리',
            bid_amount: bid.amount,
            participants_count: bid.participants_count || 0,
            voting_end: bid.voting_end || bid.groupbuy_voting_end,
            final_decision: bid.final_decision || 'pending',
            created_at: bid.created_at
          })));
        } else {
          throw new Error('데이터 조회 실패');
        }
      } catch (error) {
        console.error('최종선택 대기 목록 조회 오류:', error);
        toast({
          variant: 'destructive',
          title: '조회 실패',
          description: '최종선택 대기 목록을 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFinalSelectionGroupBuys();
  }, [router]);

  const handleGroupBuyClick = (groupBuyId: number) => {
    router.push(`/groupbuys/${groupBuyId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/mypage/seller')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold">최종선택 대기중</h1>
      </div>

      {groupbuys.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">최종선택 대기중인 공구가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupbuys.map((groupbuy) => (
            <Card 
              key={groupbuy.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleGroupBuyClick(groupbuy.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{groupbuy.product_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{groupbuy.product_category}</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    최종선택 대기중
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">낙찰 금액</p>
                    <p className="font-bold">{groupbuy.bid_amount.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">참여자 수</p>
                    <p className="font-bold">{groupbuy.participants_count}명</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">최종선택 마감시간</span>
                  </div>
                  <CountdownTimer
                    endTime={groupbuy.voting_end}
                    format="full"
                    urgent={180}
                  />
                  <p className="text-xs text-amber-600 mt-2">
                    공구 진입 후 판매확정/판매포기를 선택해주세요.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}