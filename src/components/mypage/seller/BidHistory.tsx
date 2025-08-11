'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, TrendingUp, Calendar } from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';

interface Bid {
  id: number;
  groupbuy: number;
  product_name: string;
  amount: number;
  status: string;
  bid_type: string;
  created_at: string;
  final_decision?: string;
}

/**
 * 입찰내역 컴포넌트
 * 판매자가 입찰한 최근 5개 공구를 간략하게 표시
 */
export default function BidHistory() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBidHistory = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/bids/seller/`,
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
          setBids(data.slice(0, 5));
        }
      } catch (error) {
        console.error('입찰내역 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [accessToken]);

  const getStatusBadge = (status: string, finalDecision?: string) => {
    if (status === 'selected' && finalDecision === 'pending') {
      return <Badge className="bg-orange-100 text-orange-700">최종선택 대기</Badge>;
    } else if (status === 'selected' && finalDecision === 'confirmed') {
      return <Badge className="bg-green-100 text-green-700">판매확정</Badge>;
    } else if (status === 'selected' && finalDecision === 'cancelled') {
      return <Badge className="bg-red-100 text-red-700">판매포기</Badge>;
    } else if (status === 'selected') {
      return <Badge className="bg-yellow-100 text-yellow-700">낙찰</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-blue-100 text-blue-700">입찰중</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-gray-100 text-gray-700">미선정</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">아직 입찰한 공구가 없습니다.</p>
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
      {bids.map((bid) => (
        <Card 
          key={bid.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push(`/groupbuys/${bid.groupbuy}`)}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="font-medium text-sm sm:text-base truncate">
                    {bid.product_name}
                  </h3>
                  {getStatusBadge(bid.status, bid.final_decision)}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className="hidden sm:inline">{new Date(bid.created_at).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(bid.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                  </span>
                  <span className="font-medium text-green-600">
                    입찰금액: {formatNumberWithCommas(bid.amount)}원
                  </span>
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
          전체 입찰내역 보기
        </Button>
      </div>
    </div>
  );
}