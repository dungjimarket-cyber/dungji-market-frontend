'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import bidTokenService, { 
  BidTokenResponse, 
  BidTokenPurchase, 
  PurchaseBidTokenRequest,
  PendingPayment
} from '@/lib/bid-token-service';
import { inicisService } from '@/lib/api/inicisService';

export default function BidTokensPage() {
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [bidTokens, setBidTokens] = useState<BidTokenResponse | null>(null);
  const [tokenType, setTokenType] = useState<'single' | 'unlimited'>('single');
  const [quantity, setQuantity] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // 입금 대기 중인 결제 내역을 위한 state
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);

  // 입금 대기 중인 결제 내역 로드
  const loadPendingPayments = async () => {
    try {
      const payments = await bidTokenService.getPendingPayments();
      setPendingPayments(payments);
    } catch (error) {
      console.error('입금 대기 내역 로드 실패:', error);
    }
  };

  // 상품 가격 정보
  const priceInfo = {
    'single': 1990, // 견적 이용권 단품 가격 (원)
    'unlimited': 29900 // 무제한 구독제(30일) 가격 (원)
  };

  // 총 가격 계산
  const calculateTotalPrice = () => {
    return tokenType === 'unlimited' ? priceInfo[tokenType] : priceInfo[tokenType] * quantity;
  };

  // 결제 검증 함수
  const verifyPayment = async (orderId: string) => {
    try {
      // URL 파라미터에서 추가 정보 가져오기
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('authToken');
      const authResultCode = params.get('authResultCode');
      const tid = params.get('tid');
      const authUrl = params.get('authUrl');
      
      // 추가 파라미터들도 수집 (가상계좌 관련)
      const allParams: any = {};
      for (const [key, value] of params) {
        allParams[key] = value;
      }
      
      console.log('결제 검증 요청:', {
        orderId,
        authToken: authToken ? '있음' : '없음',
        authResultCode,
        tid,
        authUrl,
        allParams
      });
      
      const requestData = {
        orderId,
        authToken,
        authResultCode,
        tid,
        ...(authUrl && { authUrl }), // authUrl이 있으면 추가
        allParams // 모든 파라미터 전달
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/inicis/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('결제 검증 성공:', result);
        
        // 가상계좌 결제인 경우 별도 처리
        if (result.is_vbank) {
          toast({
            title: '무통장입금 안내',
            description: result.message || '가상계좌가 발급되었습니다. 입금 후 이용권이 지급됩니다.',
            duration: 8000, // 조금 더 길게 표시
          });
          
          // 입금 대기 목록 새로고침
          await loadPendingPayments();
        } else {
          // 일반 결제 성공
          toast({
            title: '결제 성공',
            description: result.is_subscription 
              ? '결제가 완료되었습니다. 구독권이 지급되었습니다.'
              : `결제가 완료되었습니다. 견적이용권 ${result.token_count}개가 지급되었습니다.`,
          });
          
          // 견적이용권 정보 새로고침 (즉시 지급된 경우만)
          const data = await bidTokenService.getBidTokens();
          setBidTokens(data);
        }
        
        // URL 파라미터 제거
        window.history.replaceState({}, '', '/mypage/seller/bid-tokens');
      } else {
        const errorData = await response.json().catch(() => ({ error: '결제 검증 실패' }));
        throw new Error(errorData.error || '결제 검증 실패');
      }
    } catch (error) {
      console.error('결제 검증 실패:', error);
      toast({
        title: '결제 검증 실패',
        description: '결제 검증 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 견적 이용권 정보 로드
  useEffect(() => {
    async function loadBidTokens() {
      // 인증 상태가 확정되지 않았으면 대기
      if (isAuthenticated === undefined) {
        return;
      }
      
      // 인증되지 않은 경우에만 리다이렉트
      // 토큰이 로컬스토리지에 있는지도 체크
      const token = localStorage.getItem('dungji_auth_token');
      if (isAuthenticated === false && !token) {
        router.push('/login');
        return;
      }
      
      try {
        setLoading(true);
        const data = await bidTokenService.getBidTokens();
        setBidTokens(data);
        
        // 입금 대기 내역도 함께 로드
        await loadPendingPayments();
      } catch (error) {
        console.error('견적 이용권 정보 로드 오류:', error);
        
        // 401 에러인 경우에만 로그인 페이지로 리다이렉트
        if (error instanceof Error && error.message.includes('401')) {
          router.push('/login');
        } else {
          toast({
            title: '견적 이용권 정보 로드 실패',
            description: '견적 이용권 정보를 불러오는데 문제가 발생했습니다. 다시 시도해주세요.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadBidTokens();
    
    // 결제 완료 후 리디렉션 처리
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const orderId = params.get('orderId');
    const message = params.get('msg');
    
    if (paymentStatus === 'success' && orderId) {
      // 결제 검증 API 호출
      verifyPayment(orderId);
    } else if (paymentStatus === 'failed') {
      toast({
        title: '결제 실패',
        description: message || '결제가 실패했습니다.',
        variant: 'destructive',
      });
      // URL 파라미터 제거
      window.history.replaceState({}, '', '/mypage/seller/bid-tokens');
    } else if (paymentStatus === 'cancelled') {
      toast({
        title: '결제 취소',
        description: '결제가 취소되었습니다.',
        variant: 'destructive',
      });
      // URL 파라미터 제거
      window.history.replaceState({}, '', '/mypage/seller/bid-tokens');
    }
  }, [isAuthenticated, router]);

  // 이니시스 결제 요청
  const handlePurchase = async () => {
    if (tokenType === 'single' && quantity <= 0) {
      toast({
        title: '유효하지 않은 수량',
        description: '1개 이상의 견적 이용권을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPurchasing(true);
      
      const totalPrice = calculateTotalPrice();
      const productName = tokenType === 'unlimited' 
        ? '견적이용권 무제한 (30일)' 
        : `견적이용권 ${quantity}개`;
      
      const paymentParams = {
        orderId: `${user?.id || 'guest'}_${Date.now()}`,
        productName,
        amount: totalPrice,
        buyerName: user?.nickname || user?.username || '구매자',
        buyerTel: user?.phone_number || '010-0000-0000',
        buyerEmail: user?.email || 'buyer@example.com',
        returnUrl: `${window.location.origin}/payment/inicis/return`,
        closeUrl: `${window.location.origin}/payment/inicis/close`,
      };
      
      console.log('PC 결제 시작:', paymentParams);
      
      // 이니시스 결제 요청
      await inicisService.requestPayment(paymentParams);
      
      console.log('PC 결제 요청 완료');
      
    } catch (error) {
      console.error('결제 요청 실패:', error);
      toast({
        title: '결제 실패',
        description: '결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };
  

  // 견적 이용권 유형에 따른 정보 텍스트
  const getTokenTypeInfo = (type: string) => {
    switch(type) {
      case 'single':
        return (
          <>
            견적 제안시 이용권 1매가 사용됩니다.<br/>
            구독권 이용시 견적 이용권은 차감되지 않습니다.
          </>
        );
      case 'unlimited':
        return (
          <>
            30일간 모든 공구에 무제한 견적 제안이 가능합니다.<br/>
            구독권 이용시 견적 이용권은 차감되지 않습니다.
          </>
        );
      default:
        return '';
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">견적 이용권 현황</h1>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">내 이용권</CardTitle>
            </CardHeader>
            <CardContent>
              {bidTokens && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      견적 이용권
                    </span>
                    <span className="font-semibold">{bidTokens.single_tokens}개</span>
                  </div>
                  
                  {/* 이용권 만료 예정 (7일 이내) */}
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-500">
                      이용권 만료 예정 (남은 사용기한 7일 이내)
                    </div>
                    
                    {bidTokens.expiring_tokens && bidTokens.expiring_tokens.length > 0 ? (
                      <div className="space-y-1">
                        {bidTokens.expiring_tokens.map((token, index) => (
                          <div key={index} className="text-[10px] text-orange-600">
                            • {new Date(token.expires_at).toLocaleDateString()} 만료 ({token.days_remaining}일 남음): {token.quantity}개
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400">
                        만료 예정인 이용권이 없습니다.
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      무제한 이용권 구독(30일)
                    </span>
                    <span className="font-semibold">{bidTokens.unlimited_subscription ? '활성화' : '비활성화'}</span>
                  </div>
                  {bidTokens.unlimited_subscription && bidTokens.unlimited_expires_at && (
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>만료일</span>
                      <span>{new Date(bidTokens.unlimited_expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center font-bold">
                    <span>총 보유 견적 이용권</span>
                    <span>
                      {bidTokens.unlimited_subscription ? (
                        <span className="flex items-center">
                          <span className="text-blue-600 mr-1">무제한</span> 
                          <span className="text-sm text-gray-500">(구독중)</span>
                        </span>
                      ) : (
                        `${bidTokens.total_tokens}개`
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">구매 내역</TabsTrigger>
                <TabsTrigger value="pending">
                  입금 대기
                  {pendingPayments.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {pendingPayments.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="history" className="mt-4">
                {bidTokens && bidTokens.recent_purchases.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {bidTokens.recent_purchases
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((purchase) => (
                        <Card key={purchase.id} className="bg-slate-50">
                          <CardContent className="p-3">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-sm font-medium">
                                  {purchase.token_type === 'single' || purchase.token_type_display?.includes('단품') 
                                    ? `견적 이용권 ${purchase.quantity}개`
                                    : purchase.token_type === 'unlimited' || purchase.token_type_display?.includes('무제한')
                                    ? '무제한 구독권'
                                    : `${purchase.token_type_display} ${purchase.quantity}개`
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(purchase.purchase_date).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-sm font-semibold">
                                {purchase.total_price.toLocaleString()}원
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {bidTokens.recent_purchases.length > itemsPerPage && (
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          이전
                        </Button>
                        <span className="text-sm flex items-center px-3">
                          {currentPage} / {Math.ceil(bidTokens.recent_purchases.length / itemsPerPage)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(bidTokens.recent_purchases.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.ceil(bidTokens.recent_purchases.length / itemsPerPage)}
                        >
                          다음
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    최근 구매 내역이 없습니다.
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="pending" className="mt-4">
                {pendingPayments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingPayments.map((payment) => (
                      <Card key={payment.id} className="bg-yellow-50 border-yellow-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-semibold text-yellow-800">
                                {payment.product_name}
                              </p>
                              <p className="text-xs text-gray-600">
                                주문번호: {payment.order_id}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                              <span className="text-sm text-yellow-700">입금 대기</span>
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-md border">
                            <h4 className="text-sm font-semibold mb-2 text-gray-800">무통장 입금 정보</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">은행</span>
                                <span className="font-medium">{payment.vbank_name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">계좌번호</span>
                                <span className="font-medium font-mono">{payment.vbank_num}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">예금주</span>
                                <span className="font-medium">{payment.vbank_holder}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">입금금액</span>
                                <span className="font-bold text-red-600">{payment.amount.toLocaleString()}원</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">입금기한</span>
                                <span className="font-medium text-red-600">
                                  {new Date(payment.vbank_date).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              결제 요청: {new Date(payment.created_at).toLocaleString()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadPendingPayments()}
                              className="text-xs"
                            >
                              상태 새로고침
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      입금 대기 중인 결제가 없습니다.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">이용권 구매</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <RadioGroup
                    value={tokenType}
                    onValueChange={(value) => 
                      setTokenType(value as 'single' | 'unlimited')}
                    className="grid grid-cols-3 gap-4 mt-2"
                  >
                    <div>
                      <RadioGroupItem
                        value="single"
                        id="single"
                      />
                      <Label htmlFor="single">견적 이용권</Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="unlimited"
                        id="unlimited"
                      />
                      <Label htmlFor="unlimited">무제한 구독권(30일)</Label>
                    </div>
                  </RadioGroup>

                  <div className="text-xs text-gray-500 mt-2">
                    <div className="flex items-start">
                      <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                      <div>{getTokenTypeInfo(tokenType)}</div>
                    </div>
                    {tokenType === 'single' && (
                      <div className="flex items-start mt-2">
                        <span className="mr-1">⚠️</span>
                        <span>견적 이용권 사용기한은 90일 입니다.</span>
                      </div>
                    )}
                  </div>
                </div>

                {tokenType !== 'unlimited' && (
                  <div>
                    <Label htmlFor="quantity" className="text-base">수량</Label>
                    <div className="flex items-center mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-10 w-10"
                      >
                        -
                      </Button>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="h-10 w-20 text-center mx-2"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-10 w-10"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">단가</span>
                    <span>{priceInfo[tokenType].toLocaleString()}원</span>
                  </div>
                  
                  {tokenType !== 'unlimited' && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">수량</span>
                      <span>{quantity}개</span>
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>총 결제금액</span>
                    <span>{calculateTotalPrice().toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              {/* 무통장 입금 안내 */}
              <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h4 className="text-sm font-semibold text-blue-800">무통장입금 계좌 안내</h4>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">입금 은행:</span>
                    <span className="font-mono">신한은행</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">계좌번호:</span>
                    <span className="font-mono">110-123-456789</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">예금주:</span>
                    <span>둥지마켓</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
                    💡 카드/계좌이체 결제 시 즉시 완료되며, 무통장입금 선택 시 위 계좌로 입금하시면 됩니다.
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? '처리 중...' : '구매하기 (카드/계좌이체/무통장입금)'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-10" />
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Skeleton className="h-6 w-36 mb-3" />
            {[1, 2].map(i => (
              <Card key={i} className="mb-3">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 rounded-md" />
                  ))}
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="bg-slate-50 p-4 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
