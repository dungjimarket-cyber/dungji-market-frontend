'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Phone, User, Calendar, CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BuyerInfo {
  id: number;
  user: {
    id: number;
    email: string;
    nickname: string;
    phone?: string;
  };
  final_decision: 'pending' | 'confirmed' | 'cancelled';
  final_decision_at?: string;
  is_purchase_completed: boolean;
  purchase_completed_at?: string;
}

interface GroupBuyDetail {
  id: number;
  title: string;
  status: string;
  product_name: string;
  confirmed_buyers_count: number;
  total_participants: number;
}

export default function BuyersPage() {
  const params = useParams();
  const router = useRouter();
  const { user, accessToken, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [buyers, setBuyers] = useState<BuyerInfo[]>([]);
  const [groupBuy, setGroupBuy] = useState<GroupBuyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupBuyId = params.id as string;

  useEffect(() => {
    const fetchBuyersInfo = async () => {
      if (!isAuthenticated || !accessToken) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 판매자만 접근 가능
      if (user?.role !== 'seller') {
        setError('판매자만 접근 가능합니다.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/buyers/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            setError('이 공구의 낙찰 판매자만 접근 가능합니다.');
          } else if (response.status === 404) {
            setError('공구를 찾을 수 없습니다.');
          } else {
            setError('구매자 정보를 불러오는데 실패했습니다.');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setBuyers(data.buyers || []);
        setGroupBuy(data.groupbuy || null);
      } catch (error) {
        console.error('구매자 정보 조회 오류:', error);
        setError('구매자 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuyersInfo();
  }, [groupBuyId, isAuthenticated, accessToken, user]);

  const getFinalDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            구매확정
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            구매포기
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2">로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <h1 className="text-2xl font-bold">구매자 정보</h1>
        </div>
      </div>

      {/* 공구 정보 */}
      {groupBuy && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{groupBuy.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                {groupBuy.product_name}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                구매확정: {groupBuy.confirmed_buyers_count}명 / 전체: {groupBuy.total_participants}명
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 구매자 목록 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-3">구매 확정자 목록</h2>
        
        {buyers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              아직 구매 확정한 사용자가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {buyers.map((buyer) => (
              <Card key={buyer.id} className={
                buyer.final_decision === 'confirmed' 
                  ? 'border-green-200' 
                  : buyer.final_decision === 'cancelled' 
                  ? 'border-red-200' 
                  : ''
              }>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{buyer.user.nickname || buyer.user.email}</p>
                        <p className="text-sm text-gray-500">{buyer.user.email}</p>
                      </div>
                    </div>
                    {getFinalDecisionBadge(buyer.final_decision)}
                  </div>
                  
                  {buyer.final_decision === 'confirmed' && (
                    <>
                      {buyer.user.phone && (
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{buyer.user.phone}</span>
                        </div>
                      )}
                      
                      {buyer.final_decision_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            확정일시: {new Date(buyer.final_decision_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      )}
                      
                      {buyer.is_purchase_completed && buyer.purchase_completed_at && (
                        <div className="mt-2 pt-2 border-t">
                          <span className="text-xs text-green-600">
                            구매완료: {new Date(buyer.purchase_completed_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      <Alert className="mt-6 bg-blue-50 border-blue-200">
        <AlertDescription className="text-sm text-blue-700">
          구매 확정한 고객의 연락처 정보입니다. 개인정보 보호에 유의하여 거래 목적으로만 사용해주세요.
        </AlertDescription>
      </Alert>
    </div>
  );
}