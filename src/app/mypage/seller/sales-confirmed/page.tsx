'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Phone, AlertCircle } from 'lucide-react';
import { tokenUtils } from '@/lib/tokenUtils';
import { toast } from '@/components/ui/use-toast';
import { ContactInfoModal } from '@/components/final-selection/ContactInfoModal';

interface SalesConfirmedGroupBuy {
  id: number;
  product_name: string;
  product_category: string;
  bid_amount: number;
  participants_count: number;
  final_decision: 'confirmed';
  created_at: string;
  buyer_confirmed?: boolean;
  all_buyers_confirmed?: boolean;
}

export default function SellerSalesConfirmed() {
  const router = useRouter();
  const [groupbuys, setGroupbuys] = useState<SalesConfirmedGroupBuy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupBuyId, setSelectedGroupBuyId] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');

  useEffect(() => {
    const fetchSalesConfirmedGroupBuys = async () => {
      try {
        const token = await tokenUtils.getAccessToken();
        if (!token) {
          router.push('/login?callbackUrl=/mypage/seller/sales-confirmed');
          return;
        }
        setAccessToken(token);

        // 판매확정된 공구 목록 조회
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/confirmed/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setGroupbuys(data.map((bid: any) => ({
            id: bid.groupbuy,
            product_name: bid.groupbuy_product_name || bid.product_name || '상품명',
            product_category: bid.product_category || '카테고리',
            bid_amount: bid.amount,
            participants_count: bid.participants_count || 0,
            final_decision: 'confirmed',
            created_at: bid.created_at,
            buyer_confirmed: bid.buyer_confirmed,
            all_buyers_confirmed: bid.all_buyers_confirmed
          })));
        } else {
          throw new Error('데이터 조회 실패');
        }
      } catch (error) {
        console.error('판매확정 목록 조회 오류:', error);
        toast({
          variant: 'destructive',
          title: '조회 실패',
          description: '판매확정 목록을 불러오는 중 오류가 발생했습니다.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalesConfirmedGroupBuys();
  }, [router]);

  const handleGroupBuyClick = (groupBuyId: number) => {
    router.push(`/groupbuys/${groupBuyId}`);
  };

  const handleCompleteTransaction = async (groupBuyId: number) => {
    try {
      const confirmed = confirm('해당 공구의 거래를 완료하시겠습니까?');
      if (!confirmed) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bids/seller/complete-transaction/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ groupbuy_id: groupBuyId })
      });

      if (response.ok) {
        toast({
          title: '거래 완료',
          description: '거래가 성공적으로 완료되었습니다.'
        });
        // 목록 새로고침
        window.location.reload();
      } else {
        throw new Error('거래 완료 처리 실패');
      }
    } catch (error) {
      console.error('거래 완료 처리 오류:', error);
      toast({
        variant: 'destructive',
        title: '처리 실패',
        description: '거래 완료 처리 중 오류가 발생했습니다.'
      });
    }
  };

  const handleNoShowReport = (groupBuyId: number) => {
    router.push(`/noshow-report/create?groupbuy=${groupBuyId}`);
  };

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
        <h1 className="text-2xl font-bold">판매확정</h1>
      </div>

      {groupbuys.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">판매확정된 공구가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupbuys.map((groupbuy) => (
            <Card key={groupbuy.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="cursor-pointer" onClick={() => handleGroupBuyClick(groupbuy.id)}>
                    <CardTitle className="text-lg">{groupbuy.product_name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{groupbuy.product_category}</p>
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-green-300">
                    판매확정
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">최종 견적지원금</p>
                    <p className="font-bold">{groupbuy.bid_amount.toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">참여자 수</p>
                    <p className="font-bold">{groupbuy.participants_count}명</p>
                  </div>
                </div>

                {/* 구매자 확정 상태 표시 */}
                <div className="mb-4">
                  {!groupbuy.all_buyers_confirmed ? (
                    <div className="flex items-center text-sm text-blue-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>구매자 정보 대기중</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-green-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>구매자 전원 확정 완료</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/groupbuys/${groupbuy.id}`}>
                    <Button size="sm" variant="outline">
                      공구보기
                    </Button>
                  </Link>
                  
                  {/* 구매자 정보는 전원이 확정한 후에만 표시 */}
                  {groupbuy.all_buyers_confirmed && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedGroupBuyId(groupbuy.id);
                        setIsContactModalOpen(true);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      구매자 목록 확인하기
                    </Button>
                  )}
                  
                  <Button 
                    size="sm"
                    onClick={() => handleCompleteTransaction(groupbuy.id)}
                  >
                    판매완료
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleNoShowReport(groupbuy.id)}
                  >
                    노쇼 신고하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
          groupBuyId={selectedGroupBuyId}
          accessToken={accessToken}
          isSeller={true}
        />
      )}
    </div>
  );
}