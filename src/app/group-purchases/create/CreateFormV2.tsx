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
  category_detail_type?: 'none' | 'telecom' | 'electronics' | 'rental' | 'subscription' | 'internet' | 'internet_tv';
  category?: {
    id: number;
    name: string;
    detail_type: 'none' | 'telecom' | 'electronics' | 'rental' | 'subscription' | 'internet' | 'internet_tv';
  };
  image_url?: string;
  extra_data?: {
    carrier?: string;
    subscription_type?: string;
    [key: string]: any;
  };
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
  telecom_plan: z.string().optional(),
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
      min_participants: 1, // 최소 인원은 항상 1로 고정
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
        console.log('Loaded products:', data.length, data);
        console.log('Phone products:', data.filter((p: Product) => p.category_name === '휴대폰'));
        
        // 인터넷/인터넷+TV 상품 상세 분석
        const internetProducts = data.filter((p: Product) => 
          p.category_detail_type === 'internet' || p.category?.detail_type === 'internet'
        );
        const internetTvProducts = data.filter((p: Product) => 
          p.category_detail_type === 'internet_tv' || p.category?.detail_type === 'internet_tv'
        );
        
        console.log('Internet products:', internetProducts.length, internetProducts.map((p: Product) => ({
          name: p.name,
          category_detail_type: p.category_detail_type,
          category: p.category,
          extra_data: p.extra_data
        })));
        
        console.log('Internet+TV products:', internetTvProducts.length, internetTvProducts.map((p: Product) => ({
          name: p.name,
          category_detail_type: p.category_detail_type,
          category: p.category,
          extra_data: p.extra_data
        })));
        
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
    const filtered = products.filter(product => {
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
        // category_detail_type 필드를 직접 체크 (API가 category를 ID로 반환하는 경우)
        const isInternet = product.category_detail_type === 'internet' || 
                          product.category?.detail_type === 'internet';
        if (!isInternet) return false;
        
        // 서브 탭 필터링 (인터넷) - carrier 정보 확인
        if (subTab !== 'all') {
          let carrierInfo = '';
          
          // 1. extra_data에서 carrier 정보 확인
          if (product.extra_data && product.extra_data.carrier) {
            carrierInfo = product.extra_data.carrier.toUpperCase();
          } else {
            // 2. 상품명에서 통신사 정보 추출
            const productName = product.name.toUpperCase();
            if (productName.includes('SK') || productName.includes('SK브로드밴드')) {
              carrierInfo = 'SK';
            } else if (productName.includes('KT')) {
              carrierInfo = 'KT';
            } else if (productName.includes('LG') || productName.includes('LGU')) {
              carrierInfo = 'LG';
            }
          }
          
          const normalizedSubTab = subTab.toUpperCase();
          
          // 각 통신사별 매칭 로직 (다양한 표기법 지원)
          if (normalizedSubTab === 'SK' && !['SK', 'SKT', 'SK브로드밴드'].includes(carrierInfo)) return false;
          if (normalizedSubTab === 'KT' && !['KT', 'KT텔레콤'].includes(carrierInfo)) return false;
          if (normalizedSubTab === 'LGU' && !['LGU', 'LG', 'LG유플러스', 'LG U+'].includes(carrierInfo)) return false;
        }
        
        // 가입 유형 필터링 - extra_data와 subscription_type이 있는 경우만 필터링
        if (product.extra_data && product.extra_data.subscription_type) {
          const subscriptionType = product.extra_data.subscription_type;
          if (internetSubscriptionType === 'transfer' && subscriptionType !== 'transfer') return false;
          if (internetSubscriptionType === 'new' && subscriptionType !== 'new') return false;
        }
        
        return true;
      } else if (mainTab === 'internet_tv') {
        // category_detail_type 필드를 직접 체크 (API가 category를 ID로 반환하는 경우)
        const isInternetTV = product.category_detail_type === 'internet_tv' || 
                            product.category?.detail_type === 'internet_tv';
        if (!isInternetTV) return false;
        
        // 서브 탭 필터링 (인터넷+TV) - carrier 정보 확인
        if (subTab !== 'all') {
          let carrierInfo = '';
          
          // 1. extra_data에서 carrier 정보 확인
          if (product.extra_data && product.extra_data.carrier) {
            carrierInfo = product.extra_data.carrier.toUpperCase();
          } else {
            // 2. 상품명에서 통신사 정보 추출
            const productName = product.name.toUpperCase();
            if (productName.includes('SK') || productName.includes('SK브로드밴드')) {
              carrierInfo = 'SK';
            } else if (productName.includes('KT')) {
              carrierInfo = 'KT';
            } else if (productName.includes('LG') || productName.includes('LGU')) {
              carrierInfo = 'LG';
            }
          }
          
          const normalizedSubTab = subTab.toUpperCase();
          
          // 각 통신사별 매칭 로직 (다양한 표기법 지원)
          if (normalizedSubTab === 'SK' && !['SK', 'SKT', 'SK브로드밴드'].includes(carrierInfo)) return false;
          if (normalizedSubTab === 'KT' && !['KT', 'KT텔레콤'].includes(carrierInfo)) return false;
          if (normalizedSubTab === 'LGU' && !['LGU', 'LG', 'LG유플러스', 'LG U+'].includes(carrierInfo)) return false;
        }
        
        // 가입 유형 필터링 - extra_data와 subscription_type이 있는 경우만 필터링
        if (product.extra_data && product.extra_data.subscription_type) {
          const subscriptionType = product.extra_data.subscription_type;
          if (internetSubscriptionType === 'transfer' && subscriptionType !== 'transfer') return false;
          if (internetSubscriptionType === 'new' && subscriptionType !== 'new') return false;
        }
        
        return true;
      }
      
      return false;
    });
    
    console.log(`Filtered products for ${mainTab}/${subTab}/${internetSubscriptionType}:`, filtered.length, filtered);
    
    // 디버깅: 인터넷/인터넷+TV 탭에서 carrier 정보 확인
    if ((mainTab === 'internet' || mainTab === 'internet_tv')) {
      const allInternetProducts = products.filter(p => 
        (mainTab === 'internet' && (p.category_detail_type === 'internet' || p.category?.detail_type === 'internet')) ||
        (mainTab === 'internet_tv' && (p.category_detail_type === 'internet_tv' || p.category?.detail_type === 'internet_tv'))
      );
      
      console.log(`All ${mainTab} products:`, allInternetProducts.map((p: Product) => ({
        name: p.name,
        category_detail_type: p.category_detail_type,
        category: p.category,
        extra_data_carrier: p.extra_data?.carrier,
        extracted_carrier: extractCarrierFromName(p.name)
      })));
      
      console.log(`Filtered ${mainTab} products for ${subTab}:`, filtered.map((p: Product) => ({
        name: p.name,
        carrier: p.extra_data?.carrier
      })));
    }
    
    return filtered;
  };

  // 상품명에서 통신사 정보 추출하는 헬퍼 함수
  const extractCarrierFromName = (productName: string): string => {
    const name = productName.toUpperCase();
    if (name.includes('SK') || name.includes('SK브로드밴드')) return 'SK';
    if (name.includes('KT')) return 'KT';
    if (name.includes('LG') || name.includes('LGU')) return 'LG';
    return '';
  };

  // 메인 탭 변경 시 서브 탭 초기화
  const handleMainTabChange = (value: string) => {
    setMainTab(value as 'phone' | 'internet' | 'internet_tv');
    setSubTab('all'); // 서브 탭을 '전체'로 초기화
    setInternetSubscriptionType('transfer'); // 인터넷 가입 유형도 초기화
    form.setValue('product', ''); // 상품 선택 초기화
    setSelectedProduct(null);
  };

  // 서브 탭 변경 시 상품 선택 초기화
  const handleSubTabChange = (value: string) => {
    setSubTab(value as 'all' | 'samsung' | 'apple' | 'sk' | 'kt' | 'lgu');
    form.setValue('product', ''); // 상품 선택 초기화
    setSelectedProduct(null);
  };

  // 인터넷 가입 유형 변경 시 상품 선택 초기화
  const handleInternetSubscriptionTypeChange = (value: 'transfer' | 'new') => {
    setInternetSubscriptionType(value);
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
      // 데이터 유효성 검증
      if (!selectedProduct) {
        toast({
          variant: 'destructive',
          title: '상품 선택 필요',
          description: '공구에 등록할 상품을 선택해주세요.',
        });
        setIsSubmitting(false);
        return;
      }

      // 지역 선택은 선택사항으로 변경 (기존 폼과 동일하게)
      // if (selectedRegions.length === 0) {
      //   toast({
      //     variant: 'destructive',
      //     title: '지역 선택 필요',
      //     description: '최소 1개 이상의 지역을 선택해주세요.',
      //   });
      //   setIsSubmitting(false);
      //   return;
      // }

      // 종료 시간 계산
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + sliderHours);

      // 상품 상세 정보 구성 (기존 폼과 동일한 구조)
      let productDetails = {};
      
      if (mainTab === 'phone') {
        // 휴대폰: telecom 카테고리로 처리
        const getSubscriptionTypeKorean = (type: string): string => {
          switch (type) {
            case 'new': return '신규가입';
            case 'transfer': return '번호이동';
            case 'change': return '기기변경';
            default: return '';
          }
        };
        
        productDetails = {
          telecom_carrier: values.telecom_carrier || '',
          telecom_plan: values.telecom_plan || '',
          subscription_type: values.subscription_type || '',
          subscription_type_korean: getSubscriptionTypeKorean(values.subscription_type || ''),
          contract_period: '24개월' // 약정기간 24개월로 고정
        };
      } else if (mainTab === 'internet' || mainTab === 'internet_tv') {
        // 인터넷/인터넷+TV: 서브탭에서 통신사 정보 매핑
        const getCarrierFromSubTab = (subTab: string): string => {
          switch (subTab.toLowerCase()) {
            case 'sk': return 'SK';
            case 'kt': return 'KT';
            case 'lgu': return 'LG U+';
            default: return '';
          }
        };
        
        const getSubscriptionTypeKorean = (type: string): string => {
          switch (type) {
            case 'transfer': return '통신사이동';
            case 'new': return '신규가입';
            default: return '';
          }
        };
        
        productDetails = {
          telecom_carrier: getCarrierFromSubTab(subTab),
          subscription_type: internetSubscriptionType || '',
          subscription_type_korean: getSubscriptionTypeKorean(internetSubscriptionType || ''),
          contract_period: '36개월' // 인터넷은 약정기간 36개월로 고정
        };
      }

      // 빈 값 제거
      const cleanProductDetails: Record<string, any> = {};
      Object.entries(productDetails).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanProductDetails[key] = value;
        }
      });

      // API 전송 데이터 구성 (기존 폼과 동일한 구조)
      const submitData = {
        product: parseInt(values.product || '0'),
        title: values.title || generateTitle(),
        description: values.description || '',
        min_participants: 1, // 항상 1로 고정
        max_participants: parseInt(values.max_participants?.toString() || '10'),
        end_time: endTime.toISOString(),
        regions: selectedRegions.map(region => ({
          province: region.province,
          city: region.city
        })),
        product_details: cleanProductDetails
      };
      
      console.log('폼 제출 데이터:', submitData);

      // API 호출 - useAuth 훅 사용
      if (!user || !accessToken) {
        toast({
          variant: 'destructive',
          title: '인증 오류',
          description: '로그인이 필요합니다.',
        });
        setIsSubmitting(false);
        router.push('/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 오류:', errorData);
        
        // 특정 오류 메시지 처리
        let errorMessage = '공구 등록 중 오류가 발생했습니다.';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.product && Array.isArray(errorData.product)) {
          // 상품 관련 validation 오류 처리
          errorMessage = errorData.product[0];
        } else if (typeof errorData === 'object') {
          // 다른 field validation 오류들 처리
          const firstErrorField = Object.keys(errorData)[0];
          const firstError = errorData[firstErrorField];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else {
            errorMessage = firstError;
          }
        }

        // 중복 오류인 경우 전용 팝업 표시
        if (errorMessage.includes('중복') || errorMessage.includes('이미 존재') || 
            errorMessage.includes('duplicate') || errorMessage.includes('already exists') ||
            errorMessage.includes('제한') || errorMessage.includes('공구등록이 제한') ||
            errorMessage.includes('같은 상품') || errorMessage.includes('동일한 상품') ||
            errorMessage.includes('이미 해당 상품으로 진행 중인') || errorMessage.includes('진행 중인 공동구매가 있습니다')) {
          setErrorDialogTitle('중복 상품 등록 제한');
          setErrorDialogMessage(`${errorMessage}\n\n해당 상품으로는 이미 공동구매가 진행중입니다. 다른 상품을 선택해주세요.`);
          setShowDuplicateProductDialog(true);
        } else {
          // 일반 오류인 경우 토스트 메시지 표시
          toast({
            variant: 'destructive',
            title: '공구 등록 실패',
            description: errorMessage,
          });
        }
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      console.log('공구 등록 성공:', result);
      
      // 성공 시 처리
      setCreatedGroupBuyId(result.id);
      setCreatedProductName(selectedProduct?.name || '');
      setCreatedProductImage(selectedProduct?.image_url || '');
      setShowSuccessDialog(true);

    } catch (error) {
      console.error('공구 등록 실패:', error);
      toast({
        variant: 'destructive',
        title: '공구 등록 실패',
        description: error instanceof Error ? error.message : '공구 등록 중 오류가 발생했습니다.',
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
                      onClick={() => handleSubTabChange('all')}
                    >
                      전체
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'samsung' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('samsung')}
                    >
                      갤럭시
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'apple' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('apple')}
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
                          <SelectContent className="max-h-[300px] overflow-y-auto">
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
                          <SelectContent className="max-h-[200px] overflow-y-auto">
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
                          <SelectContent className="max-h-[200px] overflow-y-auto">
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
                    name="telecom_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>요금제</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="요금제 선택" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] overflow-y-auto">
                            <SelectItem value="5G_standard">5만원대</SelectItem>
                            <SelectItem value="5G_basic_plus">6만원대</SelectItem>
                            <SelectItem value="5G_premium">7만원대</SelectItem>
                            <SelectItem value="5G_premium_plus">8만원대</SelectItem>
                            <SelectItem value="5G_special">9만원대</SelectItem>
                            <SelectItem value="5G_platinum">10만원이상</SelectItem>
                          </SelectContent>
                        </Select>
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
                      onClick={() => handleSubTabChange('all')}
                    >
                      전체
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'sk' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('sk')}
                    >
                      SK
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'kt' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('kt')}
                    >
                      KT
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'lgu' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('lgu')}
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
                        onClick={() => handleInternetSubscriptionTypeChange('transfer')}
                        className="flex-1"
                      >
                        통신사이동
                      </Button>
                      <Button
                        type="button"
                        variant={internetSubscriptionType === 'new' ? 'default' : 'outline'}
                        onClick={() => handleInternetSubscriptionTypeChange('new')}
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
                          <SelectContent className="max-h-[300px] overflow-y-auto">
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
                      onClick={() => handleSubTabChange('all')}
                    >
                      전체
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'sk' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('sk')}
                    >
                      SK
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'kt' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('kt')}
                    >
                      KT
                    </Button>
                    <Button
                      type="button"
                      variant={subTab === 'lgu' ? 'default' : 'outline'}
                      onClick={() => handleSubTabChange('lgu')}
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
                        onClick={() => handleInternetSubscriptionTypeChange('transfer')}
                        className="flex-1"
                      >
                        통신사이동
                      </Button>
                      <Button
                        type="button"
                        variant={internetSubscriptionType === 'new' ? 'default' : 'outline'}
                        onClick={() => handleInternetSubscriptionTypeChange('new')}
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
                          <SelectContent className="max-h-[300px] overflow-y-auto">
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
                {/* 지역 선택 안내 텍스트 */}
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <div className="text-sky-800">
                    <h4 className="font-medium mb-2">가까운 판매자를 만나보세요</h4>
                    <p className="text-sm text-sky-700">
                      원하는 지역 최대3곳을 선택하면, 해당 지역 판매자가 견적을 제안해 드립니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 참여 인원 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">참여 인원</h3>
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
              <Button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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