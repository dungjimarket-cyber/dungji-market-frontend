'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { tokenUtils } from '@/lib/tokenUtils';
import { SmartphoneIcon, TvIcon, BoxIcon, CreditCardIcon, AlertCircleIcon, CheckCircle2 } from "lucide-react";
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
  title: z.string().min(3, {
    message: '제목은 최소 3글자 이상이어야 합니다',
  }),
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
 */
export default function CreateForm() {
  // status의 타입을 명시적으로 지정합니다
  const { data: session, status } = useSession() as {
    data: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
  };
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [endTimeOption, setEndTimeOption] = useState<string>('24hours');
  const [sliderHours, setSliderHours] = useState<number>(24);
  const [regionType, setRegionType] = useState<'local'|'nationwide'>('local');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
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
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/group-purchases/create');
    }
  }, [status, router]);

  useEffect(() => {
    // useSession 후크의 데이터를 활용하여 세션 검증
    console.log('공구 등록 페이지 세션 확인:', session);
    
    // status가 'unauthenticated'일 때만 로그인 페이지로 리디렉션
    // status가 'loading'인 경우는 기다림
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/group-purchases/create');
    }
  }, [router, status, session]);

  useEffect(() => {
    console.log('현재 세션 상태:', status);
    console.log('세션 데이터:', session);
    console.log('사용자 ID:', session?.user?.id);
    
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
      if (!session || !session.user) {
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
          telecom_plan: values.telecom_plan,
          subscription_type: values.subscription_type
        };
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
      
      // 필수 필드 추가 - description 필드 (빈 값이면 제목으로 설정)
      const description = values.description?.trim() || values.title.trim();
      
      // 수치 필드는 반드시 수치로 변환
      const minPart = typeof minParticipants === 'string' ? parseInt(minParticipants, 10) : minParticipants;
      const maxPart = typeof maxParticipants === 'string' ? parseInt(maxParticipants, 10) : maxParticipants;
      
      // description은 반드시 문자열로 설정
      const safeDescription = description || values.title.trim() || '공구 설명';
      // product_details는 값이 있는 항목만 포함하도록 필터링
      const cleanProductDetails: Record<string, any> = {};
      Object.entries(productDetails).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanProductDetails[key] = value;
        }
      });
      
      // 현재 로그인한 사용자 ID 가져오기 (로그인 검사는 API 요청 직전에 수행)
      const userId = session?.user?.id;
      
      // 백엔드 API 요구사항에 정확히 맞춘 요청 객체
      apiRequestData = {
        product: productId,                 // 필수 필드, 수치
        title: values.title.trim(),         // 필수 필드, 문자열
        description: safeDescription,       // 선택 필드, 문자열
        min_participants: minPart,          // 필수 필드, 수치, 최소 1
        max_participants: maxPart,          // 필수 필드, 수치, 최소 1
        end_time: endTimeValue,             // 필수 필드, 날짜/시간 문자열
        region_type: regionType || 'local', // 선택 필드, 문자열, 기본값 'local'
        product_details: cleanProductDetails, // 선택 필드, JSON 오브젝트
        creator: userId                    // 필수 필드, 현재 로그인한 사용자 ID
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
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`;
      console.log('공구 등록 API URL:', apiUrl);
      console.log('공구 등록 요청 데이터:', JSON.stringify(apiRequestData, null, 2));
      
      // 디버깅을 위한 요청 데이터 로깅
      console.log('===== 요청 형식 및 베어된 값 확인 =====');
      console.log('product (productId):', productId, typeof productId);
      console.log('title:', values.title.trim(), typeof values.title);
      console.log('description:', safeDescription, typeof safeDescription);
      console.log('min_participants:', minPart, typeof minPart);
      console.log('max_participants:', maxPart, typeof maxPart);
      console.log('end_time:', endTimeValue, typeof endTimeValue);
      console.log('region_type:', regionType || 'local');
      console.log('product_details:', JSON.stringify(cleanProductDetails));
      
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
      
      // tokenUtils를 사용하여 인증된 API 요청 수행
      console.log('API 요청 발송:', apiUrl);
      console.log('JSON.stringify 결과:', JSON.stringify(apiRequestData));
      
      const result = await tokenUtils.fetchWithAuth(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(apiRequestData),
      });
      
      console.log('공구 등록 응답:', result);
      
      console.log('공구 등록 성공:', result);
      
      // 성공 Toast 메시지 (단순 텍스트로 변경하여 하이드레이션 문제 해결)
      toast({
        variant: 'default',
        title: '공구 등록 성공',
        description: '공구가 성공적으로 등록되었습니다. 잠시 후 마이페이지로 이동합니다.',
        className: "border-green-200 bg-green-50"
      });
      
      // 두 번째 토스트 메시지로 이동 버튼 안내
      toast({
        variant: 'default',
        title: '이동 옵션',
        description: '마이페이지 또는 공구 목록으로 이동하시겠습니까?',
        action: (
          <ToastAction altText="마이페이지" onClick={() => router.push('/mypage')}>
            마이페이지
          </ToastAction>
        ),
      });

      // 마이페이지로 자동 리다이렉트 (3초 후)
      setTimeout(() => {
        router.push('/mypage');
      }, 3000);
      
    } catch (error: any) {
      console.error('공구 등록 실패:', error);
      
      // 오류 응답 내용 상세 로깅
      if (error.response) {
        try {
          // 응답 원본 확인
          const responseText = await error.response.text();
          console.error('원래 응답 데이터:', responseText);
          console.error('원래 헤더:', error.response.status, error.response.headers);
          console.error('오류 발생 요청 데이터:', JSON.stringify(apiRequestData, null, 2));
          
          // JSON으로 파싱 시도
          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.error('백엔드 오류 상세:', errorData);
            
            // 필드별 오류 메시지 표시
            if (typeof errorData === 'object') {
              const errorMessages = Object.entries(errorData)
                .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                .join('\n');
              
              toast({
                variant: 'destructive',
                title: '공구 등록 실패',
                description: errorMessages || '서버에서 오류가 발생했습니다.',
              });
              return;
            }
          } catch (parseError) {
            console.error('JSON 파싱 실패:', parseError);
            // 응답이 JSON이 아닌 경우
            toast({
              variant: 'destructive',
              title: '공구 등록 실패',
              description: responseText || '서버 오류가 발생했습니다.',
            });
            return;
          }
        } catch (responseError) {
          console.error('응답 읽기 실패:', responseError);
        }
      }
      setIsSubmitting(false);
      
      // 인증 오류 처리
      if (error.message === 'Not authenticated' || error.message === 'No access token available') {
        toast({
          variant: 'destructive',
          title: '로그인 필요',
          description: '세션이 만료되었습니다. 다시 로그인해주세요.'
        });
        router.push('/login');
        return;
      }
      
      // 오류 응답 상세 처리
      if (error.response) {
        if (error.response?.status === 400) {
          // 요청 데이터 문제 처리
          const errorData = error.response.data || {};
          const errorMessage = errorData.detail || '입력 정보를 확인해주세요.';
          
          toast({
            variant: "destructive",
            title: '입력 오류',
            description: errorMessage,
          });
          
          // 필드별 오류 처리
          if (typeof errorData === 'object') {
            Object.keys(errorData).forEach(key => {
              form.setError(key as any, {
                type: 'manual',
                message: Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key]
              });
            });
          }
          return;
        }
        
        if (error.response?.status === 401) {
          toast({
            variant: "destructive",
            title: '인증 오류',
            description: "로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.",
          });
          
          // 토큰 무효화 후 로그인 페이지로 리디렉션
          setTimeout(() => {
            router.push('/login');
          }, 1500);
          return;
        }
        
        if (error.response?.status === 403) {
          toast({
            variant: "destructive",
            title: '권한 오류',
            description: "이 작업을 수행할 권한이 없습니다.",
          });
          return;
        }
        
        if (error.response?.status === 500) {
          toast({
            variant: "destructive",
            title: '서버 오류',
            description: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          });
          return;
        }
      }
      
      // 기본 오류 처리
      toast({
        variant: 'destructive',
        title: '공구 등록 실패',
        description: '공구 등록 중 오류가 발생했습니다. 다시 시도해주세요.'
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

  return (
    <Card className="w-full max-w-4xl mx-auto mt-5 mb-10">
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
                            form.setValue('telecom', '');
                            form.setValue('purchase_type', '');
                            form.setValue('plan_price', '');
                            form.setValue('rental_period', '');
                            form.setValue('billing_cycle', '');
                          } else if (categoryType === 'rental') {
                            form.setValue('telecom', '');
                            form.setValue('purchase_type', '');
                            form.setValue('plan_price', '');
                            form.setValue('manufacturer', '');
                            form.setValue('warranty', '');
                            form.setValue('billing_cycle', '');
                          } else if (categoryType === 'subscription') {
                            form.setValue('telecom', '');
                            form.setValue('purchase_type', '');
                            form.setValue('plan_price', '');
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
                              {product.name}
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
                        name="telecom"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="통신사 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sk">SK</SelectItem>
                                  <SelectItem value="kt">KT</SelectItem>
                                  <SelectItem value="lg">LG</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="purchase_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="가입유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="기기변경">기기변경</SelectItem>
                                  <SelectItem value="번호이동">번호이동</SelectItem>
                                  <SelectItem value="신규가입">신규가입</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="plan_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="요금제 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5만원대">5만원대</SelectItem>
                                  <SelectItem value="6만원대">6만원대</SelectItem>
                                  <SelectItem value="7만원대">7만원대</SelectItem>
                                  <SelectItem value="8만원대">8만원대</SelectItem>
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>공구 제목</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="공구 제목을 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                            const hours = values[0];
                            setSliderHours(hours);
                            const now = new Date();
                            const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
                            form.setValue('end_time_option', 'slider');
                            setEndTimeOption('slider');
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
                          <SelectItem value="12hours">12시걠4 후 마감</SelectItem>
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-lg font-medium text-lg cursor-pointer" 
              disabled={isSubmitting || form.formState.isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
  );
}
