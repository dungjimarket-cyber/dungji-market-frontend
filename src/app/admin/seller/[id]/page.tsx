'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Plus, Minus, Calendar, CreditCard } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Helper function to convert seller category code to label
function getSellerCategoryLabel(category?: string) {
  switch (category) {
    case 'telecom':
      return '통신상품판매(휴대폰,인터넷,TV개통 등)';
    case 'rental':
      return '렌탈서비스판매(정수기,비데,매트리스 등)';
    case 'electronics':
      return '가전제품판매(냉장고,세탁기,컴퓨터 등)';
    default:
      return category || '정보 없음';
  }
}

interface SellerDetail {
  seller: {
    id: string;
    username: string;
    nickname: string;
    email: string;
    phone_number: string;
    seller_category?: string;
    is_business_verified: boolean;
    business_reg_number: string;
    date_joined: string;
  };
  tokens: {
    single_tokens_count: number;
    has_subscription: boolean;
    subscription_expires_at: string | null;
  };
  usage_history: Array<{
    id: string;
    used_at: string;
    bid_id: string | null;
  }>;
  purchase_history: Array<{
    id: string;
    token_type: string;
    quantity: number;
    total_price: number;
    payment_date: string;
  }>;
  adjustment_logs: Array<{
    id: string;
    adjustment_type: string;
    quantity: number;
    reason: string;
    admin_username: string;
    created_at: string;
  }>;
}

export default function SellerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const sellerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [sellerDetail, setSellerDetail] = useState<SellerDetail | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [subscriptionDays, setSubscriptionDays] = useState(30);
  const [subscriptionReason, setSubscriptionReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isGrantingSubscription, setIsGrantingSubscription] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  useEffect(() => {
    loadSellerDetail();
  }, [sellerId]);

  const loadSellerDetail = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dungji_auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/sellers/${sellerId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('판매회원 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSellerDetail(data);
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '데이터 로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustTokens = async () => {
    if (!adjustmentReason.trim()) {
      toast({
        title: '입력 오류',
        description: '조정 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsAdjusting(true);
    try {
      const token = localStorage.getItem('dungji_auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bid-tokens/adjust/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            seller_id: sellerId,
            action: adjustmentType,
            amount: adjustmentQuantity,
            reason: adjustmentReason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '견적티켓 조정에 실패했습니다.');
      }

      const data = await response.json();
      toast({
        title: '성공',
        description: data.message,
      });

      // 상태 초기화 및 데이터 새로고침
      setAdjustmentReason('');
      setAdjustmentQuantity(1);
      setShowAdjustDialog(false);
      await loadSellerDetail();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '견적티켓 조정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleGrantSubscription = async () => {
    if (!subscriptionReason.trim()) {
      toast({
        title: '입력 오류',
        description: '부여 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsGrantingSubscription(true);
    try {
      const token = localStorage.getItem('dungji_auth_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/bid-tokens/grant-subscription/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            seller_id: sellerId,
            days: subscriptionDays,
            reason: subscriptionReason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '구독권 부여에 실패했습니다.');
      }

      const data = await response.json();
      toast({
        title: '성공',
        description: data.message,
      });

      // 상태 초기화 및 데이터 새로고침
      setSubscriptionReason('');
      setSubscriptionDays(30);
      setShowSubscriptionDialog(false);
      await loadSellerDetail();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message || '구독권 부여 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsGrantingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">로딩 중...</span>
      </div>
    );
  }

  if (!sellerDetail || !sellerDetail.seller) {
    return (
      <div className="container mx-auto py-10">
        <p>판매회원 정보를 찾을 수 없습니다.</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Button>
          <h1 className="text-3xl font-bold">판매회원 상세 관리</h1>
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>회원 정보</CardTitle>
          <CardDescription>
            {sellerDetail.seller?.nickname || sellerDetail.seller?.username}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">회원 ID</p>
              <p className="font-medium">{sellerDetail.seller?.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">아이디</p>
              <p className="font-medium">{sellerDetail.seller?.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">이메일</p>
              <p className="font-medium">{sellerDetail.seller?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">전화번호</p>
              <p className="font-medium">{sellerDetail.seller?.phone_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">판매회원 구분</p>
              <p className="font-medium">{getSellerCategoryLabel(sellerDetail.seller?.seller_category)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">사업자번호</p>
              <p className="font-medium">{sellerDetail.seller?.business_reg_number || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">사업자 인증</p>
              <p className="font-medium">
                {sellerDetail.seller?.is_business_verified ? '인증완료' : '미인증'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">가입일</p>
              <p className="font-medium">
                {sellerDetail.seller?.date_joined ? new Date(sellerDetail.seller.date_joined).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 견적티켓 관리 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>견적티켓 현황</CardTitle>
            <CardDescription>현재 보유중인 견적티켓 및 구독권 상태</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">견적티켓 보유수</p>
                  <p className="text-2xl font-bold">{sellerDetail.tokens?.single_tokens_count || 0}개</p>
                </div>
                <Button onClick={() => setShowAdjustDialog(true)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  견적티켓 조정
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">구독권 상태</p>
                  <p className="text-lg font-medium">
                    {sellerDetail.tokens?.has_subscription ? (
                      <>
                        활성 (만료:{' '}
                        {sellerDetail.tokens?.subscription_expires_at ? new Date(sellerDetail.tokens.subscription_expires_at).toLocaleDateString() : '-'})
                      </>
                    ) : (
                      '없음'
                    )}
                  </p>
                </div>
                <Button onClick={() => setShowSubscriptionDialog(true)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  구독권 부여
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
            <CardDescription>자주 사용하는 관리 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAdjustmentType('add');
                  setAdjustmentQuantity(5);
                  setShowAdjustDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                견적티켓 5개 추가
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAdjustmentType('add');
                  setAdjustmentQuantity(10);
                  setShowAdjustDialog(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                견적티켓 10개 추가
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubscriptionDays(30);
                  setShowSubscriptionDialog(true);
                }}
              >
                30일 구독권
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubscriptionDays(7);
                  setShowSubscriptionDialog(true);
                }}
              >
                7일 구독권
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 이력 탭 */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="usage">사용 이력</TabsTrigger>
          <TabsTrigger value="purchase">구매 내역</TabsTrigger>
          <TabsTrigger value="adjustment">조정 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>견적티켓 사용 이력</CardTitle>
              <CardDescription>최근 20건의 사용 내역</CardDescription>
            </CardHeader>
            <CardContent>
              {sellerDetail.usage_history?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">사용일시</th>
                        <th className="text-left py-2">입찰 ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerDetail.usage_history?.map((usage) => (
                        <tr key={usage.id} className="border-b">
                          <td className="py-2">{usage.id}</td>
                          <td className="py-2">
                            {new Date(usage.used_at).toLocaleString()}
                          </td>
                          <td className="py-2">{usage.bid_id || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  사용 이력이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase">
          <Card>
            <CardHeader>
              <CardTitle>견적티켓 구매 내역</CardTitle>
              <CardDescription>최근 20건의 구매 내역</CardDescription>
            </CardHeader>
            <CardContent>
              {sellerDetail.purchase_history?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">ID</th>
                        <th className="text-left py-2">유형</th>
                        <th className="text-left py-2">수량</th>
                        <th className="text-left py-2">금액</th>
                        <th className="text-left py-2">구매일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerDetail.purchase_history?.map((purchase) => (
                        <tr key={purchase.id} className="border-b">
                          <td className="py-2">{purchase.id}</td>
                          <td className="py-2">
                            {purchase.token_type === 'single' ? '견적티켓' : '구독권'}
                          </td>
                          <td className="py-2">{purchase.quantity}</td>
                          <td className="py-2">{purchase.total_price.toLocaleString()}원</td>
                          <td className="py-2">
                            {new Date(purchase.payment_date).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  구매 내역이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustment">
          <Card>
            <CardHeader>
              <CardTitle>견적티켓 조정 이력</CardTitle>
              <CardDescription>관리자에 의한 조정 내역</CardDescription>
            </CardHeader>
            <CardContent>
              {sellerDetail.adjustment_logs?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">조정일시</th>
                        <th className="text-left py-2">유형</th>
                        <th className="text-left py-2">수량</th>
                        <th className="text-left py-2">사유</th>
                        <th className="text-left py-2">관리자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerDetail.adjustment_logs?.map((log) => (
                        <tr key={log.id} className="border-b">
                          <td className="py-2">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-2">
                            {log.adjustment_type === 'add' && '추가'}
                            {log.adjustment_type === 'subtract' && '차감'}
                            {log.adjustment_type === 'grant_subscription' && '구독권 부여'}
                          </td>
                          <td className="py-2">
                            {log.adjustment_type === 'grant_subscription'
                              ? `${log.quantity}일`
                              : `${log.quantity}개`}
                          </td>
                          <td className="py-2">{log.reason}</td>
                          <td className="py-2">{log.admin_username}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  조정 이력이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 견적티켓 조정 다이얼로그 */}
      <AlertDialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>견적티켓 조정</AlertDialogTitle>
            <AlertDialogDescription>
              {sellerDetail.seller?.nickname || sellerDetail.seller?.username}님의 견적티켓을
              조정합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>조정 유형</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('add')}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  추가
                </Button>
                <Button
                  variant={adjustmentType === 'subtract' ? 'default' : 'outline'}
                  onClick={() => setAdjustmentType('subtract')}
                  className="flex-1"
                >
                  <Minus className="mr-2 h-4 w-4" />
                  차감
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="reason">조정 사유</Label>
              <Textarea
                id="reason"
                placeholder="조정 사유를 입력해주세요"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdjustTokens}
              disabled={isAdjusting || !adjustmentReason.trim()}
            >
              {isAdjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리중...
                </>
              ) : (
                '확인'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 구독권 부여 다이얼로그 */}
      <AlertDialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>구독권 부여</AlertDialogTitle>
            <AlertDialogDescription>
              {sellerDetail.seller?.nickname || sellerDetail.seller?.username}님에게 구독권을
              부여합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="days">기간 (일)</Label>
              <Input
                id="days"
                type="number"
                min="1"
                value={subscriptionDays}
                onChange={(e) => setSubscriptionDays(parseInt(e.target.value) || 30)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="sub-reason">부여 사유</Label>
              <Textarea
                id="sub-reason"
                placeholder="구독권 부여 사유를 입력해주세요"
                value={subscriptionReason}
                onChange={(e) => setSubscriptionReason(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGrantSubscription}
              disabled={isGrantingSubscription || !subscriptionReason.trim()}
            >
              {isGrantingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리중...
                </>
              ) : (
                '확인'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}