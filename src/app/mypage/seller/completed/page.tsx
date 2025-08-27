'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { tokenUtils } from '@/lib/tokenUtils';
import { toast } from '@/components/ui/use-toast';

interface CompletedSale {
  id: number;
  product_name: string;
  product_category: string;
  bid_amount: number;
  participants_count: number;
  completed_at: string;
  groupbuy_id: number;
}

export default function SellerCompletedSales() {
  const router = useRouter();
  const [sales, setSales] = useState<CompletedSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedSales = async () => {
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login?callbackUrl=/mypage/seller/completed');
          return;
        }

        // 판매완료 목록 조회
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/seller/sales/?status=completed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSales(data.results || data);
        } else {
          throw new Error('데이터 조회 실패');
        }
      } catch (error) {
        console.error('판매완료 목록 조회 오류:', error);
        toast({
          variant: 'destructive',
          title: '조회 실패',
          description: '판매완료 목록을 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedSales();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2"
          onClick={() => router.push('/mypage/seller')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold">판매완료</h1>
      </div>

      {sales.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">판매완료된 거래가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{sale.product_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{sale.product_category}</p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-700">
                    판매완료
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">판매 금액</p>
                    <p className="font-bold">{sale.bid_amount.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">구매자 수</p>
                    <p className="font-bold">{sale.participants_count}명</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">완료일</p>
                    <p className="font-bold">
                      {new Date(sale.completed_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}