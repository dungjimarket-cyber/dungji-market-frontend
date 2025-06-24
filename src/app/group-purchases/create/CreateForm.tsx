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
import { SmartphoneIcon, TvIcon, BoxIcon, CreditCardIcon, AlertCircleIcon, CheckCircle2, AlertTriangleIcon } from "lucide-react";
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

/**
 * 폼 유효성 검증 스키마
 * 카테고리별 필드 유효성 검증 로직 포함
 */
const formSchema = z.object({
  product: z.string().min(1, {
    message: '상품을 선택해주세요',
  }),
  title: z.string().optional().default(''),
  // 제목은 자동 생성되도록 설정되어 있으므로 optional로 변경
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
  end_time_option: z.union([
    z.enum(['slider', 'custom']),
    z.string().transform(val => val === '24hours' ? 'slider' : 'custom'),
  ]),
  end_time: z.string().optional(),
  customHours: z.union([
    z.string().transform(val => parseInt(val, 10) || 24),
    z.number().optional(),
  ]),
  sliderHours: z.union([
    z.string().transform(val => parseInt(val, 10) || 24),
    z.number(),
  ]).refine(val => val >= 6 && val <= 48, {
    message: '마감 시간은 6~48시간 사이여야 합니다',
  }).default(24),
  region_type: z.enum(['local', 'online']).default('local'),
  region: z.string().optional(),
  
  // 카테고리별 필드
  telecom_carrier: z.string().optional(),
  telecom_plan: z.string().optional(),
  subscription_type: z.string().optional(),
  contract_period: z.string().optional(),
  rental_period: z.string().optional(),
  manufacturer: z.string().optional(),
  warranty_period: z.string().optional(),
  payment_cycle: z.string().optional(),
  
  // 카테고리 식별용 필드 (UI에 표시되지 않음)
  product_category: z.string().optional()
}).refine(data => {
  // 최소 참여 인원은 최대 참여 인원보다 클 수 없음
  if (data.min_participants && data.max_participants) {
    return data.min_participants <= data.max_participants;
  }
  return true;
}, {
  message: '최소 참여 인원은 최대 참여 인원보다 클 수 없습니다',
  path: ['min_participants'],
});

/**
 * 공구 등록 폼 데이터 인터페이스
 */
interface FormData {
  product: string;
  title: string;
  description?: string;      // 공구 설명 필드 추가
  min_participants: number;
  max_participants: number;
  end_time_option: string;
  end_time: string;
  
  // 카테고리 식별용 필드 (UI에 표시되지 않음)
  product_category?: string;
  
  // 통신 상품 관련 필드
  telecom?: string;
  telecom_carrier?: string; // 통신사
  telecom_plan?: string;    // 요금제
  purchase_type?: string;
  plan_price?: string;
  subscription_type?: string; // 가입유형
  
  // 가전 제품 관련 필드
  manufacturer?: string;
  warranty?: string;
  warranty_period?: string;   // 보증기간
  
  // 렌탈 상품 관련 필드
  rental_period?: string;
  
  // 구독 상품 관련 필드
  billing_cycle?: string;
  payment_cycle?: string;    // 결제 주기
}

/**
 * 카테고리별 배경색 클래스를 반환하는 함수
 */
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
      return 'bg-blue-50 border-blue-200';
  }
};

/**
 * 카테고리 레이블을 반환하는 함수
 */
const getCategoryLabel = (categoryType?: string): string => {
  switch (categoryType) {
    case 'telecom':
      return '통신 상품';
    case 'electronics':
      return '가전 제품';
    case 'rental':
      return '렌탈 상품';
    case 'subscription':
      return '구독 서비스';
    default:
      return '통신 상품';
  }
};

/**
 * 카테고리 설명을 반환하는 함수
 */
const getCategoryDescription = (categoryType?: string): string => {
  switch (categoryType) {
    case 'telecom':
      return '통신사, 가입유형, 요금제를 선택하여 최적의 통신 상품을 구매하세요.';
    case 'electronics':
      return '제조사와 보증 기간 정보를 입력하여 가전 제품 공동구매를 시작하세요.';
    case 'rental':
      return '렌탈 기간을 선택하여 더 저렴한 조건으로 렌탈 상품을 이용하세요.';
    case 'subscription':
      return '결제 주기를 선택하여 구독 서비스를 더 유리한 조건으로 이용하세요.';
    default:
      return '통신사, 가입유형, 요금제를 선택하여 최적의 통신 상품을 구매하세요.';
  }
};

/**
 * 카테고리 아이콘을 반환하는 함수
 */
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
 * 공구 등록 폼 컴포넌트
 * JWT 기반 인증을 사용하여 판매자 권한 확인 및 데이터 처리
 */
export default function CreateForm() {
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
  const [regionType, setRegionType] = useState<'local'|'nationwide'>('local');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
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
      plan_price: ''
    },
  });

  useEffect(() => {
    // 인증 상태 및 사용자 역할 확인
    if (isLoading) {
      console.log('[CreateForm] 인증 상태 로딩 중...');
      return; // 로딩 중에는 아무 작업도 수행하지 않음
    }
    
    // 인증 상태 디버깅
    console.log('[CreateForm] 인증 상태:', { 
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
      console.log('[CreateForm] 인증되지 않음, 로그인 페이지로 리디렉션');
      router.push('/login?callbackUrl=/group-purchases/create');
      return;
    }
    
    // 토큰은 있지만 인증 상태가 false인 경우 (불일치 상태)
    if (!isAuthenticated && localToken) {
      console.log('[CreateForm] 토큰은 있지만 인증 상태가 false, 인증 컨텍스트 초기화 시도');
      // 인증 상태 이벤트 발생시켜 AuthContext 재초기화 유도
      window.dispatchEvent(new Event('auth-changed'));
      // 짧은 지연 후 페이지 새로고침 (최후의 수단)
      setTimeout(() => window.location.reload(), 500);
      return;
    }
    
    // 판매자(seller) 계정은 공구 등록 불가
    if (user?.role === 'seller' || (user?.roles && user.roles.includes('seller'))) {
      toast({
        title: "접근 제한",
        description: "판매자 계정은 공구 등록이 불가능합니다.",
        variant: "destructive",
      });
      router.push('/'); // 홈페이지로 리디렉션
    }
  }, [router, isLoading, isAuthenticated, user]);

  useEffect(() => {
    console.log('현재 인증 상태:', isAuthenticated ? '인증됨' : '비인증');
    console.log('사용자 데이터:', user);
    console.log('사용자 ID:', user?.id);
    
    const fetchProducts = async () => {
      try {
        const tokenResponse = await tokenUtils.fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/products/`,
          {
            method: 'GET'
          }
        );
        
        if (tokenResponse && Array.isArray(tokenResponse)) {
          setProducts(tokenResponse);
        }
      } catch (error) {
        console.error('상품 데이터 가져오기 오류:', error);
        toast({
          variant: 'destructive',
          title: '상품 로드 오류',
          description: '상품 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        });
        
        // 토큰 만료 오류라면 로그인 페이지로 이동
        if (error instanceof Error && error.message.includes('401')) {
          router.push('/login?callbackUrl=/group-purchases/create');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /**
   * 폼 제출 핸들러 
   */
  const onSubmit = async (values: FormData) => {
    console.log('폼 제출 시작:', values);
    
    // 요청 데이터를 함수 전체에서 사용할 수 있도록 초기화
    let apiRequestData: Record<string, any> = {};
    
    // 필수 필드 값 유효성 추가 확인
    if (!values.product) {
      toast({
        title: "오류",
        description: "상품을 선택해주세요",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 최소/최대 참여자 수 검증
      if (values.min_participants > values.max_participants) {
        toast({
          variant: 'destructive',
          title: '참여 인원 오류',
          description: '최소 참여 인원은 최대 참여 인원보다 클 수 없습니다'
        });
        return;
      }
      
      // 로그인 확인
      if (!isAuthenticated || !user) {
        toast({
          variant: "destructive",
          title: "로그인이 필요합니다",
          description: "공구 등록을 위해 로그인이 필요합니다.",
        });
        router.push('/login?callbackUrl=/group-purchases/create');
        return;
      }

      // 상품 ID 추출
      const productId = parseInt(values.product);
      
      // 마감시간 계산
      let endTimeValue: string;
      if (values.end_time_option === 'custom') {
        endTimeValue = values.end_time;
      } else if (values.end_time_option === 'slider') {
        // 슬라이더로 설정한 시간
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + sliderHours);
        endTimeValue = endDate.toISOString();
      } else {
        // 기본 옵션 (6, 12, 24, 48시간)
        const hoursToAdd = parseInt(values.end_time_option.replace('hours', ''), 10);
        const endDate = new Date();
        endDate.setHours(endDate.getHours() + hoursToAdd);
        endTimeValue = endDate.toISOString();
      }
      
      // 최소, 최대 참여자 수 처리
      const minParticipants = values.min_participants;
      const maxParticipants = values.max_participants;
      
      // 카테고리별 상품 세부 정보 구성
      let productDetails = {};
      
      // 선택된 상품의 카테고리에 따라 다른 세부 정보 추가
      if (!selectedProduct || selectedProduct.category?.detail_type === 'telecom' || !selectedProduct.category?.detail_type) {
        productDetails = {
          telecom_carrier: values.telecom_carrier,
          telecom_plan: values.telecom_plan, // 백엔드에서 product_details.telecom_plan을 찾기 때문에 plan_info가 아닌 telecom_plan 사용
          subscription_type: values.subscription_type
        };
        console.log('통신사 정보 전송:', productDetails);
      } else if (selectedProduct.category?.detail_type === 'electronics') {
        productDetails = {
          manufacturer: values.manufacturer,
          warranty_period: values.warranty_period
        };
      } else if (selectedProduct.category?.detail_type === 'rental') {
        productDetails = {
          rental_period: values.rental_period
        };
      } else if (selectedProduct.category?.detail_type === 'subscription') {
        productDetails = {
          payment_cycle: values.payment_cycle
        };
      }
      
      // 자동으로 제목과 설명 생성
      let generatedTitle = '';
      let generatedDescription = '';
      
      // 상품명 추출
      const productName = selectedProduct?.name || '';
      
      // 통신사 정보 추출
      const carrier = values.telecom_carrier || '';
      
      // 가입유형 표시
      let subscriptionType = '';
      if (values.subscription_type === 'new') {
        subscriptionType = '신규가입';
      } else if (values.subscription_type === 'transfer') {
        subscriptionType = '번호이동';
      } else if (values.subscription_type === 'change') {
        subscriptionType = '기기변경';
      }
      
      // 요금제 정보 표시
      let planInfo = '';
      if (values.telecom_plan === '5G_basic') {
        planInfo = '요금제 3만원대';
      } else if (values.telecom_plan === '5G_standard') {
        planInfo = '요금제 5만원대';
      } else if (values.telecom_plan === '5G_premium') {
        planInfo = '요금제 7만원대';
      } else if (values.telecom_plan === '5G_special') {
        planInfo = '요금제 9만원대';
      } else if (values.telecom_plan === '5G_platinum') {
        planInfo = '요금제 10만원대';
      }
      
      // 제목 자동 생성
      generatedTitle = `${productName} ${carrier} ${subscriptionType} ${planInfo}`.trim();
      generatedDescription = `${productName} ${carrier} ${subscriptionType} ${planInfo} 공구입니다.`.trim();
      
      // 수치 필드는 반드시 수치로 변환
      const minPart = typeof minParticipants === 'string' ? parseInt(minParticipants, 10) : minParticipants;
      const maxPart = typeof maxParticipants === 'string' ? parseInt(maxParticipants, 10) : maxParticipants;
      
      // 자동 생성된 제목과 설명 사용
      const safeTitle = generatedTitle || '자동 생성 공구';
      const safeDescription = generatedDescription || '공구 설명';
      // product_details는 값이 있는 항목만 포함하도록 필터링
      const cleanProductDetails: Record<string, any> = {};
      Object.entries(productDetails).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanProductDetails[key] = value;
        }
      });
      
      // 현재 로그인한 사용자 ID 가져오기 (로그인 검사는 API 요청 직전에 수행)
      const userId = user?.id;
      
      // 백엔드 API 요구사항에 정확히 맞춘 요청 객체
      apiRequestData = {
        product: productId,                 // 필수 필드, 수치
        title: safeTitle,                   // 필수 필드, 문자열 (자동 생성된 제목)
        description: safeDescription,       // 선택 필드, 문자열 (자동 생성된 설명)
        min_participants: minPart,          // 필수 필드, 수치, 최소 1
        max_participants: maxPart,          // 필수 필드, 수치, 최소 1
        end_time: endTimeValue,             // 필수 필드, 날짜/시간 문자열
        region_type: regionType || 'local', // 선택 필드, 문자열, 기본값 'local'
        creator: userId,                    // 필수 필드, 현재 로그인한 사용자 ID
        product_details: cleanProductDetails // 백엔드에서 이 키를 사용하여 통신사 정보 추출
      };
      
      // 로그인 상태 확인
      console.log('제출 시 세션 상태:', status);
      console.log('제출 시 사용자 ID:', userId);
      
      // 세션 상태에 따른 처리
      switch(status) {
        case 'loading':
          // 세션 로딩 중에는 처리를 지연
          toast({
            title: '로그인 정보 확인 중',
            description: '잠시만 기다려주세요...',
          });
          setTimeout(() => setIsSubmitting(false), 1500);
          return;
          
        case 'authenticated':
          // 로그인은 되었지만 ID가 없는 경우
          if (!userId) {
            toast({
              variant: 'destructive',
              title: '사용자 정보 오류',
              description: '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.',
            });
            router.push('/login?callbackUrl=/group-purchases/create');
            setIsSubmitting(false);
            return;
          }
          // 로그인 완료 및 ID 있음 - 정상 처리 계속
          break;
          
        case 'unauthenticated':
          // 로그인되지 않은 경우
          toast({
            variant: 'destructive',
            title: '로그인 필요',
            description: '공구 등록을 위해서는 로그인이 필요합니다.',
          });
          router.push('/login?callbackUrl=/group-purchases/create');
          setIsSubmitting(false);
          return;
      }
      
      // 동일 상품으로 이미 생성한 공구가 있는지 확인
      try {
        console.log('중복 공구 확인 시작 - 상품 ID:', productId, '타입:', typeof productId);
        
        const checkUrl = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/my_groupbuys/`;
        console.log('기존 공구 확인 URL:', checkUrl);
        
        const existingGroupBuys = await tokenUtils.fetchWithAuth(checkUrl, {
          method: 'GET'
        });
        
        console.log('기존 공구 출력:', JSON.stringify(existingGroupBuys, null, 2));
        
        // 중요: 현재 상품과 동일한 상품을 사용한 공구가 있는지 확인
        if (existingGroupBuys && Array.isArray(existingGroupBuys)) {
          // 확인용 로그 추가
          console.log(`현재 선택된 상품 ID: ${productId} (${typeof productId})`);
          console.log('기존 공구 목록 개수:', existingGroupBuys.length);
          
          // 확인을 위해 모든 공구의 상품 ID를 출력
          existingGroupBuys.forEach((gb, idx) => {
            console.log(`공구[${idx}] - 상품 ID: ${gb.product} (${typeof gb.product}), 상품명: ${gb.product_name}, 상태: ${gb.status}`);
          });
          
          // 주의: 같은 상품 ID를 가진 공구 찾기 (status 값 고려)
          const activeStatuses = ['recruiting', 'bidding', 'voting', 'seller_confirmation']; // 활성 상태로 간주되는 상태들
          
          // 문자열과 숫자 모두 처리하기 위해 확실하게 숫자로 변환하여 비교
          const duplicateGroupBuy = existingGroupBuys.find(gb => {
            const gbProductId = typeof gb.product === 'string' ? parseInt(gb.product) : Number(gb.product);
            const isActive = activeStatuses.includes(gb.status);
            
            console.log(`비교: 기존 공구 상품 ID ${gbProductId} vs 현재 상품 ID ${productId}, 상태: ${gb.status}, 활성여부: ${isActive}`);
            
            // 동일한 상품이고 활성 상태일 경우에만 중복으로 간주
            return gbProductId === productId && isActive;
          });
          
          console.log('중복 공구 검출 결과:', duplicateGroupBuy);
          
          // 중복 공구가 감지된 경우
          if (duplicateGroupBuy) {
            // 중요: 중복 공구 상세 정보 로그
            console.error('중복 공구 발견! 등록 불가 - ID:', duplicateGroupBuy.id, 
                          '상품:', duplicateGroupBuy.product_name, 
                          '상태:', duplicateGroupBuy.status);
            
            // 제품 ID 추출
            const productId = apiRequestData.product;
            const selectedProductName = selectedProduct?.name || duplicateGroupBuy.product_name || '현재 상품';
            
            // 사용자에게 모달 표시 - 토스트보다 더 눈에 띄고 사라지지 않음
            setDialogState({
              open: true,
              title: '중복 공구 등록 불가',
              message: `이미 동일한 상품(${selectedProductName})으로 진행 중인 공구가 있습니다. 상태: ${duplicateGroupBuy.status === 'recruiting' ? '모집중' : duplicateGroupBuy.status}`,
              primaryActionLabel: '기존 공구 확인',
              primaryAction: () => {
                router.push(`/groupbuys/${duplicateGroupBuy.id}`);
                setDialogState({ open: false });
              },
              secondaryActionLabel: '다른 상품 선택',
              secondaryAction: () => {
                form.setValue('product', '');
                setDialogState({ open: false });
              }
            });
            
            // 추가로 토스트 메시지도 표시 - 중요하고 눈에 띄게 표시
            toast({
              variant: 'destructive',
              title: '중복 공구 등록 불가',
              description: `이미 ${selectedProductName} 상품으로 진행 중인 공구가 있습니다.`,
              duration: 60000, // 1분 동안 표시
              className: "font-bold border-red-400 bg-red-50"
            });
            
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        console.error('기존 공구 확인 중 오류:', err);
        // 오류가 발생해도 일단 계속 진행
      }
      
      // 디버깅을 위한 요청 데이터 로깅
      console.log('===== 요청 형식 및 베어된 값 확인 =====');
      console.log('product (productId):', productId, typeof productId);
      console.log('title:', safeTitle, typeof safeTitle);
      console.log('description:', safeDescription, typeof safeDescription);
      console.log('min_participants:', minPart, typeof minPart);
      console.log('max_participants:', maxPart, typeof maxPart);
      console.log('end_time:', endTimeValue, typeof endTimeValue);
      console.log('region_type:', regionType || 'local');
      console.log('creator:', userId, typeof userId);
      
      // 추가 디버깅: 각 필드의 유효성 검사
      console.log('===== 필드 유효성 검사 =====');
      console.log('productId 유효성:', productId && productId > 0);
      console.log('title 유효성:', safeTitle && safeTitle.length > 0);
      console.log('min_participants 유효성:', minPart && minPart >= 1);
      console.log('max_participants 유효성:', maxPart && maxPart >= 1 && maxPart <= 100);
      console.log('end_time 유효성:', endTimeValue && new Date(endTimeValue) > new Date());
      console.log('creator 유효성:', userId && (typeof userId === 'number' ? userId > 0 : parseInt(userId.toString()) > 0));
      console.log('region_type 유효성:', regionType === 'local' || regionType === 'nationwide');
      
      // end_time 형식 상세 확인
      console.log('===== end_time 상세 분석 =====');
      console.log('endTimeValue 원본:', endTimeValue);
      console.log('endTimeValue Date 객체:', new Date(endTimeValue));
      console.log('endTimeValue ISO 문자열:', new Date(endTimeValue).toISOString());
      console.log('현재 시간:', new Date().toISOString());
      console.log('시간 차이 (시간):', (new Date(endTimeValue).getTime() - new Date().getTime()) / (1000 * 60 * 60));
      
      // 필수 필드 값 검증 
      if (!productId || productId <= 0) {
        toast({
          variant: 'destructive',
          title: '상품 오류',
          description: '유효한 상품을 선택해주세요.',
        });
        setIsSubmitting(false);
        return;
      }
      
      if (!endTimeValue) {
        toast({
          variant: 'destructive',
          title: '시간 설정 오류',
          description: '마감 시간을 설정해주세요.',
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log('=====================');
      
      // API URL 설정
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`;
      console.log('공구 등록 API URL:', apiUrl);
      console.log('공구 등록 요청 데이터:', JSON.stringify(apiRequestData, null, 2));
      
      // tokenUtils를 사용하여 인증된 API 요청 수행
      console.log('API 요청 발송:', apiUrl);
      console.log('JSON.stringify 결과:', JSON.stringify(apiRequestData));
      
      try {
        const result = await tokenUtils.fetchWithAuth(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(apiRequestData),
        });
        
        console.log('공구 등록 응답 성공:', result);
        
        // 응답 데이터 상세 로깅
        console.log('응답 데이터 타입:', typeof result);
        console.log('응답 데이터 상세:', JSON.stringify(result, null, 2));
        
        // API 응답에서 공구 ID 추출
        // 백엔드 API 응답 형식에 맞게 타입 안전하게 처리
        const createdGroupBuyId = typeof result === 'object' && result ? 
          (result as any).id || (result as any).groupbuy_id : undefined;
        
        console.log('추출된 공구 ID:', createdGroupBuyId);
        
        // 로딩 상태 해제
        setIsSubmitting(false);
        
        // 성공 토스트 메시지 표시
        toast({
          variant: 'default',
          title: '공구 등록 성공!',
          description: '공구가 성공적으로 등록되었습니다. 공구 목록으로 이동합니다.',
          className: "border-green-200 bg-green-50",
          duration: 3000,
        });
        
        // 3초 후 자동으로 공구 목록 페이지로 이동
        setTimeout(() => {
          router.push('/group-purchases');
        }, 1500);
      } catch (apiError: unknown) {
        console.error('===== API 요청 실패 상세 정보 =====');
        console.error('오류 객체:', apiError);
        console.error('오류 메시지:', (apiError as Error).message);
        console.error('오류 스택:', (apiError as Error).stack);
        
        // 추가 디버깅을 위해 요청 데이터 재출력
        console.error('실패한 요청 데이터:', JSON.stringify(apiRequestData, null, 2));
        
        // 에러 메시지 추출
        let errorMessage = '공구 등록 중 오류가 발생했습니다.';
        
        if (apiError instanceof Error) {
          // fetchWithAuth에서 던진 사용자 친화적 메시지 사용
          errorMessage = apiError.message;
        }
        
        toast({
          variant: 'destructive',
          title: '공구 등록 실패',
          description: errorMessage,
        });
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('공구 등록 실패:', error);
      
      // 에러 메시지 추출
      let errorMessage = '공구 등록 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        // fetchWithAuth에서 던진 사용자 친화적 메시지 사용
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: '공구 등록 실패',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // 중복 공구 알림 다이얼로그 구성
  const duplicateGroupBuyDialog = (
    <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState({ ...dialogState, open })}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangleIcon className="h-5 w-5" />
            {dialogState.title || '알림'}
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {dialogState.message || '작업을 계속할 수 없습니다.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start flex gap-2 mt-4">
          {dialogState.primaryAction && (
            <Button 
              variant="default" 
              onClick={dialogState.primaryAction}
            >
              {dialogState.primaryActionLabel || '확인'}
            </Button>
          )}
          {dialogState.secondaryAction && (
            <Button 
              variant="outline" 
              onClick={dialogState.secondaryAction}
            >
              {dialogState.secondaryActionLabel || '취소'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  // 로딩 오버레이 구성
  const loadingOverlay = isSubmitting && (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg">
      <Loader2 className="h-16 w-16 animate-spin text-blue-500 mb-4" />
      <p className="text-xl font-bold text-blue-700">공구 등록 중...</p>
      <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
      <div className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
  );
  
  return (
    <div className="container">
      {duplicateGroupBuyDialog}
      
      <Card className="w-full max-w-4xl mx-auto mt-5 mb-10 relative">
        {loadingOverlay}
        
        <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center mb-1">공구 등록하기</CardTitle>
        <CardDescription className="text-center text-gray-500">
          새로운 공동구매를 시작하세요
        </CardDescription>
        {/* 폼 유효성 검증 오류 표시 */}
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
            <p className="text-red-600 font-medium text-sm mb-1">입력 정보를 확인해주세요:</p>
            <ul className="text-xs text-red-500 list-disc pl-4">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>{field}: {error?.message?.toString() || '유효하지 않은 값'}</li>
              ))}
            </ul>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit((data) => {
              // 폼 제출 이벤트 관리
              console.log('폼 제출 처리:', data);
              onSubmit(data);
            })} 
            className="space-y-6"
          >
            <div className="space-y-6">
              <h3 className="text-lg font-medium">기기 선택</h3>
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const product = products.find(p => p.id.toString() === value);
                          setSelectedProduct(product || null);
                          
                          // 카테고리 정보 폼에 설정
                          const categoryType = product?.category?.detail_type || 'telecom';
                          form.setValue('product_category', categoryType);
                          
                          // 카테고리 변경 시 관련 없는 필드 초기화
                          if (categoryType === 'telecom') {
                            form.setValue('manufacturer', '');
                            form.setValue('warranty', '');
                            form.setValue('rental_period', '');
                            form.setValue('billing_cycle', '');
                          } else if (categoryType === 'electronics') {
                            form.setValue('telecom_carrier', '');
                            form.setValue('subscription_type', '');
                            form.setValue('telecom_plan', '');
                            form.setValue('rental_period', '');
                            form.setValue('billing_cycle', '');
                          } else if (categoryType === 'rental') {
                            form.setValue('telecom_carrier', '');
                            form.setValue('subscription_type', '');
                            form.setValue('telecom_plan', '');
                            form.setValue('manufacturer', '');
                            form.setValue('warranty', '');
                            form.setValue('billing_cycle', '');
                          } else if (categoryType === 'subscription') {
                            form.setValue('telecom_carrier', '');
                            form.setValue('subscription_type', '');
                            form.setValue('telecom_plan', '');
                            form.setValue('manufacturer', '');
                            form.setValue('warranty', '');
                            form.setValue('rental_period', '');
                          }
                        }} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="bg-gray-50 h-12">
                          <SelectValue placeholder="상품을 선택해주세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} <span className="text-gray-500 ml-1">(출고가: {product.base_price.toLocaleString()}원)</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-medium">지역 선택</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`py-3 rounded-full font-medium transition-colors ${regionType === 'local' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setRegionType('local')}
                >
                  지역
                </button>
                <button
                  type="button"
                  className={`py-3 rounded-full font-medium transition-colors ${regionType === 'nationwide' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setRegionType('nationwide')}
                >
                  전국(비대면)
                </button>
              </div>
            </div>
            
            {/* 카테고리별 다이나믹 폼 필드 */}
            {selectedProduct && (
              <div className="transition-all duration-300 ease-in-out">
                <div className={`rounded-lg border p-4 mb-4 ${getCategoryColorClass(selectedProduct.category?.detail_type)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(selectedProduct.category?.detail_type)}
                    <span className="font-medium">{getCategoryLabel(selectedProduct.category?.detail_type)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryDescription(selectedProduct.category?.detail_type)}
                  </p>
                </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {selectedProduct?.category?.detail_type === 'telecom' && <SmartphoneIcon className="h-5 w-5 text-blue-500" />}
                  {selectedProduct?.category?.detail_type === 'electronics' && <TvIcon className="h-5 w-5 text-green-500" />}
                  {selectedProduct?.category?.detail_type === 'rental' && <BoxIcon className="h-5 w-5 text-orange-500" />}
                  {selectedProduct?.category?.detail_type === 'subscription' && <CreditCardIcon className="h-5 w-5 text-purple-500" />}
                  {!selectedProduct?.category?.detail_type && <SmartphoneIcon className="h-5 w-5 text-blue-500" />}
                  <h3 className="text-lg font-medium">구매 유형</h3>
                </div>
                <div className="space-y-4">
                  {/* 통신 상품일 경우 */}
                  {(selectedProduct.category?.detail_type === 'telecom' || !selectedProduct.category?.detail_type) && (
                    <>
                      <FormField
                        control={form.control}
                        name="telecom_carrier"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="통신사 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SKT">SK</SelectItem>
                                  <SelectItem value="KT">KT</SelectItem>
                                  <SelectItem value="LGU">LG</SelectItem>
                                  <SelectItem value="MVNO">알뜰폰</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="subscription_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="가입유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="change">기기변경</SelectItem>
                                  <SelectItem value="transfer">번호이동</SelectItem>
                                  <SelectItem value="new">신규가입</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="telecom_plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="요금제 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5G_basic">3만원대</SelectItem>
                                  <SelectItem value="5G_standard">5만원대</SelectItem>
                                  <SelectItem value="5G_premium">7만원대</SelectItem>
                                  <SelectItem value="5G_special">9만원대</SelectItem>
                                  <SelectItem value="5G_platinum">10만원대</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* 가전 제품일 경우 */}
                  {selectedProduct.category?.detail_type === 'electronics' && (
                    <>
                      <FormField
                        control={form.control}
                        name="manufacturer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>제조사</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-gray-50 h-12" placeholder="제조사" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="warranty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>보증 기간(개월)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-gray-50 h-12" placeholder="12" type="number" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* 렌탈 상품일 경우 */}
                  {selectedProduct.category?.detail_type === 'rental' && (
                    <>
                      <FormField
                        control={form.control}
                        name="rental_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>렌탈 기간(개월)</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="렌탈 기간 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="12">12개월</SelectItem>
                                  <SelectItem value="24">24개월</SelectItem>
                                  <SelectItem value="36">36개월</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* 구독 상품일 경우 */}
                  {selectedProduct.category?.detail_type === 'subscription' && (
                    <>
                      <FormField
                        control={form.control}
                        name="billing_cycle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>결제 주기</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="결제 주기 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">월간</SelectItem>
                                  <SelectItem value="quarterly">분기</SelectItem>
                                  <SelectItem value="yearly">연간</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
              </div>
            )}

            {/* 제목 필드 자동 생성으로 대체 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-md font-medium mb-2">공구 제목 자동 생성</h3>
              <p className="text-sm text-gray-600">
                상품명, 통신사, 가입유형, 요금제 정보를 기반으로 자동 생성됩니다.  
              </p>
            </div>

            <div className="space-y-6">
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
                          className="text-center font-medium text-lg"
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
                          className="text-center font-medium text-lg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">시간 설정(최소6시간-48시간)</h3>
              <FormField
                control={form.control}
                name="end_time_option"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-full">
                        <Slider
                          min={6}
                          max={48}
                          step={1}
                          value={[sliderHours]}
                          onValueChange={(values) => {
                            // 슬라이더 값만 처리
                            const sliderValue = values[0];
                            setSliderHours(sliderValue);
                            form.setValue('end_time_option', 'slider');
                            setEndTimeOption('slider');
                            
                            // 슬라이더 값에 따른 종료 시간 설정
                            const currentTime = new Date();
                            const newEndTime = new Date(currentTime.getTime() + sliderValue * 60 * 60 * 1000);
                            form.setValue('end_time', newEndTime.toISOString());
                            
                            // 제품이 선택되어 있을 경우에만 제목/설명 업데이트
                            const telecom_plan = form.getValues('telecom_plan') || '';
                            const product = selectedProduct;
                            
                            if (product) {
                              const title = `${product.name} ${telecom_plan} ${sliderValue}시간`;
                              const description = `${product.name} ${telecom_plan} ${sliderValue}시간 공구입니다.`;
                              
                              form.setValue('title', title);
                              form.setValue('description', description);
                              
                              console.log('제목:', title);
                              console.log('설명:', description);
                            }
                          }}
                          className="w-full"
                        />
                      </div>
                      <div className="ml-4 font-medium text-blue-500">{sliderHours}시간</div>
                    </div>
                    
                    <div className="hidden">
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          
                          // 선택한 옵션에 따라 마감 시간 자동 설정
                          if (value !== 'custom') {
                            const now = new Date();
                            let hoursToAdd = 24;
                            
                            if (value === '6hours') {
                              hoursToAdd = 6;
                              setSliderHours(6);
                            }
                            else if (value === '12hours') {
                              hoursToAdd = 12;
                              setSliderHours(12);
                            }
                            else if (value === '24hours') {
                              hoursToAdd = 24;
                              setSliderHours(24);
                            }
                            
                            // 현재 시간에 설정한 시간을 더함
                            const endTime = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
                            
                            // 로컬 시간 형식으로 변환 (YYYY-MM-DDTHH:MM)
                            const localDateTimeString = endTime.toISOString().slice(0, 16);
                            form.setValue('end_time', localDateTimeString);
                            
                            setEndTimeOption(value);
                            console.log('자동 설정된 마감 시간:', localDateTimeString);
                          } else {
                            setEndTimeOption(value);
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="마감 시간 옵션 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6hours">6시간 후 마감</SelectItem>
                          <SelectItem value="12hours">12시간 후 마감</SelectItem>
                          <SelectItem value="24hours">24시간 후 마감</SelectItem>
                          <SelectItem value="custom">직접 입력</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="hidden">
                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          type="hidden"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-lg font-bold text-lg cursor-pointer" 
              disabled={isSubmitting || form.formState.isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  등록 중...
                </>
              ) : (
                '공구 등록하기'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}
