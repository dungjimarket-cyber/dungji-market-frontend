'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tokenUtils } from '@/lib/tokenUtils';
import { toKSTString } from '@/lib/utils';
import { SmartphoneIcon, WifiIcon, MonitorIcon, AlertCircleIcon, CheckCircle2, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { GroupBuySuccessDialog } from '@/components/group-purchase/GroupBuySuccessDialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { getRegions, searchRegionsByName, Region } from '@/lib/api/regionService';
import { getSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';

interface SelectedRegion {
  province: string;
  city: string;
}

interface Product {
  id: number;
  name: string;
  base_price: number;
  category_name: string;
  category?: {
    id: number;
    name: string;
    detail_type: 'none' | 'telecom' | 'electronics' | 'rental' | 'subscription' | 'internet' | 'internet_tv';
  };
  image_url?: string;
  extra_data?: any;
}

interface CreateFormProps {
  mode?: 'create' | 'edit';
  initialData?: any;
  groupBuyId?: string;
}

/**
 * 폼 유효성 검증 스키마
 */
const getFormSchema = (mode: string) => z.object({
  product: mode === 'edit' ? z.string().optional() : z.string().min(1, {
    message: '상품을 선택해주세요',
  }),
  title: z.string().optional().default(''),
  description: z.string().optional(),
  min_participants: z.union([
    z.string().transform(val => parseInt(val, 10) || 1),
    z.number(),
  ]).refine(val => val >= 1 && val <= 10, {
    message: '최소 참여 인원은 1~10명 사이여야 합니다',
  }),
  max_participants: z.union([
    z.string().transform(val => parseInt(val, 10) || 5),
    z.number(),
  ]).refine(val => val >= 1 && val <= 10, {
    message: '최대 참여 인원은 1~10명 사이여야 합니다',
  }),
  end_time_option: z.enum(['slider', 'custom']).optional(),
  sliderHours: z.number().min(6).max(48).optional(),
  end_time: z.string().optional(),
  region: z.string().optional(),
  region_type: z.enum(['local', 'nationwide']).optional(),
  telecom_carrier: z.string().optional(),
  subscription_type: z.string().optional(),
  plan_info: z.string().optional(),
  contract_period: z.string().optional(),
});

type FormData = z.infer<ReturnType<typeof getFormSchema>>;

export default function CreateFormV2({ mode = 'create', initialData, groupBuyId }: CreateFormProps = {}) {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  const router = useRouter();
  
  // 상태 관리
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 탭 관련 상태
  const [mainTab, setMainTab] = useState<'phone' | 'internet' | 'internet_tv'>('phone');
  const [subTab, setSubTab] = useState<'all' | 'samsung' | 'apple' | 'sk' | 'kt' | 'lgu'>('all');
  const [internetSubscriptionType, setInternetSubscriptionType] = useState<'transfer' | 'new'>('transfer');
  
  const [endTimeOption, setEndTimeOption] = useState<string>('24hours');
  const [sliderHours, setSliderHours] = useState<number>(24);
  const [regionType, setRegionType] = useState<'local'|'nationwide'>('local');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // 지역 선택 관련 상태
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  
  // 알림 다이얼로그 상태
  const [showDuplicateProductDialog, setShowDuplicateProductDialog] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  
  // 성공 다이얼로그 상태
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdGroupBuyId, setCreatedGroupBuyId] = useState<number | null>(null);
  const [createdProductName, setCreatedProductName] = useState('');
  const [createdProductImage, setCreatedProductImage] = useState('');
  
  // Form 초기화
  const form = useForm<FormData>({
    resolver: zodResolver(getFormSchema(mode)),
    defaultValues: {
      product: '',
      title: '',
      description: '',
      min_participants: 2,
      max_participants: 10,
      end_time_option: 'slider',
      sliderHours: 24,
      region_type: 'local',
    },
  });

  // 상품 목록 로드
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('상품 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 상품 목록 가져오기
  const getFilteredProducts = () => {
    return products.filter(product => {
      // 메인 탭 필터링
      if (mainTab === 'phone') {
        // 휴대폰은 카테고리명이 '휴대폰'이거나 detail_type이 'telecom'인 경우
        const isPhone = product.category_name === '휴대폰' || 
                       product.category?.detail_type === 'telecom' ||
                       (product.category?.detail_type === 'none' && product.category_name === '휴대폰');
        if (!isPhone) return false;
        
        // 서브 탭 필터링 (휴대폰)
        if (subTab === 'samsung') {
          const name = product.name.toLowerCase();
          return name.includes('갤럭시') || name.includes('galaxy');
        } else if (subTab === 'apple') {
          const name = product.name.toLowerCase();
          return name.includes('아이폰') || name.includes('iphone');
        }
        return true; // 'all' 선택 시 모든 휴대폰 상품
      } else if (mainTab === 'internet') {
        if (!product.category || product.category.detail_type !== 'internet') return false;
        
        // 서브 탭 필터링 (인터넷)
        if (subTab !== 'all' && product.extra_data) {
          const carrier = product.extra_data.carrier;
          if (subTab === 'sk' && carrier !== 'SK') return false;
          if (subTab === 'kt' && carrier !== 'KT') return false;
          if (subTab === 'lgu' && carrier !== 'LGU') return false;
        }
        
        // 가입 유형 필터링
        if (product.extra_data) {
          const subscriptionType = product.extra_data.subscription_type;
          if (internetSubscriptionType === 'transfer' && subscriptionType !== 'transfer') return false;
          if (internetSubscriptionType === 'new' && subscriptionType !== 'new') return false;
        }
        
        return true;
      } else if (mainTab === 'internet_tv') {
        if (!product.category || product.category.detail_type !== 'internet_tv') return false;
        
        // 서브 탭 필터링 (인터넷+TV)
        if (subTab !== 'all' && product.extra_data) {
          const carrier = product.extra_data.carrier;
          if (subTab === 'sk' && carrier !== 'SK') return false;
          if (subTab === 'kt' && carrier !== 'KT') return false;
          if (subTab === 'lgu' && carrier !== 'LGU') return false;
        }
        
        // 가입 유형 필터링
        if (product.extra_data) {
          const subscriptionType = product.extra_data.subscription_type;
          if (internetSubscriptionType === 'transfer' && subscriptionType !== 'transfer') return false;
          if (internetSubscriptionType === 'new' && subscriptionType !== 'new') return false;
        }
        
        return true;
      }
      
      return false;
    });
  };

  // 메인 탭 변경 시 서브 탭 초기화
  const handleMainTabChange = (value: string) => {
    setMainTab(value as 'phone' | 'internet' | 'internet_tv');
    setSubTab('all'); // 서브 탭을 '전체'로 초기화
    form.setValue('product', ''); // 상품 선택 초기화
    setSelectedProduct(null);
  };

  // 공구 제목 자동 생성
  const generateTitle = () => {
    const productName = selectedProduct?.name || '공동구매';
    const regionText = selectedRegion?.name ? `[${selectedRegion.name}]` : '';
    return `${regionText} ${productName}`;
  };

  // 폼 제출 핸들러
  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      // API 호출 로직...
      console.log('폼 제출:', values);
      
      // 성공 시 처리
      setShowSuccessDialog(true);
      setCreatedGroupBuyId(1); // 실제 ID로 대체
      setCreatedProductName(selectedProduct?.name || '');
      setCreatedProductImage(selectedProduct?.image_url || '');
    } catch (error) {
      console.error('공구 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '공구 등록 실패',
        description: '공구 등록 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? '공구 수정' : '공구 등록'}</CardTitle>
          <CardDescription>
            통신상품 공동구매를 등록하여 더 나은 조건을 만들어보세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 메인 탭 */}
              <Tabs value={mainTab} onValueChange={handleMainTabChange}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <SmartphoneIcon className="h-4 w-4" />
                    휴대폰
                  </TabsTrigger>
                  <TabsTrigger value="internet" className="flex items-center gap-2">
                    <WifiIcon className="h-4 w-4" />
                    인터넷
                  </TabsTrigger>
                  <TabsTrigger value="internet_tv" className="flex items-center gap-2">
                    <MonitorIcon className="h-4 w-4" />
                    인터넷+TV
                  </TabsTrigger>
                </TabsList>

                {/* 휴대폰 탭 콘텐츠 */}
                <TabsContent value="phone" className="space-y-4">
                  {/* 서브 탭 - 제조사 */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={subTab === 'all' ? 'default' : 'outline'}
                      onClick={() => setSubTab('all')}
                    >
                      전체
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'samsung' ? 'default' : 'outline'}
                      onClick={() => setSubTab('samsung')}
                    >
                      갤럭시
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'apple' ? 'default' : 'outline'}
                      onClick={() => setSubTab('apple')}
                    >
                      아이폰
                    </Button>
                  </div>

                  {/* 상품 선택 */}
                  <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상품 선택</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const product = products.find(p => p.id.toString() === value);
                            setSelectedProduct(product || null);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="상품을 선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredProducts().map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} ({product.base_price.toLocaleString()}원)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 통신사 선택 */}
                  <FormField
                    control={form.control}
                    name="telecom_carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>통신사</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="통신사 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SKT">SKT</SelectItem>
                            <SelectItem value="KT">KT</SelectItem>
                            <SelectItem value="LGU">LG U+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 가입 유형 */}
                  <FormField
                    control={form.control}
                    name="subscription_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>가입 유형</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="가입 유형 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">신규가입</SelectItem>
                            <SelectItem value="transfer">번호이동</SelectItem>
                            <SelectItem value="change">기기변경</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 요금제 */}
                  <FormField
                    control={form.control}
                    name="plan_info"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>요금제</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="예: 5G 프리미엄 플러스" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* 인터넷 탭 콘텐츠 */}
                <TabsContent value="internet" className="space-y-4">
                  {/* 서브 탭 - 통신사 */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={subTab === 'all' ? 'default' : 'outline'}
                      onClick={() => setSubTab('all')}
                    >
                      전체
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'sk' ? 'default' : 'outline'}
                      onClick={() => setSubTab('sk')}
                    >
                      SK
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'kt' ? 'default' : 'outline'}
                      onClick={() => setSubTab('kt')}
                    >
                      KT
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'lgu' ? 'default' : 'outline'}
                      onClick={() => setSubTab('lgu')}
                    >
                      LGU+
                    </Button>
                  </div>

                  {/* 가입 유형 선택 */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={internetSubscriptionType === 'transfer' ? 'default' : 'outline'}
                        onClick={() => setInternetSubscriptionType('transfer')}
                        className="flex-1"
                      >
                        통신사이동
                      </Button>
                      <Button
                        type="button"
                        variant={internetSubscriptionType === 'new' ? 'default' : 'outline'}
                        onClick={() => setInternetSubscriptionType('new')}
                        className="flex-1"
                      >
                        신규가입
                      </Button>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">가입 유형을 선택해주세요</p>
                          <ul className="mt-1 space-y-1">
                            <li>• 통신사이동: 기존에 이용하던 통신사에서 다른 통신사로 갈아타는 경우</li>
                            <li>• 신규가입: 인터넷 첫 설치 또는 해지 후 재가입</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 상품 선택 */}
                  <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상품 선택</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const product = products.find(p => p.id.toString() === value);
                            setSelectedProduct(product || null);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="상품을 선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredProducts().map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* 인터넷+TV 탭 콘텐츠 */}
                <TabsContent value="internet_tv" className="space-y-4">
                  {/* 서브 탭 - 통신사 */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={subTab === 'all' ? 'default' : 'outline'}
                      onClick={() => setSubTab('all')}
                    >
                      전체
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'sk' ? 'default' : 'outline'}
                      onClick={() => setSubTab('sk')}
                    >
                      SK
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'kt' ? 'default' : 'outline'}
                      onClick={() => setSubTab('kt')}
                    >
                      KT
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'lgu' ? 'default' : 'outline'}
                      onClick={() => setSubTab('lgu')}
                    >
                      LGU+
                    </Button>
                  </div>

                  {/* 가입 유형 선택 */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={internetSubscriptionType === 'transfer' ? 'default' : 'outline'}
                        onClick={() => setInternetSubscriptionType('transfer')}
                        className="flex-1"
                      >
                        통신사이동
                      </Button>
                      <Button
                        type="button"
                        variant={internetSubscriptionType === 'new' ? 'default' : 'outline'}
                        onClick={() => setInternetSubscriptionType('new')}
                        className="flex-1"
                      >
                        신규가입
                      </Button>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">가입 유형을 선택해주세요</p>
                          <ul className="mt-1 space-y-1">
                            <li>• 통신사이동: 기존에 이용하던 통신사에서 다른 통신사로 갈아타는 경우</li>
                            <li>• 신규가입: 인터넷 첫 설치 또는 해지 후 재가입</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 상품 선택 */}
                  <FormField
                    control={form.control}
                    name="product"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>상품 선택</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const product = products.find(p => p.id.toString() === value);
                            setSelectedProduct(product || null);
                          }}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="상품을 선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFilteredProducts().map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* 공통 필드들 */}
              {/* 지역 선택 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">지역 선택</h3>
                <MultiRegionDropdown
                  selectedRegions={selectedRegions}
                  onSelectionChange={setSelectedRegions}
                  maxSelections={3}
                />
              </div>

              {/* 참여 인원 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">참여 인원</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="min_participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>최소 인원</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>최대 인원</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 시간 설정 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">시간 설정 (최소 6시간 - 최대 48시간)</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">마감 시간</span>
                    <span className="text-lg font-medium">{sliderHours}시간 후</span>
                  </div>
                  <Slider
                    min={6}
                    max={48}
                    step={1}
                    value={[sliderHours]}
                    onValueChange={(values) => {
                      setSliderHours(values[0]);
                      form.setValue('sliderHours', values[0]);
                    }}
                  />
                </div>
              </div>

              {/* 제출 버튼 */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  '공구 등록'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 성공 다이얼로그 */}
      {showSuccessDialog && createdGroupBuyId && (
        <GroupBuySuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          groupBuyId={createdGroupBuyId}
          productName={createdProductName}
          productImage={createdProductImage}
        />
      )}

      {/* 중복 상품 다이얼로그 */}
      <AlertDialog open={showDuplicateProductDialog} onOpenChange={setShowDuplicateProductDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{errorDialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}