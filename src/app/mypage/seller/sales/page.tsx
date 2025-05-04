'use client';

import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Search, Phone, Calendar } from 'lucide-react';

/**
 * 판매 확정 목록 페이지 컴포넌트
 */
export default function SalesListPage() {
  const [sales, setSales] = useState<SaleConfirmation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  
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
          // API 호출 시도
          const response = await getSellerSales(params);
          setSales(response.results);
          setTotalCount(response.count);
        } catch (apiError) {
          console.error('API 호출 오류, 가상 데이터 사용:', apiError);
          
          // 개발용 가상 데이터
          const mockSales: SaleConfirmation[] = [
            {
              id: 1,
              productName: '삼성 갤럭시 S24 Ultra',
              provider: 'SK텔레콤',
              plan: '5만원대',
              tradeNumber: '#000123',
              confirmationDate: new Date().toISOString(),
              subsidyAmount: 450000,
              status: 'pending',
              buyerInfo: [{ name: '김민수', contact: '010-1234-5678' }]
            },
            {
              id: 2,
              productName: '아이폰 15 Pro',
              provider: 'KT',
              plan: '9만원대',
              tradeNumber: '#000124',
              confirmationDate: new Date(Date.now() - 86400000).toISOString(), // 어제
              subsidyAmount: 550000,
              status: 'confirmed',
              buyerInfo: [{ name: '박지원', contact: '010-9876-5432' }]
            },
            {
              id: 3,
              productName: '아이패드 Pro',
              provider: 'LG U+',
              plan: '7만원대',
              tradeNumber: '#000125',
              confirmationDate: new Date(Date.now() - 172800000).toISOString(), // 2일 전
              subsidyAmount: 300000,
              status: 'pending',
              buyerInfo: [{ name: '이지은', contact: '010-5555-1234' }]
            }
          ];
          
          // 검색 및 필터링 적용
          let filteredSales = mockSales;
          if (searchQuery) {
            filteredSales = filteredSales.filter(sale => 
              sale.productName.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          if (filter !== 'all') {
            filteredSales = filteredSales.filter(sale => sale.status === filter);
          }
          
          setSales(filteredSales);
          setTotalCount(filteredSales.length);
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
              <SaleCard key={sale.id} sale={sale} />
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
    </div>
  );
}

/**
 * 판매 확정 카드 컴포넌트
 */
interface SaleCardProps {
  sale: SaleConfirmation;
}

function SaleCard({ sale }: SaleCardProps) {
  const formattedDate = new Date(sale.confirmationDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Link href={`/mypage/seller/sales/${sale.id}`}>
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
                {sale.status === 'confirmed' ? '구매자 정보 및 공구 내역 확인' : '확정 대기중'}
              </Badge>
              
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {formattedDate}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * 판매 목록 로딩 스켈레톤
 */
function SalesListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Skeleton className="mr-4 w-16 h-16 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex flex-col items-end">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
