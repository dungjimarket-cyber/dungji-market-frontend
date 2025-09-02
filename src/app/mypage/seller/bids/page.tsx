'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSellerBids } from '@/lib/api/sellerService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { formatNumberWithCommas, cn } from '@/lib/utils';
import { tokenUtils } from '@/lib/tokenUtils';
import { useToast } from '@/components/ui/use-toast';

// 페이지당 표시할 아이템 수
const ITEMS_PER_PAGE = 15;

// Skeleton 컴포넌트
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  );
};

/**
 * 셀러 견적 목록 페이지 컴포넌트
 */
export default function SellerBidsPage() {
  return (
    <Suspense fallback={<BidsListSkeleton />}>
      <BidsListClient />
    </Suspense>
  );
}

/**
 * 견적 목록 로딩 스켈레톤 컴포넌트
 */
function BidsListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <Skeleton className="h-8 w-8 mr-2" />
        <Skeleton className="h-8 w-32" />
      </div>
      
      <div className="mb-6">
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * 견적 목록 클라이언트 컴포넌트
 */
function BidsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  const [allBids, setAllBids] = useState<any[]>([]);
  const [filteredBids, setFilteredBids] = useState<any[]>([]);
  const [displayedBids, setDisplayedBids] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // 전체 견적 목록 조회
  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login');
          return;
        }
        
        // 모든 견적 가져오기 (페이징 없이)
        const response = await getSellerBids({});
        
        let formattedBids;
        if (Array.isArray(response)) {
          formattedBids = response;
        } else if (response?.results && Array.isArray(response.results)) {
          formattedBids = response.results;
        } else {
          formattedBids = [];
        }
        
        // 최신순 정렬
        formattedBids.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // 각 견적에 대해 상태 정리
        const processedBids = formattedBids.map((bid: any) => {
          // 공구 상태 기반으로 표시 상태 결정
          const groupbuyStatus = bid.groupbuy_status || bid.status;
          
          let displayStatus;
          if (groupbuyStatus === 'recruiting') {
            displayStatus = '모집중';
          } else {
            // 백엔드에서 제공하는 display_status 사용 또는 my_bid_rank로 판단
            if (bid.display_status) {
              // 백엔드의 display_status가 있으면 그대로 사용
              if (bid.display_status === '선정' || bid.display_status === '최종선정') {
                displayStatus = '최종선정';
              } else if (bid.display_status === '미선정') {
                displayStatus = '미선정';
              } else {
                displayStatus = '모집중';
              }
            } else if (bid.my_bid_rank) {
              // my_bid_rank가 1이면 선정, 아니면 미선정
              displayStatus = bid.my_bid_rank === 1 ? '최종선정' : '미선정';
            } else {
              // is_selected로 판단 (폴백)
              displayStatus = bid.is_selected === true ? '최종선정' : '미선정';
            }
          }
          
          return {
            ...bid,
            displayStatus
          };
        });
        
        setAllBids(processedBids);
        setFilteredBids(processedBids);
      } catch (error) {
        console.error('견적 목록 조회 오류:', error);
        toast({
          title: '데이터 로딩 실패',
          description: '견적 목록을 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [router, toast]);

  // 검색 및 필터링 기능
  useEffect(() => {
    let filtered = [...allBids];
    
    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bid => bid.displayStatus === statusFilter);
    }
    
    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(bid => {
        const productName = bid.product_name || '';
        return productName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    setFilteredBids(filtered);
  }, [searchTerm, statusFilter, allBids]);

  // 페이지 변경 시 표시할 데이터 업데이트
  useEffect(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setDisplayedBids(filteredBids.slice(startIndex, endIndex));
  }, [currentPage, filteredBids]);

  const totalPages = Math.ceil(filteredBids.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      router.push(`/mypage/seller/bids?page=${page}`);
    }
  };

  // 견적 상태에 따른 뱃지 스타일
  const getStatusBadge = (bid: any) => {
    const status = bid.displayStatus;
    
    switch (status) {
      case '최종선정':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            최종선정
          </Badge>
        );
      case '모집중':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            모집중
          </Badge>
        );
      case '미선정':
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
            미선정
            {bid.my_bid_rank && bid.total_bidders && (
              <span className="ml-1 text-xs">
                ({bid.my_bid_rank}/{bid.total_bidders})
              </span>
            )}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return <BidsListSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/mypage/seller">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">견적 내역</h1>
          <span className="ml-3 text-sm text-gray-500">
            총 {filteredBids.length}건
          </span>
        </div>
      </div>
      
      {/* 검색 바 및 필터 */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="상품명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* 상태 필터 */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="모집중">모집중</SelectItem>
              <SelectItem value="최종선정">최종선정</SelectItem>
              <SelectItem value="미선정">미선정</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 검색 결과 표시 */}
      {searchTerm && (
        <div className="text-sm text-gray-600 mb-4">
          검색 결과: {filteredBids.length}개
        </div>
      )}
      
      {/* 견적 목록 */}
      {displayedBids.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '견적 내역이 없습니다.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedBids.map((bid) => (
            <Card 
              key={bid.id} 
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 상품명과 상태 뱃지를 한 줄에 */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-base truncate">
                        {bid.product_name || '상품명 없음'}
                      </h3>
                      {getStatusBadge(bid)}
                    </div>
                    
                    {/* 견적 정보 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(bid.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="font-medium text-green-600">
                        견적금액: {formatNumberWithCommas(bid.my_bid_amount || bid.amount)}원
                      </span>
                      {bid.bid_type === 'support' && (
                        <Badge variant="outline" className="text-xs">
                          지원금 견적
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/groupbuys/${bid.groupbuy}`)}
                    className="flex items-center gap-1 ml-3"
                  >
                    공구보기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* 최종선정 메시지 */}
                {bid.displayStatus === '최종선정' && (
                  <div className="mt-3 p-2 bg-green-50 rounded-md">
                    <p className="text-xs text-green-700 font-medium">
                      🎉 축하합니다! 최종 선정되셨습니다!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
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