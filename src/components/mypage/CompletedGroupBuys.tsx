'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CompletedGroupBuy {
  id: number;
  status: string;
  title: string;
  current_participants: number;
  max_participants: number;
  end_time: string;
  completed_at?: string;
  product_details: {
    id: number;
    name: string;
    base_price: number;
    image_url: string;
  };
  has_review?: boolean;
  creator?: {
    id: number;
    username: string;
  } | number;
}

/**
 * 종료된 공구 목록 컴포넌트
 * 참여했던 공구 중 종료된 공구를 표시하고 후기 작성 버튼을 제공
 */
export default function CompletedGroupBuys() {
  const router = useRouter();
  const { accessToken, user } = useAuth();
  const [groupBuys, setGroupBuys] = useState<CompletedGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompletedGroupBuys = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);
        // 구매 완료된 공구 목록 가져오기
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/purchase_completed/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error('종료된 공구 목록을 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setGroupBuys(data);
      } catch (err) {
        console.error('종료된 공구 목록 로딩 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedGroupBuys();
  }, [accessToken]);

  /**
   * 후기 작성 페이지로 이동
   */
  const handleWriteReview = (groupBuyId: number, productId: number) => {
    router.push(`/review/create?groupBuyId=${groupBuyId}&productId=${productId}`);
  };

  /**
   * 공구 상세 페이지로 이동
   */
  const handleViewDetail = (groupBuyId: number) => {
    router.push(`/groupbuys/${groupBuyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (groupBuys.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">종료된 공구가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{groupBuy.product_details.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>참여인원 {groupBuy.current_participants}/{groupBuy.max_participants}명</span>
                  <span>•</span>
                  <span>
                    {groupBuy.completed_at
                      ? formatDistanceToNow(new Date(groupBuy.completed_at), { addSuffix: true, locale: ko })
                      : formatDistanceToNow(new Date(groupBuy.end_time), { addSuffix: true, locale: ko })
                    } 종료
                  </span>
                </div>
              </div>
              {groupBuy.product_details.image_url && (
                <img
                  src={groupBuy.product_details.image_url}
                  alt={groupBuy.product_details.name}
                  className="w-20 h-20 object-cover rounded-md ml-4"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <Badge variant="secondary" className="bg-gray-100">
                공구종료
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetail(groupBuy.id)}
                >
                  공구보기
                </Button>
                {!groupBuy.has_review && (
                  (() => {
                    const creatorId = typeof groupBuy.creator === 'object' 
                      ? groupBuy.creator?.id 
                      : groupBuy.creator;
                    const isMyGroupBuy = user?.id === creatorId;
                    
                    if (isMyGroupBuy) {
                      return (
                        <div className="text-sm text-gray-500">
                          내가 만든 공구
                        </div>
                      );
                    }
                    
                    return (
                      <Button
                        size="sm"
                        onClick={() => handleWriteReview(groupBuy.id, groupBuy.product_details.id)}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        후기작성
                      </Button>
                    );
                  })()
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}