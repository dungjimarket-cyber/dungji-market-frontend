'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, CheckCircle, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  product_info?: {
    id: number;
    name: string;
    base_price: number;
    image_url: string;
  };
  product?: {
    id: number;
    name: string;
    base_price: number;
    image_url?: string;
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
        setGroupBuys(Array.isArray(data) ? data : (data.results || []));
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
      {groupBuys.map((groupBuy) => {
        const productImage = groupBuy.product_info?.image_url || groupBuy.product_details?.image_url || groupBuy.product?.image_url || '/placeholder-product.jpg';
        const productName = groupBuy.product_info?.name || groupBuy.product_details?.name || groupBuy.product?.name || '상품';
        const completedDate = groupBuy.completed_at || groupBuy.end_time;

        return (
          <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* 상품 이미지 */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>

                {/* 공구 정보 */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {productName}
                  </h3>

                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 flex-wrap">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                      종료일: {new Date(completedDate).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="whitespace-nowrap">
                      참여인원 {groupBuy.current_participants}/{groupBuy.max_participants}명
                    </span>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetail(groupBuy.id)}
                    >
                      공구보기
                    </Button>
                    {groupBuy.has_review ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 px-3 py-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        후기작성 완료
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleWriteReview(groupBuy.id, groupBuy.product_details.id)}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        후기작성
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}