'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GroupBuy } from '@/types/groupbuy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import { Pagination } from '@/components/ui/Pagination';

/**
 * 입찰내역 컴포넌트
 * 판매자가 입찰한 모든 공구를 표시
 */
export default function BidHistory() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
          setGroupBuys(data);
        }
      } catch (error) {
        console.error('입찰내역 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (groupBuys.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 입찰한 공구가 없습니다.
      </div>
    );
  }

  // 페이징된 데이터
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGroupBuys = groupBuys.slice(startIndex, endIndex);
  const totalPages = Math.ceil(groupBuys.length / itemsPerPage);

  return (
    <div className="space-y-4">
      {paginatedGroupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* 상품 이미지 */}
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
                  alt={groupBuy.product_details?.name || '상품'}
                  fill
                  className="object-cover rounded-md"
                />
              </div>

              {/* 공구 정보 */}
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {groupBuy.product_details?.name}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(groupBuy.end_time).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {groupBuy.current_participants}/{groupBuy.max_participants}명
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {groupBuy.region_name || '전국'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">입찰금액: </span>
                    <span className="font-semibold text-green-600">
                      {groupBuy.my_bid_amount?.toLocaleString()}원
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => router.push(`/groupbuys/${groupBuy.id}`)}
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}