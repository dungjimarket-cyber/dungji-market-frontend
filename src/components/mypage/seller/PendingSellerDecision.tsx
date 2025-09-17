'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GroupBuy } from '@/types/groupbuy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Users, Clock } from 'lucide-react';
import Image from 'next/image';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { useToast } from '@/hooks/use-toast';
import { BuyerConfirmationModal } from '@/components/groupbuy/BuyerConfirmationModal';

/**
 * 판매확정/포기 선택하기 컴포넌트
 * 구매자 선택이 끝나고 판매자가 최종 결정해야 하는 공구
 */
export default function PendingSellerDecision() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [groupBuys, setGroupBuys] = useState<GroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedGroupBuy, setSelectedGroupBuy] = useState<GroupBuy | null>(null);

  useEffect(() => {
    const fetchPendingDecision = async () => {
      if (!accessToken) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/seller_pending_decision/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGroupBuys(Array.isArray(data) ? data : (data.results || []));
        }
      } catch (error) {
        console.error('판매자 선택 대기 공구 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingDecision();
  }, [accessToken]);

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
        선택 대기중인 공구가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 안내 메시지 */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div>
            <p className="text-sm text-orange-800 font-medium">
              판매 최종선택이 필요합니다!
            </p>
            <p className="text-xs text-orange-700 mt-1">
              6시간 이내에 판매확정 또는 판매포기를 선택해주세요.
              미선택시 자동으로 판매포기 처리됩니다.
            </p>
          </div>
        </div>
      </div>

      {groupBuys.map((groupBuy) => (
        <Card key={groupBuy.id} className="hover:shadow-lg transition-shadow border-orange-200">
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
                    <Users className="h-4 w-4" />
                    구매확정 {groupBuy.confirmed_buyers || 0}/{groupBuy.current_participants}명
                  </span>
                </div>

                {/* 남은 시간 표시 */}
                {groupBuy.seller_selection_end && (
                  <div className="mb-2 bg-orange-100 rounded px-2 py-1 inline-block">
                    <span className="text-sm text-orange-700">남은시간: </span>
                    <CountdownTimer
                      endTime={groupBuy.seller_selection_end}
                      format="compact"
                      className="inline-block text-orange-800 font-bold"
                      urgent={180} // 3시간 이하일 때 urgent
                    />
                  </div>
                )}

                {/* 모바일과 데스크탑 레이아웃 분리 */}
                <div className="mt-3 space-y-2">
                  {/* 첫 번째 줄: 최종 선정 지원금 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">최종 선정 지원금: </span>
                    <span className="font-semibold text-green-600">
                      {(groupBuy.winning_bid_amount || 0).toLocaleString()}원
                    </span>
                  </div>
                  
                  {/* 두 번째 줄: 버튼들 */}
                  <div className="flex gap-2 justify-between sm:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 sm:flex-initial"
                      onClick={() => {
                        setSelectedGroupBuy(groupBuy);
                        setShowConfirmationModal(true);
                      }}
                    >
                      구매확정률 확인
                    </Button>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-initial"
                      onClick={() => router.push(`/groupbuys/${groupBuy.id}`)}
                    >
                      판매확정/포기 선택
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* 구매확정률 모달 */}
      {selectedGroupBuy && (
        <BuyerConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => {
            setShowConfirmationModal(false);
            setSelectedGroupBuy(null);
          }}
          totalParticipants={selectedGroupBuy.current_participants}
          confirmedCount={selectedGroupBuy.confirmed_buyers || 0}
          confirmationRate={selectedGroupBuy.current_participants > 0 
            ? Math.round(((selectedGroupBuy.confirmed_buyers || 0) / selectedGroupBuy.current_participants) * 100)
            : 0}
        />
      )}
    </div>
  );
}