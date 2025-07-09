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
  const [tokenType, setTokenType] = useState<'standard' | 'premium' | 'unlimited'>('standard');
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // 상품 가격 정보 (실제 서비스에서는 서버에서 가져오거나 환경 변수로 설정)
  const priceInfo = {
    standard: 1000, // 일반 입찰권 가격 (원)
    premium: 2000,  // 프리미엄 입찰권 가격 (원)
    unlimited: 20000 // 무제한 입찰권 가격 (원)
  };

  // 총 가격 계산
  const calculateTotalPrice = () => {
    return tokenType === 'unlimited' ? priceInfo[tokenType] : priceInfo[tokenType] * quantity;
  };

  // 입찰권 정보 로드
  useEffect(() => {
    async function loadBidTokens() {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      
      try {
        setLoading(true);
        const data = await bidTokenService.getBidTokens();
        setBidTokens(data);
      } catch (error) {
        console.error('입찰권 정보 로드 오류:', error);
        toast({
          title: '입찰권 정보 로드 실패',
          description: '입찰권 정보를 불러오는데 문제가 발생했습니다. 다시 시도해주세요.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadBidTokens();
  }, [isAuthenticated, router]);

  // 입찰권 구매 처리
  const handlePurchase = async () => {
    if (quantity <= 0 && tokenType !== 'unlimited') {
      toast({
        title: '유효하지 않은 수량',
        description: '1개 이상의 입찰권을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPurchasing(true);
      const purchaseData: PurchaseBidTokenRequest = {
        token_type: tokenType,
        quantity: tokenType === 'unlimited' ? 1 : quantity
      };

      const result = await bidTokenService.purchaseBidTokens(purchaseData);
      
      // 입찰권 정보 새로고침
      const updatedData = await bidTokenService.getBidTokens();
      setBidTokens(updatedData);
      
      toast({
        title: '입찰권 구매 완료',
        description: `${tokenType === 'unlimited' ? '무제한 입찰권' : 
                      tokenType === 'premium' ? '프리미엄 입찰권' : '일반 입찰권'} 
                      ${tokenType === 'unlimited' ? '' : quantity + '개'} 구매가 완료되었습니다.`,
        variant: 'default',
      });
      
    } catch (error) {
      console.error('입찰권 구매 오류:', error);
      toast({
        title: '입찰권 구매 실패',
        description: '입찰권 구매 과정에서 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  // 입찰권 유형에 따른 정보 텍스트
  const getTokenTypeInfo = (type: string) => {
    switch(type) {
      case 'standard':
        return '일반 입찰권은 공구에 1회 입찰시 사용됩니다.';
      case 'premium':
        return '프리미엄 입찰권은 일반보다 입찰 확률이 높습니다.';
      case 'unlimited':
        return '무제한 입찰권은 30일간 무제한 입찰이 가능합니다.';
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
        <h1 className="text-2xl font-bold">입찰권 관리</h1>
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">나의 입찰권 현황</CardTitle>
            </CardHeader>
            <CardContent>
              {bidTokens && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-2 text-yellow-400" />
                      일반 입찰권
                    </span>
                    <span className="font-semibold">{bidTokens.standard_tokens}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-purple-500" />
                      프리미엄 입찰권
                    </span>
                    <span className="font-semibold">{bidTokens.premium_tokens}개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      무제한 입찰권
                    </span>
                    <span className="font-semibold">{bidTokens.unlimited_tokens}개</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center font-bold">
                    <span>총 보유 입찰권</span>
                    <span>{bidTokens.total_tokens}개</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">최근 구매 내역</h3>
            {bidTokens && bidTokens.recent_purchases.length > 0 ? (
              <div className="space-y-3">
                {bidTokens.recent_purchases.map((purchase) => (
                  <Card key={purchase.id} className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">
                            {purchase.token_type_display} {purchase.quantity}개
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(purchase.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {purchase.total_price.toLocaleString()}원
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                최근 구매 내역이 없습니다.
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">입찰권 구매</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base">입찰권 유형</Label>
                  <RadioGroup
                    value={tokenType}
                    onValueChange={(value) => 
                      setTokenType(value as 'standard' | 'premium' | 'unlimited')}
                    className="grid grid-cols-3 gap-4 mt-2"
                  >
                    <div>
                      <RadioGroupItem
                        value="standard"
                        id="standard"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="standard"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Star className="mb-2 h-5 w-5 text-yellow-400" />
                        <div className="text-center">
                          <p className="font-medium">일반</p>
                          <p className="text-sm text-gray-500">1,000원/개</p>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="premium"
                        id="premium"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="premium"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <CheckCircle className="mb-2 h-5 w-5 text-purple-500" />
                        <div className="text-center">
                          <p className="font-medium">프리미엄</p>
                          <p className="text-sm text-gray-500">2,000원/개</p>
                        </div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="unlimited"
                        id="unlimited"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="unlimited"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Clock className="mb-2 h-5 w-5 text-blue-500" />
                        <div className="text-center">
                          <p className="font-medium">무제한</p>
                          <p className="text-sm text-gray-500">20,000원/30일</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <p className="text-sm text-gray-500 mt-2 flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    {getTokenTypeInfo(tokenType)}
                  </p>
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
                className="w-full"
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
