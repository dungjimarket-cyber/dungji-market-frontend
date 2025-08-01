'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, Clock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  base_price: number;
  image_url?: string;
}

interface GroupBuy {
  id: number;
  title: string;
  status: string;
  current_participants: number;
  max_participants: number;
  end_time: string;
  product: Product;
  seller_name?: string;
  seller_phone?: string;
  final_price?: number;
  shipping_status?: 'preparing' | 'shipped' | 'delivered';
  tracking_number?: string;
}

/**
 * 구매 확정된 공구 목록 컴포넌트
 * 판매자가 확정하고 배송을 준비 중인 공구들을 표시
 */
export default function PurchaseConfirmedGroupBuys() {
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchaseConfirmedGroupBuys = async () => {
      if (!isAuthenticated || !accessToken) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/purchase_confirmed/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          if (response.status === 404) {
            setGroupBuys([]);
            return;
          }
          throw new Error('구매 확정된 공구 목록을 가져오는데 실패했습니다.');
        }

        const data = await response.json();
        setGroupBuys(data);
      } catch (err) {
        console.error('구매 확정된 공구 목록 조회 오류:', err);
        setGroupBuys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseConfirmedGroupBuys();
  }, [isAuthenticated, accessToken]);

  if (isLoading || loading) return <p className="text-gray-500">로딩 중...</p>;
  
  if (!isAuthenticated) {
    return <p className="text-gray-500">로그인이 필요합니다.</p>;
  }
  
  if (groupBuys.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">구매 확정된 공구가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              판매자가 확정하고 배송 준비 중인 공구가 있으면 여기에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getShippingStatusBadge = (status?: string) => {
    switch (status) {
      case 'preparing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />배송준비중</Badge>;
      case 'shipped':
        return <Badge className="bg-blue-500"><Truck className="w-3 h-3 mr-1" />배송중</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />배송완료</Badge>;
      default:
        return <Badge variant="outline">확인중</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
              {getShippingStatusBadge(groupBuy.shipping_status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-20 h-20 relative flex-shrink-0">
                <Image
                  src={groupBuy.product?.image_url || '/placeholder.png'}
                  alt={groupBuy.product?.name || '상품 이미지'}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{groupBuy.product?.name}</p>
                
                {/* 판매자 정보 */}
                {groupBuy.seller_name && (
                  <p className="text-sm text-gray-600 mt-1">
                    판매자: {groupBuy.seller_name}
                    {groupBuy.seller_phone && ` (${groupBuy.seller_phone})`}
                  </p>
                )}
                
                {/* 최종 가격 */}
                {groupBuy.final_price && (
                  <p className="text-sm font-medium text-blue-600 mt-1">
                    최종가격: {groupBuy.final_price.toLocaleString()}원
                  </p>
                )}
                
                {/* 운송장 번호 */}
                {groupBuy.tracking_number && (
                  <p className="text-xs text-gray-500 mt-1">
                    운송장: {groupBuy.tracking_number}
                  </p>
                )}
                
                {/* 액션 버튼 */}
                <div className="mt-3 flex gap-2">
                  <Link href={`/groupbuys/${groupBuy.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      상세보기
                    </Button>
                  </Link>
                  {groupBuy.shipping_status === 'delivered' && (
                    <Link href={`/reviews/write?groupbuy=${groupBuy.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        후기작성
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