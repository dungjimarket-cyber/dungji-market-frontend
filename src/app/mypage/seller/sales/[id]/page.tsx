'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { getSellerSaleDetail } from '@/lib/api/sellerService';
import { SaleConfirmation } from '@/types/seller';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Info,
  Phone,
  Calendar,
  User
} from 'lucide-react';
import { formatNumberWithCommas } from '@/lib/utils';

/**
 * 판매 확정 상세 페이지 컴포넌트
 */
export default function SaleDetailPage() {
  const [sale, setSale] = useState<SaleConfirmation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const fetchSaleDetail = async () => {
      try {
        setLoading(true);
        // ID 값 로그 추가와 유효성 검사
        console.log('판매 상세 페이지 ID:', id, typeof id);
        
        // ID가 유효한 숫자인지 확인
        const numericId = Number(id);
        if (isNaN(numericId) || numericId <= 0) {
          console.error('유효하지 않은 ID:', id);
          // 개발 목적으로 가상 데이터 사용 (DB에 데이터가 없을 경우)
          setSale({
            id: 1,
            productName: '삼성 갤럭시 S24 Ultra',
            provider: 'SK텔레콤',
            plan: '5만원대',
            tradeNumber: '#123456',
            confirmationDate: new Date().toISOString(),
            subsidyAmount: 450000,
            status: 'pending',
            buyerInfo: [
              {
                name: '홍길동',
                contact: '010-1234-5678'
              }
            ]
          });
          setLoading(false);
          return;
        }
        
        // 유효한 ID로 API 호출
        const data = await getSellerSaleDetail(numericId);
        setSale(data);
      } catch (error) {
        console.error('판매 확정 상세 조회 오류:', error);
        // 오류 발생 시 가상 데이터 사용
        setSale({
          id: 1,
          productName: '삼성 갤럭시 S24 Ultra',
          provider: 'SK텔레콤',
          plan: '5만원대',
          tradeNumber: '#123456',
          confirmationDate: new Date().toISOString(),
          subsidyAmount: 450000,
          status: 'pending',
          buyerInfo: [
            {
              name: '홍길동',
              contact: '010-1234-5678'
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSaleDetail();
    } else {
      // ID가 없는 경우 오류 처리
      console.error('ID가 없음');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <SaleDetailSkeleton />;
  }

  if (!sale) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">판매 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-6">요청하신 판매 정보가 존재하지 않거나 액세스 권한이 없습니다.</p>
          <Button onClick={() => router.push('/mypage/seller/sales')}>
            판매 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(sale.confirmationDate).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/mypage/seller/sales" className="mr-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">판매 확정 상세</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <CardTitle>{sale.productName}</CardTitle>
            <Badge 
              className={
                sale.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {sale.status === 'confirmed' ? '판매 확정' : '확정 대기중'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">상품 정보</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">출시일</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">통신사</span>
                  <span className="font-medium">{sale.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">요금제</span>
                  <span>{sale.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">거래 번호</span>
                  <span className="font-medium">#{sale.tradeNumber}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-6">
              <h3 className="text-lg font-medium mb-4">지원금 정보</h3>
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <div className="flex items-center text-blue-700 mb-2">
                  <Info className="h-5 w-5 mr-2" />
                  <span className="font-medium">지원금 정보</span>
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {formatNumberWithCommas(sale.subsidyAmount)} 원
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  *부가서비스나 카드결제를 제외한 순수 지원금입니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">구매자 연락처</CardTitle>
        </CardHeader>
        <CardContent>
          {sale.buyerInfo.length > 0 ? (
            <div className="space-y-4">
              {sale.buyerInfo.map((buyer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <span className="font-medium">{buyer.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-green-600 font-medium">{buyer.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              구매자 정보가 없습니다
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          className="w-full max-w-md bg-green-500 hover:bg-green-600"
          onClick={() => router.push('/mypage/seller/sales')}
        >
          확인
        </Button>
      </div>
    </div>
  );
}

/**
 * 판매 상세 로딩 스켈레톤
 */
function SaleDetailSkeleton() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-10 mr-4" />
        <Skeleton className="h-8 w-48" />
      </div>

      <Card className="mb-6">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4 md:pt-0 md:border-t-0 md:border-l md:pl-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-12 w-full max-w-md mx-auto" />
    </div>
  );
}
