'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GroupBuy } from '@/types/groupbuy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { ContactInfoModal } from '@/components/final-selection/ContactInfoModal';

/**
 * 거래중 컴포넌트
 * 구매확정과 판매확정이 모두 완료되어 실제 거래가 진행중인 공구
 */
export default function TradingGroupBuys() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupBuyId, setSelectedGroupBuyId] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const fetchTrading = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_trading/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGroupBuys(data);
        }
      } catch (error) {
        console.error('거래중 공구 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrading();
  }, [accessToken]);

  const handleCompleteSale = async (groupBuyId: number) => {
    if (!confirm('판매를 완료하시겠습니까?')) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/complete_sale/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('판매가 완료되었습니다.');
        // 목록 새로고침
        setGroupBuys(prev => prev.filter(gb => gb.id !== groupBuyId));
      } else {
        const error = await response.json();
        toast.error(error.error || '판매 완료 처리에 실패했습니다.');
      }
    } catch (error) {
      toast.error('판매 완료 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (groupBuys.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        거래중인 공구가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {groupBuys.map((groupBuy) => (
          <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow border-green-200">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* 상품 이미지 */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={groupBuy.product_details?.image_url || '/placeholder-product.jpg'}
                    alt={groupBuy.product_details?.name || '상품'}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>

                {/* 공구 정보 */}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {groupBuy.product_details?.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      구매확정 {groupBuy.confirmed_buyers || 0}명
                    </span>
                    <span className="text-green-600 font-medium">
                      거래 진행중
                    </span>
                  </div>

                  <div className="mb-3">
                    <span className="text-sm text-gray-600">최종 낙찰지원금: </span>
                    <span className="font-semibold text-green-600">
                      {groupBuy.winning_bid_amount?.toLocaleString() || 0}원
                    </span>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/groupbuys/${groupBuy.id}`)}
                    >
                      공구보기
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedGroupBuyId(groupBuy.id);
                        setIsContactModalOpen(true);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      구매자 정보보기
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      onClick={() => router.push(`/noshow-report/create?groupbuy=${groupBuy.id}`)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      노쇼신고
                    </Button>
                    
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleCompleteSale(groupBuy.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      판매완료
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* 구매자 정보 모달 */}
      {selectedGroupBuyId && (
        <ContactInfoModal
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedGroupBuyId(null);
          }}
          groupBuyId={selectedGroupBuyId}
          accessToken={accessToken}
          isSeller={true}
        />
      )}
    </>
  );
}