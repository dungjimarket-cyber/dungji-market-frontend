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
  PurchaseBidTokenRequest 
} from '@/lib/bid-token-service';

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

  // 상품 가격 정보
  const priceInfo = {
    'single': 1990, // 견적이용권 단품 가격 (원)
    'unlimited': 29900 // 무제한 구독제(30일) 가격 (원)
  };

  // 총 가격 계산
  const calculateTotalPrice = () => {
    return tokenType === 'unlimited' ? priceInfo[tokenType] : priceInfo[tokenType] * quantity;
  };

  // 견적이용권 정보 로드
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
      } catch (error) {
        console.error('견적이용권 정보 로드 오류:', error);
        
        // 401 에러인 경우에만 로그인 페이지로 리다이렉트
        if (error instanceof Error && error.message.includes('401')) {
          router.push('/login');
        } else {
          toast({
            title: '견적이용권 정보 로드 실패',
            description: '견적이용권 정보를 불러오는데 문제가 발생했습니다. 다시 시도해주세요.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadBidTokens();
  }, [isAuthenticated, router]);

  // 토스페이먼츠 결제 요청
  const handlePurchase = async () => {
    if (tokenType === 'single' && quantity <= 0) {
      toast({
        title: '유효하지 않은 수량',
        description: '1개 이상의 견적이용권을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPurchasing(true);
      
      // 결제 요청 생성
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dungji_auth_token')}`,
        },
        body: JSON.stringify({
          token_type: tokenType,
          quantity: tokenType === 'unlimited' ? 1 : quantity
        }),
      });

      if (!response.ok) {
        throw new Error('결제 요청 생성 실패');
      }

      const paymentData = await response.json();
      
      // 토스페이먼츠 결제창으로 이동
      // 결제 정보를 세션 스토리지에 저장
      sessionStorage.setItem('payment_order', JSON.stringify(paymentData));
      
      // 결제 페이지로 이동
      router.push(`/payment/checkout?orderId=${paymentData.orderId}`);
      
    } catch (error) {
      console.error('결제 요청 오류:', error);
      toast({
        title: '결제 요청 실패',
        description: '결제 요청 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  // 견적이용권 유형에 따른 정보 텍스트
  const getTokenTypeInfo = (type: string) => {
    switch(type) {
      case 'single':
        return (
          <>
            견적 제안시 이용권 1매가 사용됩니다.<br/>
            구독권 이용시 견적이용권은 차감되지 않습니다.
          </>
        );
      case 'unlimited':
        return (
          <>
            30일간 모든 공구에 무제한 견적 제안이 가능합니다.<br/>
            구독권 이용시 견적이용권은 차감되지 않습니다.
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
                      견적이용권
                    </span>
                    <span className="font-semibold">{bidTokens.single_tokens}개</span>
                  </div>
                  
                  {/* 이용권 만료 예정 (7일 이내) */}
                  <div className="text-sm text-gray-500">
                    이용권 만료 예정 (남은 사용기한 7일 이내)
                  </div>
                  
                  {/* 하드코딩 예시 데이터 */}
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>2025. 12. 10. 사용 기한 만료 예정</span>
                    <span>3개</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
                    <span>2026. 1. 9. 사용 기한 만료 예정</span>
                    <span>5개</span>
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
                    <span>총 보유 견적이용권</span>
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
            <h3 className="text-base font-semibold mb-3">최근 구매 내역</h3>
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
                                ? `견적이용권 ${purchase.quantity}개`
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
                      <Label htmlFor="single">견적이용권</Label>
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
                      <div className="flex items-center mt-1 ml-4">
                        <span className="mr-1">⚠️</span>
                        견적 이용권 사용기한은 90일입니다.
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
            <CardFooter>
              <Button
                className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? '처리 중...' : '구매하기'}
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
