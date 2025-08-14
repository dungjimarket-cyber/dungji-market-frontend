'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSellerBids } from '@/lib/api/sellerService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Search } from 'lucide-react';
import { formatNumberWithCommas, cn } from '@/lib/utils';
import { tokenUtils } from '@/lib/tokenUtils';
import { useToast } from '@/components/ui/use-toast';

// Skeleton 컴포넌트 인라인 정의
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/mypage/seller" className="mr-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">견적 내역</h1>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="w-full md:w-1/3">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4 p-4 border rounded-lg bg-white">
          <Skeleton className="h-6 mb-2 w-1/3" />
          <Skeleton className="h-4 mb-2 w-1/2" />
          <Skeleton className="h-4 mb-2 w-1/4" />
          <div className="flex justify-between mt-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 견적 목록 클라이언트 컴포넌트
 */
function BidsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const filterFromUrl = searchParams.get('filter');
  
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'selected' | 'confirmed' | 'rejected' | 'final_selection'>(
    (filterFromUrl as any) || 'all'
  );
  const { toast } = useToast();

  // URL 파라미터 변경 감지
  useEffect(() => {
    if (filterFromUrl) {
      setFilter(filterFromUrl as any);
    }
  }, [filterFromUrl]);

  // 견적 목록 조회
  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        console.log('견적 목록 조회 파라미터:', { page, searchQuery, filter });
        
        // API 호출을 위한 인증 헤더 확인
        const token = await tokenUtils.getAccessToken();
        console.log('인증 토큰 있음:', !!token);
        
        const params: Record<string, any> = { page };
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (filter !== 'all') {
          if (filter === 'final_selection') {
            // 최종선택 대기중인 견적 (selected 상태이면서 final_decision이 pending)
            params.status = 'selected';
            params.final_decision = 'pending';
          } else {
            params.status = filter;
          }
        }
        
        try {
          // 실제 API 호출
          const response = await getSellerBids(params);
          console.log('API 응답 데이터:', response);
          
          // 실제 DB 형식은 bid 객체에 groupbuy_id만 있고 groupbuy 객체는 없음
          let formattedBids;
          if (Array.isArray(response.results)) {
            formattedBids = response.results;
          } else if (Array.isArray(response)) {
            formattedBids = response;
          } else {
            formattedBids = [];
          }
          
          // 디버깅용 출력
          console.log('포맷팅 전 견적 데이터:', formattedBids);
          
          setBids(formattedBids);
          setTotalCount(formattedBids.length);
          setLoading(false);
          return;
        } catch (apiError) {
          console.error('견적 목록 조회 오류:', apiError);
          setBids([]);
          setTotalCount(0);
          
          // 에러 토스트 표시
          if (toast) {
            toast({
              title: '데이터 로딩 실패',
              description: '견적 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
              variant: 'destructive',
            });
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('견적 목록 조회 오류:', error);
        setLoading(false);
      }
    };

    fetchBids();
  }, [page, searchQuery, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/mypage/seller/bids?page=1&filter=${filter}&search=${encodeURIComponent(searchQuery)}`);
  };

  const handleFilterChange = (value: 'all' | 'pending' | 'selected' | 'confirmed' | 'rejected' | 'final_selection') => {
    setFilter(value);
    router.push(`/mypage/seller/bids?page=1&filter=${value}&search=${encodeURIComponent(searchQuery)}`);
  };

  // 견적 상태에 따른 텍스트 표시
  const statusText = (status: string, bid?: any) => {
    // display_status가 있으면 우선 사용 (백엔드에서 계산된 상태)
    if (bid?.display_status) {
      return bid.display_status;
    }
    
    // 모집기간 중인 경우
    if (bid?.status === 'recruiting') {
      return '견적중';
    }
    
    // 순위 기반 상태 표시
    if (bid?.my_bid_rank) {
      if (bid.my_bid_rank === 1) {
        return '낙찰';
      } else {
        return '낙찰실패';
      }
    }
    
    // 기존 로직 폴백
    switch (status) {
      case 'pending': return '견적 진행중';
      case 'selected': 
        // final_decision 상태에 따라 다르게 표시
        if (bid?.final_decision === 'pending') {
          return '최종선택 대기중';
        } else if (bid?.final_decision === 'confirmed') {
          return '판매 확정';
        } else if (bid?.final_decision === 'cancelled') {
          return '판매 포기';
        }
        return '낙찰됨';
      case 'confirmed': return '판매 확정';
      case 'rejected': return '판매 포기';
      default: return '알 수 없음';
    }
  };

  // 견적 유형에 따른 표시 문구
  const getBidTypeText = (bidType: string) => {
    return bidType === 'support' ? '지원금 견적' : '가격 견적';
  };

  const statusColor = (status: string, bid?: any) => {
    // display_status가 있으면 우선 사용
    if (bid?.display_status) {
      switch (bid.display_status) {
        case '낙찰': return 'bg-green-100 text-green-800';
        case '낙찰실패': return 'bg-gray-100 text-gray-800';
        case '견적중': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    // 순위 기반 색상
    if (bid?.my_bid_rank) {
      if (bid.my_bid_rank === 1) {
        return 'bg-green-100 text-green-800';
      } else {
        return 'bg-gray-100 text-gray-800';
      }
    }
    
    // 기존 로직 폴백
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'selected': 
        // final_decision 상태에 따라 다르게 표시
        if (bid?.final_decision === 'pending') {
          return 'bg-orange-100 text-orange-800';
        } else if (bid?.final_decision === 'confirmed') {
          return 'bg-green-100 text-green-800';
        } else if (bid?.final_decision === 'cancelled') {
          return 'bg-red-100 text-red-800';
        }
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <BidsListSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/mypage/seller" className="mr-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">견적 내역</h1>
        <span className="ml-2 text-sm text-gray-500">총 {totalCount}건</span>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex items-center w-full md:w-2/3">
          <Input
            placeholder="공구 이름이나 상품 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mr-2"
          />
          <Button type="submit" size="sm">
            <Search className="h-4 w-4 mr-1" />
            검색
          </Button>
        </form>
        
        <Select
          value={filter}
          onValueChange={(value: any) => handleFilterChange(value)}
        >
          <SelectTrigger className="w-full md:w-1/3">
            <SelectValue placeholder="상태별 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="pending">견적 진행중</SelectItem>
            <SelectItem value="final_selection">최종선택 대기중</SelectItem>
            <SelectItem value="selected">낙찰됨</SelectItem>
            <SelectItem value="confirmed">판매 확정</SelectItem>
            <SelectItem value="rejected">판매 포기</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {bids.length === 0 ? (
        <Card className="text-center p-8 mb-4">
          <CardContent className="pt-6">
            <p className="text-lg text-gray-500">견적 내역이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        bids.map((bid) => (
          <Card key={bid.id} className="mb-4 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">상품명:</p>
                  <h2 className="text-lg font-medium">
                    <Link href={`/groupbuys/${bid.groupbuy}`} className="hover:text-blue-600">
                      {bid.product_name || '상품명 없음'}
                    </Link>
                  </h2>
                </div>
                <div className="text-right md:text-left">
                  <Badge className={statusColor(bid.status, bid)}>
                    {statusText(bid.status, bid)}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-sm text-gray-600">견적 유형:</p>
                  <p className="font-medium">{getBidTypeText(bid.bid_type) || '가격 견적'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">견적 금액:</p>
                  <p className="font-medium text-lg">
                    {typeof bid.my_bid_amount !== 'undefined' 
                      ? `${formatNumberWithCommas(bid.my_bid_amount)}원`
                      : typeof bid.amount === 'string' 
                        ? bid.amount 
                        : `${formatNumberWithCommas(bid.amount)}원`
                    }
                  </p>
                </div>
              </div>
              
              {/* 순위 정보 표시 */}
              {bid.my_bid_rank && bid.display_status === '낙찰실패' && (
                <div className="bg-yellow-50 p-3 rounded-md mb-3 border border-yellow-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">내 순위: {bid.my_bid_rank}위</span> / 전체 {bid.total_bidders}명
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    아쉽지만 낙찰되지 못했습니다 😢 다음 기회에 도전해보세요!
                  </p>
                </div>
              )}
              
              {/* 낙찰 축하 메시지 */}
              {bid.my_bid_rank === 1 && bid.display_status === '낙찰' && (
                <div className="bg-green-50 p-3 rounded-md mb-3 border border-green-200">
                  <p className="text-sm text-green-700 font-medium">
                    🎉 축하합니다! 낙찰되셨습니다!
                  </p>
                </div>
              )}
              
              {bid.message && (
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <p className="text-sm text-gray-700">{bid.message}</p>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">견적시간:</span> {new Date(bid.created_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
                <div>
                  {bid.status === 'pending' && (
                    <Link href={`/groupbuys/${bid.groupbuy}`}>
                      <Button variant="outline" size="sm">공구보기</Button>
                    </Link>
                  )}
                  {bid.status === 'selected' && bid.final_decision === 'pending' && (
                    <Link href={`/groupbuys/${bid.groupbuy}`}>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                        최종선택하기
                      </Button>
                    </Link>
                  )}
                  {bid.status === 'selected' && bid.final_decision !== 'pending' && (
                    <div className="flex space-x-2">
                      <Link href={`/mypage/seller/sales/${bid.id}`}>
                        <Button variant="outline" size="sm">판매 정보</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      
      {/* 페이지네이션 UI */}
      <div className="flex justify-center mt-6">
        <div className="flex space-x-1">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/mypage/seller/bids?page=${page - 1}&filter=${filter}&search=${encodeURIComponent(searchQuery)}`)}
            >
              이전
            </Button>
          )}
          <Button disabled variant="outline">
            {page}
          </Button>
          {bids.length === 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/mypage/seller/bids?page=${page + 1}&filter=${filter}&search=${encodeURIComponent(searchQuery)}`)}
            >
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
