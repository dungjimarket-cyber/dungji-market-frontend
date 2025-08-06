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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users } from 'lucide-react';

interface FinalSelectionGroupBuy {
  id: number;
  product_name: string;
  product_category: string;
  bid_amount: number;
  participants_count: number;
  final_selection_end: string;
  final_decision: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

interface BuyerConfirmationStats {
  total_participants: number;
  confirmed_count: number;
  cancelled_count: number;
  pending_count: number;
  confirmation_rate: number;
  has_penalty_exemption: boolean;
}

export default function SellerFinalSelection() {
  const router = useRouter();
  const [groupbuys, setGroupbuys] = useState<FinalSelectionGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedGroupBuyId, setSelectedGroupBuyId] = useState<number | null>(null);
  const [confirmationStats, setConfirmationStats] = useState<BuyerConfirmationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchFinalSelectionGroupBuys = async () => {
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login?callbackUrl=/mypage/seller/final-selection');
          return;
        }

        // 최종선택 대기중인 공구 목록 조회 (전용 API 사용)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/final-selection/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // 최종선택 기간이 아직 지나지 않은 공구만 필터링
          const activeGroupbuys = data
            .filter((bid: any) => {
              if (!bid.final_selection_end) return false;
              const now = new Date();
              const selectionEnd = new Date(bid.final_selection_end);
              // 최종선택 기간이 지나지 않고, 아직 결정하지 않은 경우만
              return selectionEnd > now && (!bid.final_decision || bid.final_decision === 'pending');
            })
            .map((bid: any) => ({
              id: bid.groupbuy,
              product_name: bid.groupbuy_product_name || bid.product_name || '상품명',
              product_category: bid.product_category || '카테고리',
              bid_amount: bid.amount,
              participants_count: bid.participants_count || 0,
              final_selection_end: bid.final_selection_end,
              final_decision: bid.final_decision || 'pending',
              created_at: bid.created_at
            }));
          setGroupbuys(activeGroupbuys);
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

  const fetchConfirmationStats = async (groupBuyId: number) => {
    try {
      setLoadingStats(true);
      const token = await tokenUtils.getAccessToken();
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/buyer-confirmation-stats/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfirmationStats(data);
      } else {
        toast({
          title: '오류',
          description: '구매확정 인원 정보를 불러오는데 실패했습니다.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching confirmation stats:', error);
      toast({
        title: '오류',
        description: '구매확정 인원 정보를 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleShowStats = async (e: React.MouseEvent, groupBuyId: number) => {
    e.stopPropagation();
    setSelectedGroupBuyId(groupBuyId);
    setShowStatsModal(true);
    await fetchConfirmationStats(groupBuyId);
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

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => handleShowStats(e, groupbuy.id)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    구매확정 인원 보기
                  </Button>
                  
                  <div className="bg-amber-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">최종선택 마감시간</span>
                    </div>
                    <CountdownTimer
                      endTime={groupbuy.final_selection_end}
                      format="full"
                      urgent={180}
                    />
                    <p className="text-xs text-amber-600 mt-2">
                      공구 진입 후 판매확정/판매포기를 선택해주세요.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 구매확정 인원 통계 모달 */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>구매확정 인원 현황</DialogTitle>
          </DialogHeader>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : confirmationStats ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">전체 참여인원</span>
                  <span className="font-bold">{confirmationStats.total_participants}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600">구매확정</span>
                  <span className="font-bold text-green-600">{confirmationStats.confirmed_count}명</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-600">구매포기</span>
                  <span className="font-bold text-red-600">{confirmationStats.cancelled_count}명</span>
                </div>
                {confirmationStats.pending_count > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">미결정</span>
                    <span className="font-bold text-gray-500">{confirmationStats.pending_count}명</span>
                  </div>
                )}
              </div>
              
              <div className={`p-4 rounded-lg ${
                confirmationStats.confirmation_rate <= 50 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">구매확정률</p>
                  <p className="text-2xl font-bold ${
                    confirmationStats.confirmation_rate <= 50 ? 'text-blue-600' : 'text-green-600'
                  }">
                    {confirmationStats.confirmation_rate}%
                  </p>
                </div>
                
                {confirmationStats.has_penalty_exemption && (
                  <div className="mt-3 p-2 bg-white rounded">
                    <p className="text-xs text-blue-600 text-center">
                      구매확정률이 50% 이하이므로 판매포기 시<br/>
                      패널티 없이 해당 공구 입찰권이 환불됩니다.
                    </p>
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => setShowStatsModal(false)}
              >
                확인
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              데이터를 불러올 수 없습니다.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}