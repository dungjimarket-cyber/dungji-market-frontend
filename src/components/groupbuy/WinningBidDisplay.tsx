'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, User, Clock, CheckCircle } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api/fetch';
import { formatNumberWithCommas } from '@/lib/utils';

interface WinningBidData {
  bid: {
    id: number;
    seller: {
      id: number;
      username: string;
      business_name?: string;
      profile_image?: string;
    };
    bid_type: 'price' | 'support';
    amount: number | string;
    message: string;
    created_at: string;
    vote_count: number;
  };
  total_votes: number;
  total_participants: number;
}

interface WinningBidDisplayProps {
  groupBuyId: number;
  status: string;
}

export function WinningBidDisplay({ groupBuyId, status }: WinningBidDisplayProps) {
  const [winningBid, setWinningBid] = useState<WinningBidData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinningBid = async () => {
      try {
        // 최고 견적 정보 가져오기
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/winning_bid/`
        );
        
        if (response.ok) {
          const data = await response.json();
          setWinningBid(data);
        }
      } catch (error) {
        console.error('Failed to fetch winning bid:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'seller_confirmation' || status === 'completed') {
      fetchWinningBid();
    } else {
      setLoading(false);
    }
  }, [groupBuyId, status]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">최고 견적 정보를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  if (!winningBid) {
    return null;
  }

  const { bid, total_votes, total_participants } = winningBid;
  const votePercentage = total_votes > 0 ? Math.round((bid.vote_count / total_votes) * 100) : 0;
  const participationRate = total_participants > 0 ? Math.round((total_votes / total_participants) * 100) : 0;

  return (
    <Card className="border-2 border-yellow-500 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <Trophy className="w-6 h-6" />
          최종 선정된 판매자
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 최고 견적 판매자 정보 */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            {bid.seller.profile_image ? (
              <img 
                src={bid.seller.profile_image} 
                alt={bid.seller.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {bid.seller.business_name || bid.seller.username}
            </h3>
            
            <div className="mt-2 space-y-1">
              <p className="text-2xl font-bold text-blue-600">
                {bid.bid_type === 'support' 
                  ? typeof bid.amount === 'string' 
                    ? `지원금 ${bid.amount}`
                    : `지원금 ${formatNumberWithCommas(bid.amount)}원`
                  : typeof bid.amount === 'string'
                    ? bid.amount
                    : `${formatNumberWithCommas(bid.amount)}원`
                }
              </p>
              
              {bid.message && (
                <p className="text-sm text-gray-600 italic">"{bid.message}"</p>
              )}
            </div>
          </div>
          
          <Badge className="bg-yellow-500 text-white">
            <Trophy className="w-3 h-3 mr-1" />
            최고 견적
          </Badge>
        </div>

        {/* 투표 결과 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg">
            <p className="text-gray-600">득표수</p>
            <p className="text-lg font-semibold">
              {bid.vote_count}표 ({votePercentage}%)
            </p>
          </div>
          <div className="bg-white p-3 rounded-lg">
            <p className="text-gray-600">투표 참여율</p>
            <p className="text-lg font-semibold">
              {total_votes}/{total_participants}명 ({participationRate}%)
            </p>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            선정일시: {new Date(bid.created_at).toLocaleString('ko-KR')}
          </div>
          
          {status === 'completed' ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-4 h-4 mr-1" />
              거래 완료
            </Badge>
          ) : (
            <Badge className="bg-blue-100 text-blue-800">
              판매자 확정 대기중
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}