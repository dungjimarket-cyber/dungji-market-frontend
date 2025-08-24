'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, TrendingUp, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
 * 판매자가 견적을 제안한 공구를 페이지네이션과 검색 기능으로 표시
 */
export default function BidHistory() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [allGroupBuys, setAllGroupBuys] = useState<GroupBuyWithBid[]>([]);
  const [filteredGroupBuys, setFilteredGroupBuys] = useState<GroupBuyWithBid[]>([]);
  const [displayedGroupBuys, setDisplayedGroupBuys] = useState<GroupBuyWithBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
          setAllGroupBuys(data);
          setFilteredGroupBuys(data);
          // 첫 페이지 표시
          setDisplayedGroupBuys(data.slice(0, itemsPerPage));
        }
      } catch (error) {
        console.error('견적내역 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBidHistory();
  }, [accessToken]);

  // 검색 기능
  useEffect(() => {
    if (searchTerm) {
      const filtered = allGroupBuys.filter(gb => {
        const productName = gb.product_details?.name || gb.title || '';
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredGroupBuys(filtered);
      setCurrentPage(1);
      setDisplayedGroupBuys(filtered.slice(0, itemsPerPage));
    } else {
      setFilteredGroupBuys(allGroupBuys);
      setCurrentPage(1);
      setDisplayedGroupBuys(allGroupBuys.slice(0, itemsPerPage));
    }
  }, [searchTerm, allGroupBuys]);

  // 페이지 변경 시 표시할 데이터 업데이트
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedGroupBuys(filteredGroupBuys.slice(startIndex, endIndex));
  }, [currentPage, filteredGroupBuys]);

  const totalPages = Math.ceil(filteredGroupBuys.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (allGroupBuys.length === 0) {
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
      {/* 검색 바 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="상품명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 검색 결과 */}
      {searchTerm && (
        <div className="text-sm text-gray-600 mb-2">
          검색 결과: {filteredGroupBuys.length}개
        </div>
      )}

      {/* 견적 목록 */}
      {displayedGroupBuys.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-gray-500">
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        </Card>
      ) : (
        displayedGroupBuys.map((gb) => (
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
        ))
      )}
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}