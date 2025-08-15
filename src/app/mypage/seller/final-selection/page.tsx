'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{groupbuy.product_name}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{groupbuy.product_category}</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 self-start sm:self-auto whitespace-nowrap">
                    최종선택 대기중
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">최종 선정 지원금</p>
                    <p className="font-bold text-base sm:text-lg text-orange-600">{groupbuy.bid_amount.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">참여자 수</p>
                    <p className="font-bold text-base sm:text-lg">{groupbuy.participants_count}명</p>
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

      {/* 구매확정 인원 통계 모달 - 상세페이지와 동일한 디자인 적용 */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">구매자 확정 현황</DialogTitle>
          </DialogHeader>
          
          {loadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : confirmationStats ? (
            <div className="py-4">
              {/* 메인 통계 카드 */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border border-blue-200 shadow-sm">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-1">전체 참여인원</p>
                  <p className="text-3xl font-bold text-blue-700">{confirmationStats.total_participants}명</p>
                </div>
                
                {/* 확정/포기 통계 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-lg p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">구매확정</p>
                    <p className="text-2xl font-bold text-green-600">{confirmationStats.confirmed_count}명</p>
                    <p className="text-xs text-gray-500 mt-1">({confirmationStats.confirmation_rate}%)</p>
                  </div>
                  
                  <div className="bg-white/80 rounded-lg p-4 text-center">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">구매포기</p>
                    <p className="text-2xl font-bold text-red-600">{confirmationStats.cancelled_count}명</p>
                    <p className="text-xs text-gray-500 mt-1">({100 - confirmationStats.confirmation_rate}%)</p>
                  </div>
                </div>
              </div>

              {/* 확정률 진행바 섹션 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">구매 확정률</span>
                  <span className={`text-lg font-bold ${
                    confirmationStats.confirmation_rate > 50 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {confirmationStats.confirmation_rate}%
                  </span>
                </div>
                
                {/* 진행바 */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${
                        confirmationStats.confirmation_rate > 50 
                          ? 'bg-gradient-to-r from-green-400 to-green-500' 
                          : 'bg-gradient-to-r from-orange-400 to-orange-500'
                      }`}
                      style={{ width: `${confirmationStats.confirmation_rate}%` }}
                    />
                  </div>
                  
                  {/* 50% 기준선 표시 */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-4 w-0.5 bg-gray-400" />
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                    <span className="text-xs text-gray-500">50%</span>
                  </div>
                </div>
                
                {/* 패널티 안내 메시지 */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                  {confirmationStats.confirmation_rate <= 50 ? (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-orange-700">
                        확정률이 50% 이하입니다. 판매포기시 패널티가 부과되지 않습니다.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-green-700">
                        확정률이 50% 초과했습니다. 판매포기시 패널티가 부과됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
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