'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Truck, Clock, CheckCircle, Phone, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { ContactInfoModal } from '@/components/final-selection/ContactInfoModal';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  product_info?: Product; // API에서 전체 상품 정보 포함
  seller_name?: string;
  seller_phone?: string;
  final_price?: number;
  shipping_status?: 'preparing' | 'shipped' | 'delivered';
  tracking_number?: string;
  seller_confirmed?: boolean;
  buyer_confirmed?: boolean;
  all_buyers_confirmed?: boolean;
}

/**
 * 구매 확정된 공구 목록 컴포넌트
 * 사용자가 구매확정을 선택하고 판매자의 판매확정을 기다리는 공구들을 표시
 */
export default function PurchaseConfirmedGroupBuys() {
  const { isAuthenticated, isLoading, accessToken, user } = useAuth();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupBuyId, setSelectedGroupBuyId] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [selectedCompleteId, setSelectedCompleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

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
        setGroupBuys(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        console.error('구매 확정된 공구 목록 조회 오류:', err);
        setGroupBuys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseConfirmedGroupBuys();
  }, [isAuthenticated, accessToken]);

  const handlePurchaseComplete = async () => {
    if (!selectedCompleteId || !accessToken) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${selectedCompleteId}/complete_purchase/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast({
          title: '구매 완료',
          description: '거래가 성공적으로 완료되었습니다. 후기를 작성해주세요!'
        });
        // 목록 새로고침
        window.location.reload();
      } else {
        throw new Error('구매 완료 처리 실패');
      }
    } catch (error) {
      console.error('구매 완료 처리 오류:', error);
      toast({
        variant: 'destructive',
        title: '처리 실패',
        description: '구매 완료 처리 중 오류가 발생했습니다.'
      });
    } finally {
      setShowCompleteDialog(false);
      setSelectedCompleteId(null);
    }
  };


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
            <p className="text-gray-500">거래중인 공구가 없습니다.</p>
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                  src={groupBuy.product_info?.image_url || groupBuy.product?.image_url || '/placeholder.png'}
                  alt={groupBuy.product_info?.name || groupBuy.product?.name || '상품 이미지'}
                  fill
                  className="object-cover rounded"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{groupBuy.product_info?.name || groupBuy.product?.name}</p>
                
                {/* 확정 상태 표시 - 거래중 상태이므로 판매자 확정 완료 */}
                {groupBuy.status === 'in_progress' && groupBuy.seller_confirmed ? (
                  <div className="mt-1">
                    <p className="text-sm text-green-600 font-medium">
                      거래 진행중
                    </p>
                    {groupBuy.seller_name && (
                      <p className="text-sm text-gray-600">
                        판매자: {groupBuy.seller_name}
                      </p>
                    )}
                  </div>
                ) : groupBuy.status === 'in_progress' ? (
                  <p className="text-sm text-green-600 mt-1">
                    거래 진행중
                  </p>
                ) : !groupBuy.seller_confirmed ? (
                  <p className="text-sm text-orange-600 mt-1">
                    판매자 선택 대기중
                  </p>
                ) : !groupBuy.all_buyers_confirmed ? (
                  <p className="text-sm text-blue-600 mt-1">
                    구매자 선택 대기중
                  </p>
                ) : null}
                
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
                <div className="mt-3">
                  {/* 첫 번째 줄: 연락처 확인 및 공구보기 */}
                  <div className="flex gap-2 mb-2 md:justify-start">
                    {/* 거래중 상태에서는 판매자 정보 확인 가능 */}
                    {(groupBuy.status === 'in_progress' || (groupBuy.seller_confirmed && groupBuy.all_buyers_confirmed)) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 md:flex-none md:w-auto md:px-3"
                        onClick={() => {
                          setSelectedGroupBuyId(groupBuy.id);
                          setIsContactModalOpen(true);
                        }}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        판매자정보확인
                      </Button>
                    )}
                    <Link href={`/groupbuys/${groupBuy.id}`} className="flex-1 md:flex-none">
                      <Button size="sm" variant="outline" className="w-full md:w-auto md:px-4">
                        공구보기
                      </Button>
                    </Link>
                  </div>
                  
                  {/* 두 번째 줄: 거래종료 버튼만 표시 */}
                  {groupBuy.shipping_status !== 'delivered' ? (
                    <div className="flex gap-2 md:justify-start">
                      <Button
                        size="sm"
                        className="flex-1 md:flex-none md:w-auto md:px-4"
                        onClick={() => {
                          setSelectedCompleteId(groupBuy.id);
                          setShowCompleteDialog(true);
                        }}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        거래종료
                      </Button>
                    </div>
                  ) : (
                    // 본인이 만든 공구에도 후기 작성 가능
                    <Link href={`/review/create?groupbuy=${groupBuy.id}`} className="w-full">
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
      
      {/* 연락처 정보 모달 */}
      {selectedGroupBuyId && (
        <ContactInfoModal
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedGroupBuyId(null);
          }}
          groupBuyId={selectedGroupBuyId}
          accessToken={accessToken}
        />
      )}
      
      {/* 거래종료 확인 다이얼로그 */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>거래 종료 확인</AlertDialogTitle>
            <AlertDialogDescription>
              거래를 종료하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompleteId(null)}>
              아니오
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePurchaseComplete}>
              네
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}