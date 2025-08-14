'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';

interface GroupBuyWithBid {
  id: number;
  title: string;
  product_details?: {
    name: string;
    image_url?: string;
  };
  my_bid_amount: number;
  bid_status: string;
  is_selected: boolean;
  created_at: string;
  bid_created_at?: string;
  status: string;
  display_status?: string;  // 백엔드에서 계산된 표시 상태
  my_bid_rank?: number;     // 내 견적 순위
  total_bidders?: number;   // 전체 견적자 수
}

/**
 * 견적내역 컴포넌트
 * 판매자가 견적을 제안한 최근 5개 공구를 간략하게 표시
 */
export default function BidHistory() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [groupBuys, setGroupBuys] = useState<GroupBuyWithBid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBidHistory = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_bids/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // 최근 5개만 표시
          setGroupBuys(data.slice(0, 5));
        }
      } catch (error) {
        console.error('견적내역 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (groupBuys.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">아직 견적을 제안한 공구가 없습니다.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/group-purchases')}
          >
            공구 둘러보기
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groupBuys.map((gb) => (
        <Card 
          key={gb.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/groupbuys/${gb.id}`)}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base truncate mb-2">
                  {gb.product_details?.name || gb.title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="hidden sm:inline">{new Date(gb.bid_created_at || gb.created_at).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(gb.bid_created_at || gb.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                  </span>
                  <span className="font-medium text-green-600">
                    견적금액: {formatNumberWithCommas(gb.my_bid_amount)}원
                  </span>
                  {/* 순위 정보 표시 */}
                  {gb.my_bid_rank && gb.display_status === '낙찰실패' && (
                    <span className="text-xs text-gray-500">
                      ({gb.my_bid_rank}위/{gb.total_bidders}명)
                    </span>
                  )}
                </div>
              </div>
              
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* 전체보기 버튼 */}
      <div className="text-center pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/mypage/seller/bids')}
          className="w-full"
        >
          전체 견적내역 보기
        </Button>
      </div>
    </div>
  );
}