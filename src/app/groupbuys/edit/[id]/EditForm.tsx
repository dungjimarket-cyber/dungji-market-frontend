'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { tokenUtils } from '@/lib/tokenUtils';
import { SmartphoneIcon, TvIcon, BoxIcon, CreditCardIcon, AlertCircleIcon, CheckCircle2, AlertTriangleIcon, MapPinIcon, SearchIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';

// 기존 CreateForm에서 가져온 인터페이스 및 스키마
interface Product {
  id: number;
  name: string;
  base_price: number;
  category_name: string;
  category?: {
    id: number;
    name: string;
    detail_type: 'none' | 'telecom' | 'electronics' | 'rental' | 'subscription';
  };
  image_url?: string;
}

// 그룹구매 데이터 인터페이스
interface GroupBuy {
  id: number;
  title: string;
  description?: string;
  min_participants: number;
  max_participants: number;
  current_participants: number;
  end_time: string;
  status: string;
  creator: number;
  product: {
    id: number;
    name: string;
    base_price: number;
    category_name: string;
    category?: {
      id: number;
      name: string;
      detail_type: 'none' | 'telecom' | 'electronics' | 'rental' | 'subscription';
    };
    image_url?: string;
  };
  region_name?: string;
  region_code?: string;
  region_type: 'local' | 'nationwide';
  telecom?: string;
  telecom_carrier?: string;
  telecom_plan?: string;
  purchase_type?: string;
  plan_price?: string;
  subscription_type?: string;
  manufacturer?: string;
  warranty?: string;
  warranty_period?: string;
  rental_period?: string;
  billing_cycle?: string;
  payment_cycle?: string;
}

// 폼 데이터 인터페이스
interface FormData {
  product: string;
  title: string;
  description?: string;
  min_participants: number;
  max_participants: number;
  end_time_option: string;
  end_time: string;
  sliderHours?: number;
  customHours?: number;
  region_type: string;
  region?: string;
  region_name?: string;
  selected_regions?: {
    code: string;
    name: string;
    full_name?: string;
    level?: number;
  }[];
  code: string;
  name: string;
  full_name?: string;
  level?: number;
  product_category?: string;
  telecom?: string;
  telecom_carrier?: string;
  telecom_plan?: string;
  purchase_type?: string;
  plan_price?: string;
  subscription_type?: string;
  manufacturer?: string;
  warranty?: string;
  warranty_period?: string;
  rental_period?: string;
  billing_cycle?: string;
  payment_cycle?: string;
}

// 폼 유효성 검증 스키마
const formSchema = z.object({
  product: z.string().min(1, { message: '상품을 선택해주세요' }),
  title: z.string().min(5, { message: '제목은 최소 5자 이상이어야 합니다' }).max(100, { message: '제목은 최대 100자까지 가능합니다' }),
  description: z.string().optional(),
  min_participants: z.number().min(1, { message: '최소 참여자 수는 1명 이상이어야 합니다' }),
  max_participants: z.number().min(1, { message: '최대 참여자 수는 1명 이상이어야 합니다' }),
  end_time_option: z.string(),
  end_time: z.string(),
  sliderHours: z.number().optional(),
  customHours: z.number().optional(),
  region_type: z.string(),
  region: z.string().optional(),
  region_name: z.string().optional(),
  telecom: z.string().optional(),
  telecom_carrier: z.string().optional(),
  telecom_plan: z.string().optional(),
  purchase_type: z.string().optional(),
  plan_price: z.string().optional(),
  subscription_type: z.string().optional(),
  manufacturer: z.string().optional(),
  warranty: z.string().optional(),
  warranty_period: z.string().optional(),
  rental_period: z.string().optional(),
  billing_cycle: z.string().optional(),
  payment_cycle: z.string().optional(),
});

// 카테고리별 배경색 클래스를 반환하는 함수
const getCategoryColorClass = (categoryType?: string): string => {
  switch (categoryType) {
    case 'telecom':
      return 'bg-blue-50 border-blue-200';
    case 'electronics':
      return 'bg-green-50 border-green-200';
    case 'rental':
      return 'bg-orange-50 border-orange-200';
    case 'subscription':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

// 카테고리 레이블을 반환하는 함수
const getCategoryLabel = (categoryType?: string): string => {
  switch (categoryType) {
    case 'telecom':
      return '통신';
    case 'electronics':
      return '가전/전자';
    case 'rental':
      return '렌탈';
    case 'subscription':
      return '구독';
    default:
      return '일반';
  }
};

// 카테고리 설명을 반환하는 함수
const getCategoryDescription = (categoryType?: string): string => {
  switch (categoryType) {
    case 'telecom':
      return '통신사 요금제, 휴대폰 등';
    case 'electronics':
      return 'TV, 냉장고, 컴퓨터 등';
    case 'rental':
      return '정수기, 공기청정기 등';
    case 'subscription':
      return '정기 배송, 멤버십 등';
    default:
      return '기타 상품';
  }
};

// 카테고리 아이콘을 반환하는 함수
const getCategoryIcon = (categoryType?: string) => {
  switch (categoryType) {
    case 'telecom':
      return <SmartphoneIcon className="h-5 w-5 text-blue-500" />;
    case 'electronics':
      return <TvIcon className="h-5 w-5 text-green-500" />;
    case 'rental':
      return <BoxIcon className="h-5 w-5 text-orange-500" />;
    case 'subscription':
      return <CreditCardIcon className="h-5 w-5 text-purple-500" />;
    default:
      return <SmartphoneIcon className="h-5 w-5 text-blue-500" />;
  }
};

/**
 * 그룹구매 수정 폼 컴포넌트
 * 기존 그룹구매 데이터를 불러와서 폼에 미리 채워넣는 기능 추가
 */
export default function EditForm({ groupBuyId }: { groupBuyId: string }) {
  // JWT 기반 인증 컨텍스트 사용
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  // 인증 상태를 NextAuth와 호환되는 status 변수로 변환
  const status = isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated';
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [endTimeOption, setEndTimeOption] = useState<string>('24hours');
  const [sliderHours, setSliderHours] = useState<number>(24);
  const [customHours, setCustomHours] = useState<number>(24);
  const [endTimeValue, setEndTimeValue] = useState<string>('');
  const [regionType, setRegionType] = useState<'local'|'nationwide'>('local');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [groupBuy, setGroupBuy] = useState<GroupBuy | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  
  // 지역 선택 관련 상태
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null); // 단일 지역 호환용
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]); // 다중 지역 선택용
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Region[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [regionError, setRegionError] = useState<string>('');
  
  // 알림 다이얼로그 상태
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    title?: string;
    message?: string;
    primaryActionLabel?: string;
    primaryAction?: () => void;
    secondaryActionLabel?: string;
    secondaryAction?: () => void;
  }>({ open: false });
  
  // 공구 제목 자동 생성 함수
  const generateTitle = () => {
    const productName = selectedProduct?.name || '공동구매';
    const regionText = selectedRegion?.name ? `[${selectedRegion.name}]` : '';
    return `${regionText} ${productName} 공동구매`;
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: '',
      title: '',
      min_participants: 1,
      max_participants: 10,
      end_time_option: '24hours',
      end_time: '',
      telecom: '',
      purchase_type: '',
      plan_price: '',
      region: '',
      region_name: '',
      region_type: 'local',
      sliderHours: 24,
      customHours: 24
    },
  });

  // 그룹구매 데이터 불러오기
  const fetchGroupBuyData = async () => {
    try {
      setLoading(true);
      console.log('[EditForm] 그룹구매 데이터 불러오기 시작:', groupBuyId);
      
      // 로컬 스토리지에서 토큰 가져오기
      const token = localStorage.getItem('dungji_auth_token') || 
                   localStorage.getItem('accessToken') || 
                   localStorage.getItem('auth.token');
      
      if (!token) {
        console.error('[EditForm] 인증 토큰이 없습니다.');
        toast({
          title: '인증 오류',
          description: '로그인이 필요합니다.',
          variant: 'destructive',
          action: <ToastAction altText="로그인" onClick={() => router.push('/login')}>로그인</ToastAction>,
        });
        router.push('/login?callbackUrl=/groupbuys/edit/' + groupBuyId);
        return;
      }
      
      // 그룹구매 데이터 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[EditForm] 그룹구매 데이터 로드 성공:', data);
      setGroupBuy(data);
      
      // 상품 목록 불러오기
      await fetchProducts();
      
      // 지역 정보 불러오기
      await fetchRegions();
      
      setIsDataLoaded(true);
    } catch (error) {
      console.error('[EditForm] 그룹구매 데이터 로드 오류:', error);
      toast({
        title: '데이터 로드 오류',
        description: '그룹구매 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 상품 목록 불러오기
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('dungji_auth_token') || 
                   localStorage.getItem('accessToken') || 
                   localStorage.getItem('auth.token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[EditForm] 상품 목록 로드 성공:', data);
      setProducts(data);
      
      // 그룹구매의 상품 ID와 일치하는 상품 찾기
      if (groupBuy && groupBuy.product) {
        const product = data.find((p: Product) => p.id === groupBuy.product.id);
        if (product) {
          setSelectedProduct(product);
        }
      }
    } catch (error) {
      console.error('[EditForm] 상품 목록 로드 오류:', error);
      toast({
        title: '데이터 로드 오류',
        description: '상품 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 지역 정보 불러오기
  const fetchRegions = async () => {
    try {
      const regionsData = await getRegions();
      setRegions(regionsData);
      
      // 그룹구매의 지역 코드와 일치하는 지역 찾기
      if (groupBuy && groupBuy.region_code) {
        const region = regionsData.find((r: Region) => r.code === groupBuy.region_code);
        if (region) {
          setSelectedRegion(region);
          setSelectedRegions([region]);
        }
      }
    } catch (error) {
      console.error('[EditForm] 지역 정보 로드 오류:', error);
    }
  };

  // 그룹구매 데이터로 폼 초기화
  const initializeFormWithGroupBuyData = () => {
    if (!groupBuy || !isDataLoaded) return;
    
    console.log('[EditForm] 폼 초기화 시작:', groupBuy);
    
    // 종료 시간 옵션 설정
    const endTime = new Date(groupBuy.end_time);
    const now = new Date();
    const diffHours = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    let endTimeOpt = '24hours';
    if (diffHours <= 24) {
      endTimeOpt = '24hours';
      setSliderHours(diffHours > 0 ? diffHours : 24);
    } else if (diffHours <= 72) {
      endTimeOpt = '72hours';
      setSliderHours(diffHours);
    } else {
      endTimeOpt = 'custom';
      setCustomHours(diffHours);
    }
    
    setEndTimeOption(endTimeOpt);
    setEndTimeValue(groupBuy.end_time);
    
    // 지역 타입 설정
    setRegionType(groupBuy.region_type || 'local');
    
    // 폼 값 설정
    form.reset({
      product: groupBuy.product?.id?.toString() || '',
      title: groupBuy.title || '',
      description: groupBuy.description || '',
      min_participants: groupBuy.min_participants || 1,
      max_participants: groupBuy.max_participants || 10,
      end_time_option: endTimeOpt,
      end_time: groupBuy.end_time,
      sliderHours: diffHours > 0 ? diffHours : 24,
      customHours: diffHours > 0 ? diffHours : 24,
      region_type: groupBuy.region_type || 'local',
      region: groupBuy.region_code || '',
      region_name: groupBuy.region_name || '',
      telecom: groupBuy.telecom || '',
      telecom_carrier: groupBuy.telecom_carrier || '',
      telecom_plan: groupBuy.telecom_plan || '',
      purchase_type: groupBuy.purchase_type || '',
      plan_price: groupBuy.plan_price || '',
      subscription_type: groupBuy.subscription_type || '',
      manufacturer: groupBuy.manufacturer || '',
      warranty: groupBuy.warranty || '',
      warranty_period: groupBuy.warranty_period || '',
      rental_period: groupBuy.rental_period || '',
      billing_cycle: groupBuy.billing_cycle || '',
      payment_cycle: groupBuy.payment_cycle || '',
    });
    
    console.log('[EditForm] 폼 초기화 완료');
  };

  useEffect(() => {
    // 인증 상태 및 사용자 역할 확인
    if (isLoading) {
      console.log('[EditForm] 인증 상태 로딩 중...');
      return; // 로딩 중에는 아무 작업도 수행하지 않음
    }
    
    // 인증 상태 디버깅
    console.log('[EditForm] 인증 상태:', { 
      isAuthenticated, 
      user, 
      accessToken: accessToken ? '토큰 있음' : '토큰 없음',
      tokenLength: accessToken?.length
    });
    
    // 로컬 스토리지에서 직접 토큰 확인 (백업 검사)
    const localToken = localStorage.getItem('dungji_auth_token') || 
                       localStorage.getItem('accessToken') || 
                       localStorage.getItem('auth.token');
    
    // 비인증 상태일 때 로그인 페이지로 리디렉션
    if (!isAuthenticated && !localToken) {
      console.log('[EditForm] 인증되지 않음, 로그인 페이지로 리디렉션');
      router.push('/login?callbackUrl=/groupbuys/edit/' + groupBuyId);
      return;
    }
    
    // 그룹구매 데이터 불러오기
    fetchGroupBuyData();
  }, [isLoading, isAuthenticated, accessToken, groupBuyId, router]);

  // 데이터 로드 후 폼 초기화
  useEffect(() => {
    if (groupBuy && isDataLoaded && products.length > 0) {
      initializeFormWithGroupBuyData();
    }
  }, [groupBuy, isDataLoaded, products]);

  // 지역 검색 함수
  const handleRegionSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      setRegionError('검색어는 2글자 이상 입력해주세요');
      return;
    }
    
    setIsSearching(true);
    setRegionError('');
    
    try {
      const results = await searchRegionsByName(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('지역 검색 오류:', error);
      setRegionError('지역 검색 중 오류가 발생했습니다');
    } finally {
      setIsSearching(false);
    }
  };

  // 지역 선택 함수
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedRegions([region]);
    form.setValue('region', region.code);
    form.setValue('region_name', region.name);
    setSearchResults([]);
    setSearchTerm('');
  };

  // 종료 시간 계산 함수
  const calculateEndTime = (option: string, hours?: number) => {
    const now = new Date();
    let endTime = new Date(now);
    
    if (option === '24hours') {
      endTime.setHours(now.getHours() + (hours || 24));
    } else if (option === '72hours') {
      endTime.setHours(now.getHours() + (hours || 72));
    } else if (option === 'custom') {
      endTime.setHours(now.getHours() + (hours || customHours));
    }
    
    return endTime.toISOString();
  };

  // 폼 제출 함수
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log('[EditForm] 폼 제출 시작:', data);
      
      // 종료 시간 계산
      let endTime;
      if (data.end_time_option === '24hours') {
        endTime = calculateEndTime('24hours', data.sliderHours);
      } else if (data.end_time_option === '72hours') {
        endTime = calculateEndTime('72hours', data.sliderHours);
      } else if (data.end_time_option === 'custom') {
        endTime = calculateEndTime('custom', data.customHours);
      }
      
      // API 요청 데이터 준비
      const requestData = {
        product: parseInt(data.product),
        title: data.title,
        description: data.description || '',
        min_participants: data.min_participants,
        max_participants: data.max_participants,
        end_time: endTime,
        region_type: data.region_type,
        region_code: data.region_type === 'local' ? data.region : null,
        region_name: data.region_type === 'local' ? data.region_name : null,
        telecom: data.telecom,
        telecom_carrier: data.telecom_carrier,
        telecom_plan: data.telecom_plan,
        purchase_type: data.purchase_type,
        plan_price: data.plan_price,
        subscription_type: data.subscription_type,
        manufacturer: data.manufacturer,
        warranty: data.warranty,
        warranty_period: data.warranty_period,
        rental_period: data.rental_period,
        billing_cycle: data.billing_cycle,
        payment_cycle: data.payment_cycle,
      };
      
      // 토큰 가져오기
      const token = localStorage.getItem('dungji_auth_token') || 
                   localStorage.getItem('accessToken') || 
                   localStorage.getItem('auth.token');
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }
      
      // API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API 요청 실패: ${response.status} ${JSON.stringify(errorData)}`);
      }
      
      const responseData = await response.json();
      console.log('[EditForm] 그룹구매 수정 성공:', responseData);
      
      // 성공 메시지 표시
      toast({
        title: '수정 완료',
        description: '그룹구매가 성공적으로 수정되었습니다.',
        action: <ToastAction altText="확인" onClick={() => router.push(`/groupbuys/${groupBuyId}`)}>확인</ToastAction>,
      });
      
      // 상세 페이지로 이동
      router.push(`/groupbuys/${groupBuyId}`);
    } catch (error) {
      console.error('[EditForm] 그룹구매 수정 오류:', error);
      toast({
        title: '수정 실패',
        description: `그룹구매 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 취소 버튼 클릭 시
  const handleCancel = () => {
    router.push(`/groupbuys/${groupBuyId}`);
  };

  // 로딩 중 표시
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">데이터를 불러오는 중입니다...</span>
      </div>
    );
  }
  
  // 폼 렌더링
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* 상품 선택 */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상품 선택</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const product = products.find(p => p.id.toString() === value);
                    setSelectedProduct(product || null);
                    
                    // 상품 선택 시 제목 자동 생성
                    if (product) {
                      const title = generateTitle();
                      form.setValue('title', title);
                    }
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="상품을 선택해주세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {products.map((product) => (
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
          
          {/* 제목 */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제목</FormLabel>
                <FormControl>
                  <Input placeholder="공구 제목을 입력해주세요" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 설명 */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>설명 (선택사항)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="공구에 대한 설명을 입력해주세요"
                    className="resize-none"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 참여자 수 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="min_participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>최소 참여자 수</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isSubmitting}
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
                  <FormLabel>최대 참여자 수</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* 종료 시간 */}
          <FormField
            control={form.control}
            name="end_time_option"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료 시간</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setEndTimeOption(value);
                    
                    // 종료 시간 계산
                    const endTime = calculateEndTime(value);
                    form.setValue('end_time', endTime);
                    setEndTimeValue(endTime);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="종료 시간을 선택해주세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="24hours">24시간 이내</SelectItem>
                    <SelectItem value="72hours">72시간 이내</SelectItem>
                    <SelectItem value="custom">직접 입력</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 슬라이더 (24시간/72시간 옵션) */}
          {(endTimeOption === '24hours' || endTimeOption === '72hours') && (
            <FormField
              control={form.control}
              name="sliderHours"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <FormLabel>시간 설정: {field.value}시간</FormLabel>
                      <span className="text-sm text-muted-foreground">
                        {new Date(calculateEndTime(endTimeOption, field.value)).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <FormControl>
                      <Slider
                        disabled={isSubmitting}
                        min={1}
                        max={endTimeOption === '24hours' ? 24 : 72}
                        step={1}
                        defaultValue={[field.value || 1]}
                        onValueChange={(values) => {
                          const value = values[0];
                          field.onChange(value);
                          setSliderHours(value);
                          
                          // 종료 시간 계산
                          const endTime = calculateEndTime(endTimeOption, value);
                          form.setValue('end_time', endTime);
                          setEndTimeValue(endTime);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* 직접 입력 (custom 옵션) */}
          {endTimeOption === 'custom' && (
            <FormField
              control={form.control}
              name="customHours"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <FormLabel>시간 직접 입력 (시간)</FormLabel>
                      <span className="text-sm text-muted-foreground">
                        {new Date(calculateEndTime('custom', field.value)).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={720} // 30일 (최대 한 달)
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          setCustomHours(value);
                          
                          // 종료 시간 계산
                          const endTime = calculateEndTime('custom', value);
                          form.setValue('end_time', endTime);
                          setEndTimeValue(endTime);
                        }}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* 지역 타입 */}
          <FormField
            control={form.control}
            name="region_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>지역 설정</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setRegionType(value as 'local' | 'nationwide');
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="지역 설정을 선택해주세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="local">지역 설정</SelectItem>
                    <SelectItem value="nationwide">전국</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* 지역 검색 (local 옵션) */}
          {regionType === 'local' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="지역명을 검색하세요 (예: 서울, 강남)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={handleRegionSearch}
                  disabled={isSubmitting || isSearching}
                  variant="outline"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchIcon className="h-4 w-4" />
                  )}
                  <span className="ml-2">검색</span>
                </Button>
              </div>
              
              {regionError && (
                <p className="text-sm text-red-500">{regionError}</p>
              )}
              
              {searchResults.length > 0 && (
                <div className="bg-white border rounded-md shadow-sm max-h-48 overflow-y-auto">
                  <ul className="divide-y">
                    {searchResults.map((region) => (
                      <li
                        key={region.code}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleRegionSelect(region)}
                      >
                        {region.full_name || region.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedRegion && (
                <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-md">
                  <MapPinIcon className="h-4 w-4 text-blue-500" />
                  <span>{selectedRegion.full_name || selectedRegion.name}</span>
                </div>
              )}
            </div>
          )}
          
          {/* 카테고리별 추가 필드 */}
          {selectedProduct?.category?.detail_type && (
            <Card className={`border ${getCategoryColorClass(selectedProduct.category.detail_type)}`}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getCategoryIcon(selectedProduct.category.detail_type)}
                  <span className="ml-2">{getCategoryLabel(selectedProduct.category.detail_type)} 정보</span>
                </CardTitle>
                <CardDescription>
                  {getCategoryDescription(selectedProduct.category.detail_type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 통신 카테고리 필드 */}
                {selectedProduct.category.detail_type === 'telecom' && (
                  <>
                    <FormField
                      control={form.control}
                      name="telecom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>통신사</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="통신사를 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SKT">SKT</SelectItem>
                              <SelectItem value="KT">KT</SelectItem>
                              <SelectItem value="LGU+">LGU+</SelectItem>
                              <SelectItem value="알뜰폰">알뜰폰</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="telecom_plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>요금제</FormLabel>
                          <FormControl>
                            <Input placeholder="요금제명을 입력해주세요" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="plan_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>요금제 가격</FormLabel>
                          <FormControl>
                            <Input placeholder="요금제 가격을 입력해주세요" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {/* 가전/전자 카테고리 필드 */}
                {selectedProduct.category.detail_type === 'electronics' && (
                  <>
                    <FormField
                      control={form.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>제조사</FormLabel>
                          <FormControl>
                            <Input placeholder="제조사를 입력해주세요" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="warranty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>보증 여부</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="보증 여부를 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">보증 있음</SelectItem>
                              <SelectItem value="no">보증 없음</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch('warranty') === 'yes' && (
                      <FormField
                        control={form.control}
                        name="warranty_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>보증 기간</FormLabel>
                            <FormControl>
                              <Input placeholder="보증 기간을 입력해주세요" {...field} disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
                
                {/* 렌탈 카테고리 필드 */}
                {selectedProduct.category.detail_type === 'rental' && (
                  <>
                    <FormField
                      control={form.control}
                      name="rental_period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>렌탈 기간</FormLabel>
                          <FormControl>
                            <Input placeholder="렌탈 기간을 입력해주세요" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="billing_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>청구 주기</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="청구 주기를 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">월간</SelectItem>
                              <SelectItem value="quarterly">분기</SelectItem>
                              <SelectItem value="yearly">연간</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                
                {/* 구독 카테고리 필드 */}
                {selectedProduct.category.detail_type === 'subscription' && (
                  <>
                    <FormField
                      control={form.control}
                      name="subscription_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>구독 유형</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="구독 유형을 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="content">콘텐츠</SelectItem>
                              <SelectItem value="product">상품</SelectItem>
                              <SelectItem value="service">서비스</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="payment_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>결제 주기</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="결제 주기를 선택해주세요" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">주간</SelectItem>
                              <SelectItem value="monthly">월간</SelectItem>
                              <SelectItem value="yearly">연간</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* 버튼 그룹 */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정하기'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
