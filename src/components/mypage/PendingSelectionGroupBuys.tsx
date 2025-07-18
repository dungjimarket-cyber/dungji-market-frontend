'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  base_price: number;
  image_url?: string;
  carrier?: string;
  registration_type?: string;
  plan_info?: string;
}

interface Bid {
  id: number;
  seller_name: string;
  bid_price: number;
  shipping_cost: number;
  total_price: number;
  selected?: boolean;
  rejected?: boolean;
}

interface GroupBuy {
  id: number;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  end_time: string;
  product_details: Product;
  bids?: Bid[];
  final_selection_deadline?: string;
  is_leader?: boolean;
}

/**
 * 최종 선택 대기중인 공구 목록 컴포넌트
 * 입찰이 완료되고 리더가 최종 판매자를 선택해야 하는 상태의 공구들을 표시
 */
export default function PendingSelectionGroupBuys() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);

  // 인증 로딩 상태일 때는 로딩 표시
  if (isLoading) return <p className="text-gray-500">로딩 중...</p>;

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <p className="text-gray-500">로그인이 필요합니다.</p>;
  }

  // 데이터 로딩
  useEffect(() => {
    const fetchPendingSelectionGroupBuys = async () => {
      if (!accessToken) return;
      
      try {
        setLoading(true);
        // API 엔드포인트는 백엔드 구현에 따라 조정 필요
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/pending_selection/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          // 404 에러는 단순히 데이터가 없는 것으로 처리
          if (response.status === 404) {
            setGroupBuys([]);
            return;
          }
          throw new Error('최종 선택 대기중인 공구 목록을 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        setGroupBuys(data);
      } catch (err) {
        console.error('최종 선택 대기중인 공구 목록 조회 오류:', err);
        // 실제 API가 없을 수 있으므로 에러를 표시하지 않고 빈 목록으로 처리
        setGroupBuys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingSelectionGroupBuys();
  }, [accessToken]);

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  
  if (groupBuys.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">최종 선택 대기중인 공구가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              입찰이 완료되고 판매자 선택을 기다리는 공구가 있으면 여기에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 남은 시간 계산
  const getRemainingTime = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return '마감됨';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
              {groupBuy.is_leader && (
                <Badge variant="default" className="bg-blue-500">리더</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image
                  src={groupBuy.product_details?.image_url || '/placeholder.png'}
                  alt={groupBuy.product_details?.name || '상품 이미지'}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{groupBuy.product_details?.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  참여자 {groupBuy.current_participants}/{groupBuy.max_participants}명
                </p>
                
                {/* 입찰 현황 */}
                {groupBuy.bids && groupBuy.bids.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      입찰 {groupBuy.bids.length}건 | 
                      최저가 {Math.min(...groupBuy.bids.map(b => b.total_price)).toLocaleString()}원
                    </p>
                  </div>
                )}
                
                {/* 선택 마감 시간 */}
                {groupBuy.final_selection_deadline && (
                  <div className="flex items-center text-xs text-red-500 mt-2">
                    <Clock size={12} className="mr-1" />
                    <span>선택 마감: {getRemainingTime(groupBuy.final_selection_deadline)}</span>
                  </div>
                )}
                
                {/* 액션 버튼 */}
                <div className="mt-3">
                  {groupBuy.is_leader ? (
                    <Link href={`/groupbuys/${groupBuy.id}/select-seller`}>
                      <Button size="sm" className="w-full">
                        판매자 선택하기
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/groupbuys/${groupBuy.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        상세보기
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}