'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSellerSales } from '@/lib/api/sellerService';
import { SaleConfirmation } from '@/types/seller';
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
import { ChevronLeft, Search, Phone, Calendar, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import ContactInfoModal from '@/components/groupbuy/ContactInfoModal';

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
 * 판매 확정 목록 페이지 컴포넌트
 */
export default function SalesListPage() {
  return (
    <Suspense fallback={<SalesListSkeleton />}>
      <SalesListClient />
    </Suspense>
  );
}

/**
 * 판매 목록 로딩 스켈레톤 컴포넌트
 */
function SalesListSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link href="/mypage/seller" className="mr-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">판매 확정 목록</h1>
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
        <Card key={i} className="mb-4">
          <CardContent className="p-4">
            <Skeleton className="h-6 mb-2 w-1/3" />
            <Skeleton className="h-4 mb-2 w-1/2" />
            <div className="flex justify-between mt-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 판매 목록 클라이언트 컴포넌트
 */
function SalesListClient() {
  const [sales, setSales] = useState<SaleConfirmation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const { toast } = useToast();
  const [selectedGroupBuyId, setSelectedGroupBuyId] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');

  // 판매 확정 목록 조회
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        console.log('판매 목록 조회 파라미터:', { page, searchQuery, filter });
        
        const params: Record<string, any> = { page };
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        if (filter !== 'all') {
          params.status = filter;
        }
        
        try {
          // API 호출
          const response = await getSellerSales(params);
          setSales(response.results);
          setTotalCount(response.count);
        } catch (apiError) {
          console.error('판매 확정 목록 조회 오류:', apiError);
          setSales([]);
          setTotalCount(0);
          // 에러 토스트 표시
          toast({
            title: '데이터 로딩 실패',
            description: '판매 확정 목록을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('판매 확정 목록 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [page, searchQuery, filter]);

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/mypage/seller/sales?page=1');
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/mypage/seller" className="mr-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">판매 확정 목록</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select
          value={filter}
          onValueChange={(value: 'all' | 'pending' | 'confirmed') => setFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="모든 상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">모든 상태</SelectItem>
            <SelectItem value="pending">확정 대기중</SelectItem>
            <SelectItem value="confirmed">확정 완료</SelectItem>
          </SelectContent>
        </Select>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <Input
            type="text"
            placeholder="거래번호 또는 상품명 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            검색
          </Button>
        </form>
      </div>

      {loading ? (
        <SalesListSkeleton />
      ) : sales.length > 0 ? (
        <>
          <div className="space-y-4">
            {sales.map((sale) => (
              <SaleCard 
                key={sale.id} 
                sale={sale} 
                onViewContacts={() => {
                  setSelectedGroupBuyId(sale.id);
                  setIsContactModalOpen(true);
                }}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/mypage/seller/sales?page=${page - 1}`)}
                >
                  이전
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push(`/mypage/seller/sales?page=${page + 1}`)}
                disabled={sales.length < 10} // 페이지당 10개 항목 가정
              >
                다음
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">판매 확정 내역이 없습니다.</p>
        </div>
      )}
      
      {/* 연락처 정보 모달 */}
      {selectedGroupBuyId && (
        <ContactInfoModal
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedGroupBuyId(null);
          }}
          groupbuyId={selectedGroupBuyId}
          userRole="seller"
        />
      )}
    </div>
  );
}

/**
 * 판매 확정 카드 컴포넌트
 */
interface SaleCardProps {
  sale: SaleConfirmation;
  onViewContacts?: () => void;
}

function SaleCard({ sale, onViewContacts }: SaleCardProps) {
  const formattedDate = new Date(sale.confirmationDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
          <div className="flex items-center">
            <div className="mr-4">
              <div className="bg-gray-100 w-16 h-16 rounded-md flex items-center justify-center">
                <Phone className="h-6 w-6 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{sale.productName}</h3>
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <span>통신사: {sale.provider}</span>
                <span className="mx-2">|</span>
                <span>요금제: {sale.plan}</span>
              </div>
              
              <div className="text-sm text-gray-500">
                거래 번호: #{sale.tradeNumber}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <Badge 
                className={
                  sale.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }
              >
                {sale.status === 'confirmed' ? '확정 완료' : '확정 대기중'}
              </Badge>
              
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formattedDate}
              </div>
              
              {sale.status === 'confirmed' && onViewContacts && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewContacts();
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  구매자 연락처
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
  );
}


