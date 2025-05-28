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
import { ChevronLeft, Search, Calendar } from 'lucide-react';
import { formatDate, formatNumberWithCommas, cn } from '@/lib/utils';
import { tokenUtils } from '@/lib/tokenUtils';

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
 * 셀러 입찰 목록 페이지 컴포넌트
 */
export default function SellerBidsPage() {
  return (
    <Suspense fallback={<BidsListSkeleton />}>
      <BidsListClient />
    </Suspense>
  );
}

/**
 * 입찰 목록 로딩 스켈레톤 컴포넌트
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
        <h1 className="text-2xl font-bold">입찰 목록</h1>
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
 * 입찰 목록 클라이언트 컴포넌트
 */
function BidsListClient() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'selected' | 'confirmed' | 'rejected'>('all');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  // 입찰 목록 조회
  useEffect(() => {
    const fetchBids = async () => {
      try {
        setLoading(true);
        console.log('입찰 목록 조회 파라미터:', { page, searchQuery, filter });
        
        // API 호출을 위한 인증 헤더 확인
        const token = await tokenUtils.getAccessToken();
        console.log('인증 토큰 있음:', !!token);
        
        const params: Record<string, any> = { page };
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (filter !== 'all') {
          params.status = filter;
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
          console.log('포맷팅 전 입찰 데이터:', formattedBids);
          
          setBids(formattedBids);
          setTotalCount(formattedBids.length);
          setLoading(false);
          return;
        } catch (apiError) {
          console.error('API 호출 오류, 가상 데이터 사용:', apiError);
        }
        
        // API 호출이 실패한 경우 개발용 가상 데이터 사용
        const mockBids = [
          {
            id: 1,
            groupbuy: {
              id: 101,
              title: '삼성 갤럭시 S24 Ultra 공동구매',
              product: {
                id: 201,
                name: '삼성 갤럭시 S24 Ultra',
                category: { name: '모바일' }
              },
              creator: { username: '김모바일' },
              region_type: '서울',
              status: 'bidding',
              current_participants: 3,
              min_participants: 3,
              max_participants: 5
            },
            amount: 450000,
            message: '번호이동 시 추가 할인해드립니다.',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            groupbuy: {
              id: 102,
              title: '아이폰 15 Pro 공동구매',
              product: {
                id: 202,
                name: '아이폰 15 Pro',
                category: { name: '모바일' }
              },
              creator: { username: '박애플' },
              region_type: '경기',
              status: 'confirmed',
              current_participants: 4,
              min_participants: 3,
              max_participants: 5
            },
            amount: 550000,
            message: 'AppleCare+ 무상 제공해 드립니다.',
            status: 'selected',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 43200000).toISOString()
          },
          {
            id: 3,
            groupbuy: {
              id: 103,
              title: 'LG 그램 노트북 공동구매',
              product: {
                id: 203,
                name: 'LG 그램 2025',
                category: { name: '노트북' }
              },
              creator: { username: '이엘지' },
              region_type: '부산',
              status: 'completed',
              current_participants: 5,
              min_participants: 5,
              max_participants: 10
            },
            amount: 300000,
            message: '정품 파우치와 마우스 증정',
            status: 'confirmed',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 4,
            groupbuy: {
              id: 104,
              title: '애플 에어팟 프로 2세대 공동구매',
              product: {
                id: 204,
                name: '애플 에어팟 프로 2',
                category: { name: '이어폰' }
              },
              creator: { username: '최사운드' },
              region_type: '대구',
              status: 'cancelled',
              current_participants: 2,
              min_participants: 3,
              max_participants: 5
            },
            amount: 150000,
            message: '무료 각인 서비스 제공',
            status: 'rejected',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];
        
        // 검색 및 필터링 적용
        let filteredBids = mockBids;
        if (searchQuery) {
          filteredBids = filteredBids.filter(bid => 
            bid.groupbuy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bid.groupbuy.product.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        if (filter !== 'all') {
          filteredBids = filteredBids.filter(bid => bid.status === filter);
        }
        
        setBids(filteredBids);
        setTotalCount(filteredBids.length);
        setLoading(false);
      } catch (error) {
        console.error('입찰 목록 조회 오류:', error);
        setLoading(false);
      }
    };

    fetchBids();
  }, [page, searchQuery, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/mypage/seller/bids?page=1&filter=${filter}&search=${encodeURIComponent(searchQuery)}`);
  };

  const handleFilterChange = (value: 'all' | 'pending' | 'selected' | 'confirmed' | 'rejected') => {
    setFilter(value);
    router.push(`/mypage/seller/bids?page=1&filter=${value}&search=${encodeURIComponent(searchQuery)}`);
  };

  // 입찰 상태에 따른 텍스트 표시
  const statusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'selected': return '낙찰 선택';
      case 'confirmed': return '판매 확정';
      case 'rejected': return '판매 포기';
      default: return '알 수 없음';
    }
  };

  // 입찰 유형에 따른 표시 문구
  const getBidTypeText = (bidType: string) => {
    return bidType === 'support' ? '지원금 입찰' : '가격 입찰';
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'selected': return 'bg-yellow-100 text-yellow-800';
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
        <h1 className="text-2xl font-bold">입찰 목록</h1>
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
            <SelectItem value="pending">선택 대기중</SelectItem>
            <SelectItem value="selected">선택됨</SelectItem>
            <SelectItem value="confirmed">확정됨</SelectItem>
            <SelectItem value="rejected">거절됨</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {bids.length === 0 ? (
        <Card className="text-center p-8 mb-4">
          <CardContent className="pt-6">
            <p className="text-lg text-gray-500">입찰 내역이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        bids.map((bid) => (
          <Card key={bid.id} className="mb-4 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between mb-2">
                <div>
                  <h2 className="text-lg font-medium">
                    <Link href={`/groupbuys/${bid.groupbuy}`} className="hover:text-blue-600">
                      {bid.groupbuy_title || `공동구매 #${bid.groupbuy}`}
                    </Link>
                  </h2>
                  <p className="text-sm text-gray-600">
                    상품: {bid.product_name || '상품명 없음'} | 
                    입찰 유형: {getBidTypeText(bid.bid_type) || '가격 제안'} | 
                    상태: {statusText(bid.status)}
                  </p>
                </div>
                <div className="mt-2 md:mt-0">
                  <Badge className={statusColor(bid.status)}>
                    {statusText(bid.status)}
                  </Badge>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md mb-2">
                <p className="text-gray-700">
                  <span className="font-medium">제안 금액:</span> {formatNumberWithCommas(bid.amount)}원
                </p>
                {bid.contract_period && (
                  <p className="text-gray-700">
                    <span className="font-medium">계약 기간:</span> {bid.contract_period}
                  </p>
                )}
                <p className="text-gray-700">
                  <span className="font-medium">메시지:</span> {bid.message || '메시지 없음'}
                </p>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  입찰일: {formatDate(bid.created_at)}
                </div>
                <div>
                  {bid.status === 'pending' && (
                    <Link href={`/groupbuys/${bid.groupbuy}`}>
                      <Button variant="outline" size="sm">상세보기</Button>
                    </Link>
                  )}
                  {bid.status === 'selected' && (
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
