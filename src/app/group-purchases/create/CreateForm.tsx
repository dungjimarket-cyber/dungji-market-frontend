'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProfileCheck } from '@/hooks/useProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
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
import { SmartphoneIcon, TvIcon, BoxIcon, CreditCardIcon, AlertCircleIcon, CheckCircle2, AlertTriangleIcon, WifiIcon, MonitorIcon } from "lucide-react";
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
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';

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
}

interface CreateFormProps {
  mode?: 'create' | 'edit';
  initialData?: any;
  groupBuyId?: string;
}

/**
 * 폼 유효성 검증 스키마
 * 카테고리별 필드 유효성 검증 로직 포함
 */
const getFormSchema = (mode: string) => z.object({
  product: mode === 'edit' ? z.string().optional() : z.string().min(1, {
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
  region_type: z.enum(['local', 'nationwide']).default('local'),
  region: z.string().optional(),
  region_name: z.string().optional(),
  
  // 다중 지역 선택을 위한 필드
  selected_regions: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      full_name: z.string().optional(),
      level: z.number().optional()
    })
  ).max(2, {
    message: '공구 지역은 최대 2곳까지 선택 가능합니다',
  }).optional().default([]),
  
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
  sliderHours?: number;      // 슬라이더로 선택한 시간(시간)
  customHours?: number;      // 사용자 지정 시간(시간)
  
  // 지역 관련 필드
  region_type: string;
  region?: string;          // 지역 코드 (단일 지역 호환용)
  region_name?: string;     // 지역 이름 (단일 지역 호환용)
  
  // 다중 지역 선택을 위한 필드
  selected_regions?: {
    code: string;
    name: string;
    full_name?: string;
    level?: number;
  }[];
  
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
  
  // 렌털 상품 관련 필드
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
    case 'internet':
      return 'bg-cyan-50 border-cyan-200';
    case 'internet_tv':
      return 'bg-indigo-50 border-indigo-200';
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
      return '휴대폰';
    case 'electronics':
      return '가전 제품';
    case 'rental':
      return '렌탈 상품';
    case 'subscription':
      return '구독 서비스';
    case 'internet':
      return '인터넷';
    case 'internet_tv':
      return '인터넷+TV';
    default:
      return '휴대폰';
  }
};

/**
 * 카테고리 설명을 반환하는 함수
 */
const getCategoryDescription = (categoryType?: string): string => {
  switch (categoryType) {
    case 'telecom':
      return '📱 통신사, 가입유형, 요금제를 선택하시고 최고의 지원금을 받아보세요!';
    case 'electronics':
      return '제조사와 보증 기간 정보를 입력하여 가전 제품 공동구매를 시작하세요.';
    case 'rental':
      return '렌탈 기간을 선택하여 더 저렴한 조건으로 렌탈 상품을 이용하세요.';
    case 'subscription':
      return '결제 주기를 선택하여 구독 서비스를 더 유리한 조건으로 이용하세요.';
    case 'internet':
      return '🌐 통신사와 가입유형을 선택하고 최고의 인터넷 지원금을 받아보세요!';
    case 'internet_tv':
      return '📺 인터넷+TV 결합상품으로 더 큰 혜택을 받아보세요!';
    default:
      return '📱 통신사, 가입유형, 요금제를 선택하시고 최고의 지원금을 받아보세요!';
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
    case 'internet':
      return <WifiIcon className="h-5 w-5 text-cyan-500" />;
    case 'internet_tv':
      return <MonitorIcon className="h-5 w-5 text-indigo-500" />;
    default:
      return <SmartphoneIcon className="h-5 w-5 text-blue-500" />;
  }
};

/**
 * 공구 등록 폼 컴포넌트
 * JWT 기반 인증을 사용하여 판매자 권한 확인 및 데이터 처리
 */
export default function CreateForm({ mode = 'create', initialData, groupBuyId }: CreateFormProps = {}) {
  // JWT 기반 인증 컨텍스트 사용
  const { user, isAuthenticated, isLoading, accessToken } = useAuth();
  // 프로필 체크 Hook 사용
  const { 
    checkProfile, 
    showProfileModal, 
    setShowProfileModal, 
    missingFields,
    clearCache 
  } = useProfileCheck();
  // 인증 상태를 NextAuth와 호환되는 status 변수로 변환
  const status = isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated';
  const router = useRouter();
  
  // 사용자 정보 로딩 완료 상태
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [manufacturerFilter, setManufacturerFilter] = useState<'samsung' | 'apple' | null>(null);
  const [endTimeOption, setEndTimeOption] = useState<string>('24hours');
  const [sliderHours, setSliderHours] = useState<number>(24);
  const [customHours, setCustomHours] = useState<number>(24);
  const [endTimeValue, setEndTimeValue] = useState<string>('');
  const [regionType, setRegionType] = useState<'local'|'nationwide'>('local');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
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
  
  // 중복 공구 알림 다이얼로그 상태
  const [showDuplicateProductDialog, setShowDuplicateProductDialog] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogMessage, setErrorDialogMessage] = useState('');
  
  // 성공 다이얼로그 상태
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdGroupBuyId, setCreatedGroupBuyId] = useState<number | null>(null);
  const [createdProductName, setCreatedProductName] = useState('');
  const [createdProductImage, setCreatedProductImage] = useState('');
  
  // 공구 제목 자동 생성 함수
  const generateTitle = () => {
    const productName = selectedProduct?.name || '공동구매';
    const regionText = selectedRegion?.name ? `[${selectedRegion.name}]` : '';
    return `${regionText} ${productName} 공동구매`;
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(getFormSchema(mode)),
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

  useEffect(() => {
    // 인증 상태 및 사용자 역할 확인
    if (isLoading) {
      console.log('[CreateForm] 인증 상태 로딩 중...');
      return; // 로딩 중에는 아무 작업도 수행하지 않음
    }
    
    // 인증 상태 디버깅
    console.log('[CreateForm] 인증 상태:', { 
      isAuthenticated, 
      isLoading,
      user, 
      accessToken: accessToken ? '토큰 있음' : '토큰 없음',
      tokenLength: accessToken?.length
    });
    
    // 아직 인증 상태 로딩 중이면 대기
    if (isLoading) {
      console.log('[CreateForm] 인증 상태 로딩 중...');
      return;
    }
    
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
    if (!isAuthenticated && localToken && !isLoading) {
      console.log('[CreateForm] 토큰은 있지만 인증 상태가 false, 재확인 중...');
      // 약간의 지연 후 다시 확인 (AuthContext 초기화 대기)
      const checkTimer = setTimeout(() => {
        if (!isAuthenticated && !isLoading) {
          console.log('[CreateForm] 여전히 인증되지 않음, 새로고침');
          window.location.reload();
        }
      }, 1000);
      
      return () => clearTimeout(checkTimer);
    }
    
    // 사용자 정보가 아직 로드되지 않은 경우 대기
    if (isAuthenticated && !user) {
      console.log('[CreateForm] 사용자 정보 로딩 대기 중...');
      return;
    }
    
    // 로딩 상태가 아니고 인증된 상태이지만 사용자 정보가 여전히 불완전한 경우 추가 대기
    if (!isLoading && isAuthenticated && user && (!user.id || user.id === undefined)) {
      console.log('[CreateForm] 사용자 정보가 불완전함, 추가 대기 중...');
      return;
    }
    
    // 사용자 정보가 완전히 로드되었는지 확인하고 상태 업데이트
    if (isAuthenticated && user && user.id && !userDataLoaded) {
      // 사용자 정보가 완전히 로드되었을 때 추가 지연을 통해 확실하게 처리
      const delayTimer = setTimeout(() => {
        setUserDataLoaded(true);
      }, 100); // 100ms 지연으로 확실한 로딩 완료 대기
      
      return () => clearTimeout(delayTimer);
    }
    
    // userDataLoaded가 false이면 아직 검증하지 않음
    if (isAuthenticated && !userDataLoaded) {
      console.log('[CreateForm] 사용자 데이터 로딩 완료 대기 중...');
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
      return;
    }
    
    // 프로필 체크 실행
    if (user) {
      checkProfile().then((isComplete) => {
        if (!isComplete) {
          setShowProfileModal(true);
        }
      });
    }
    
    // 휴대폰 번호 검증 (필요한 경우만)
    if (user?.role === 'buyer' && !user.phone_number) {
      if (confirm('공구를 등록하기 위해서는 휴대폰 번호 정보를 업데이트 해주세요.\n\n확인을 누르시면 내 정보 설정 페이지로 이동합니다.')) {
        router.push('/mypage/settings');
        return;
      }
      // 취소를 누른 경우 이전 페이지로
      router.back();
      return;
    }
  }, [router, isLoading, isAuthenticated, user, userDataLoaded]);

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
          // 출시일 기준 최신순 정렬 (release_date가 없는 경우 맨 뒤로)
          const sortedProducts = tokenResponse.sort((a, b) => {
            if (!a.release_date && !b.release_date) return 0;
            if (!a.release_date) return 1;
            if (!b.release_date) return -1;
            return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
          });
          setProducts(sortedProducts);
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

    const fetchRegions = async () => {
      try {
        // 최상위 지역(시/도) 데이터 가져오기
        const rootRegions = await getRegions({ root_only: true });
        setRegions(rootRegions);
      } catch (error) {
        console.error('지역 데이터 가져오기 오류:', error);
        toast({
          variant: 'destructive',
          title: '지역 정보 로드 오류',
          description: '지역 정보를 불러오는 중 오류가 발생했습니다.',
        });
      }
    };

    fetchProducts();
    fetchRegions();
  }, []);

  // 수정 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      console.log('초기 데이터 설정:', initialData);
      console.log('초기 제품 정보:', initialData.product);
      console.log('초기 제품 ID:', initialData.product_id);
      console.log('초기 지역 정보:', initialData.regions);
      console.log('초기 통신 상세:', initialData.telecom_detail);
      
      // 폼 필드 설정
      form.setValue('product', initialData.product_id?.toString() || '');
      form.setValue('title', initialData.title || '');
      form.setValue('description', initialData.description || '');
      form.setValue('min_participants', initialData.min_participants || 1);
      form.setValue('max_participants', initialData.max_participants || 5);
      
      // 제품 정보 설정
      if (initialData.product) {
        setSelectedProduct(initialData.product);
        // products 목록이 로드되었고 product가 있으면 form에도 설정
        if (products.length > 0) {
          const productInList = products.find(p => p.id === initialData.product.id);
          if (productInList) {
            form.setValue('product', productInList.id.toString());
          }
        }
      }
      
      // 마감 시간 설정
      if (initialData.end_time) {
        form.setValue('end_time', initialData.end_time);
        form.setValue('end_time_option', 'slider');
        setEndTimeOption('slider');
        
        // 현재 시간과 마감 시간의 차이를 계산하여 슬라이더 값 설정
        const now = new Date();
        const endTime = new Date(initialData.end_time);
        const diffHours = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        // 6~48시간 범위 내로 제한
        const hours = Math.max(6, Math.min(48, diffHours));
        setSliderHours(hours);
        form.setValue('sliderHours', hours);
        console.log('마감까지 남은 시간:', diffHours, '시간 -> 슬라이더 값:', hours);
      }
      
      // 지역 타입 설정
      if (initialData.region_type) {
        setRegionType(initialData.region_type);
      }
      
      // 지역 정보 설정
      if (initialData.regions && initialData.regions.length > 0) {
        setSelectedRegions(initialData.regions);
      }
      
      // 통신 상품 정보 설정
      if (initialData.telecom_detail) {
        form.setValue('telecom_carrier', initialData.telecom_detail.telecom_carrier);
        form.setValue('subscription_type', initialData.telecom_detail.subscription_type);
        
        // plan_info를 SelectItem value 형식으로 변환
        const planInfo = initialData.telecom_detail.plan_info;
        let telecomPlan = '';
        if (planInfo === '5만원대') telecomPlan = '5G_standard';
        else if (planInfo === '6만원대') telecomPlan = '5G_basic_plus';
        else if (planInfo === '7만원대') telecomPlan = '5G_premium';
        else if (planInfo === '8만원대') telecomPlan = '5G_premium_plus';
        else if (planInfo === '9만원대') telecomPlan = '5G_special';
        else if (planInfo === '10만원이상') telecomPlan = '5G_platinum';
        
        form.setValue('telecom_plan', telecomPlan);
        console.log('변환된 요금제:', planInfo, '->', telecomPlan);
      }
    }
  }, [mode, initialData, form, products]);
  
  /**
   * 지역 검색 핸들러
   */
  const handleRegionSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchRegionsByName(term);
      setSearchResults(results);
    } catch (error) {
      console.error('지역 검색 오류:', error);
      toast({
        variant: 'destructive',
        title: '지역 검색 오류',
        description: '지역 검색 중 오류가 발생했습니다.',
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  /**
   * 지역 선택 핸들러 - 다중 지역 선택 지원
   */
  const handleRegionSelect = (region: Region) => {
    // 이미 선택된 지역인지 확인
    const isAlreadySelected = selectedRegions.some(r => r.code === region.code);
    
    if (isAlreadySelected) {
      toast({
        variant: 'default',
        title: '이미 선택된 지역',
        description: `${region.name} 지역은 이미 선택되었습니다.`,
      });
      setSearchTerm('');
      setSearchResults([]);
      return;
    }
    
    // 최대 2개 지역 제한 확인
    if (selectedRegions.length >= 2) {
      setRegionError('공구 지역은 최대 2곳까지만 선택 가능합니다.');
      toast({
        variant: 'destructive',
        title: '지역 선택 제한',
        description: '공구 지역은 최대 2곳까지만 선택 가능합니다.',
      });
      setSearchTerm('');
      setSearchResults([]);
      return;
    }
    
    // 시/군/구 레벨의 지역만 선택 가능
    if (region.level !== 2) {
      toast({
        variant: 'default',
        title: '지역 선택 안내',
        description: '시/군/구 레벨의 지역만 선택 가능합니다.',
      });
      return;
    }
    
    // 새 지역 추가
    const updatedRegions = [...selectedRegions, region];
    setSelectedRegions(updatedRegions);
    
    // 호환성을 위해 첫 번째 지역은 기존 필드에도 설정
    if (updatedRegions.length === 1) {
      setSelectedRegion(region);
      form.setValue('region', region.code);
      form.setValue('region_name', region.name);
    }
    
    // 다중 지역 필드 업데이트
    form.setValue('selected_regions', updatedRegions);
    
    // 검색창 초기화
    setSearchTerm('');
    setSearchResults([]);
    setRegionError('');
  };
  
  /**
   * 선택된 지역 삭제 핸들러
   */
  const handleRemoveRegion = (regionCode: string) => {
    const updatedRegions = selectedRegions.filter(r => r.code !== regionCode);
    setSelectedRegions(updatedRegions);

    // 호환성을 위해 기존 필드 업데이트
    if (updatedRegions.length === 0) {
      setSelectedRegion(null);
      form.setValue('region', '');
      form.setValue('region_name', '');
    } else {
      // 첫 번째 지역을 대표 지역으로 설정
      setSelectedRegion(updatedRegions[0]);
      form.setValue('region', updatedRegions[0].code);
      form.setValue('region_name', updatedRegions[0].name);
    }

    // 다중 지역 필드 업데이트
    form.setValue('selected_regions', updatedRegions);

    // 지역 선택 에러 메시지 초기화
    if (updatedRegions.length < 2) {
      setRegionError('');
    }
  };

/**
 * 사용자 ID가 확인된 후 폼 제출을 계속하는 함수
 * 여러 소스에서 사용자 ID를 추출한 후 실제 API 요청을 처리
 */
const continueSubmitWithUserId = async (
  userId: string | number,
  values: FormData,
  currentProductId: number,
  calculatedEndTimeKST: string,
  safeTitle: string,
  safeDescription: string,
  minPart: number,
  maxPart: number,
  regionType: string,
  cleanProductDetails: Record<string, any>,
  selectedRegions: Region[]
) => {
  try {
    // 백엔드 API 요구사항에 정확히 맞춘 요청 객체
    const apiRequestData: any = {
      product: currentProductId,           // 필수 필드, 수치
      title: safeTitle,                   // 필수 필드, 문자열 (자동 생성된 제목)
      description: safeDescription,       // 선택 필드, 문자열 (자동 생성된 설명)
      min_participants: minPart,          // 필수 필드, 수치, 최소 1
      max_participants: maxPart,          // 필수 필드, 수치, 최소 1
      end_time: calculatedEndTimeKST,     // 필수 필드, 날짜/시간 문자열
      region_type: regionType || 'local', // 선택 필드, 문자열, 기본값 'local'
      product_details: cleanProductDetails, // 백엔드에서 이 키를 사용하여 통신사 정보 추출
      // 다중 지역 정보를 regions 배열로 전송
      regions: regionType === 'local' ? selectedRegions.map(region => ({
        code: region.code,
        name: region.name,
        full_name: region.full_name || region.name,
        level: region.level || 2
      })) : []
    };
    
    // Only include creator field when creating, not updating
    if (mode !== 'edit') {
      apiRequestData.creator = userId; // 필수 필드, 현재 로그인한 사용자 ID
    }
    
    // 최종 API 요청 데이터 로깅
    console.log('최종 API 요청 데이터:', JSON.stringify(apiRequestData, null, 2));
    if (mode !== 'edit') {
      console.log('사용자 ID 확인:', apiRequestData.creator);
    }
    console.log('[regions 데이터 상세]:', apiRequestData.regions);
    
    // 공구 등록/수정 API 요청 실행
    console.log(`공구 ${mode === 'edit' ? '수정' : '등록'} API 요청 시작`);
    const apiUrl = mode === 'edit' && groupBuyId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/`
      : `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/`;
    
    const response = await tokenUtils.fetchWithAuth(apiUrl, {
      method: mode === 'edit' ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestData),
    });
    
    console.log(`공구 ${mode === 'edit' ? '수정' : '등록'} 성공:`, response);
    
    if (mode === 'edit') {
      // 수정 모드일 때는 기존처럼 토스트 메시지 표시 후 이동
      toast({
        title: '공구 수정 성공',
        description: '공구가 성공적으로 수정되었습니다.',
        className: "border-green-200 bg-green-50",
        duration: 3000,
      });
      
      setTimeout(() => {
        router.push(`/groupbuys/${groupBuyId}`);
      }, 1500);
    } else {
      // 생성 모드일 때는 성공 다이얼로그 표시
      const groupBuyId = response && typeof response === 'object' && 'id' in response ? response.id : null;
      
      if (groupBuyId) {
        // 상품 정보 설정
        setCreatedGroupBuyId(Number(groupBuyId));
        setCreatedProductName(selectedProduct?.name || apiRequestData.title || '');
        setCreatedProductImage(selectedProduct?.image_url || '');
        setShowSuccessDialog(true);
        setIsSubmitting(false); // 성공 다이얼로그 표시 시 로딩 상태 해제
      } else {
        // ID를 받지 못한 경우 기존처럼 처리
        toast({
          title: '공구 등록 성공',
          description: '공구가 성공적으로 등록되었습니다.',
          className: "border-green-200 bg-green-50",
          duration: 3000,
        });
        
        setTimeout(() => {
          router.push('/group-purchases');
        }, 1500);
      }
    }
    
    return true;
  } catch (apiError: unknown) {
    console.error('===== API 요청 실패 상세 정보 =====');
    console.error('오류 객체:', apiError);
    console.error('오류 메시지:', (apiError as Error).message);
    console.error('오류 스택:', (apiError as Error).stack);
    console.error('오류 타입:', typeof apiError);
    console.error('Error instanceof Error:', apiError instanceof Error);
    
    // 에러 메시지 추출
    let errorMessage = '공구 등록 중 오류가 발생했습니다.';
    let errorTitle = '공구 등록 실패';
    
    if (apiError instanceof Error) {
      // fetchWithAuth에서 던진 사용자 친화적 메시지 사용
      errorMessage = apiError.message;
      
      // 중복 상품 공구 참여 불가 메시지 처리
      console.log('에러 메시지 체크:', errorMessage);
      console.log('중복 체크 결과:', errorMessage.includes('이미 해당 상품으로 진행 중인 공동구매가 있습니다'));
      
      if (errorMessage.includes('이미 해당 상품으로 진행 중인 공동구매가 있습니다')) {
        console.log('중복 상품 에러 감지 - 팝업 표시');
        
        errorTitle = '중복 상품 등록 제한';
        errorMessage = '동일한 상품은 등록이 제한됩니다.';
        
        // AlertDialog를 통한 오류 표시
        setErrorDialogTitle(errorTitle);
        setErrorDialogMessage(errorMessage);
        setShowDuplicateProductDialog(true);
        
        // sonner 토스트도 함께 표시
        sonnerToast.error(errorMessage, { 
          id: 'duplicate-product-error',
        });
        
        // 기본 toast도 함께 표시
        toast({
          variant: 'destructive',
          title: errorTitle,
          description: errorMessage,
        });
        
        return false;
      } else {
        // 기타 오류는 기본 토스트로 표시
        toast({
          variant: 'destructive',
          title: errorTitle,
          description: errorMessage,
        });
        
        // sonner 토스트도 함께 표시
        sonnerToast.error(errorTitle, { 
          description: errorMessage 
        });
      }
    } else {
      // 기본 토스트 표시
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorMessage,
      });
      
      // sonner 토스트도 함께 표시
      sonnerToast.error(errorTitle, { 
        description: errorMessage 
      });
    }
    
    // 오류 발생 시에만 로딩 상태 해제
    setIsSubmitting(false);
    return false;
  }
  // finally 블록 제거 - 성공 시에는 페이지 이동 전까지 로딩 상태 유지
};

/**
 * 폼 제출 핸들러
 */
const onSubmit = async (values: FormData) => {
  console.log('폼 제출 시작 - 값:', values);
  
  // 일반회원의 경우 주소 체크 (휴대폰번호는 선택사항)
  if (user?.role === 'buyer' && !user.address_region) {
    if (confirm('공구를 등록하기 위해서는 활동지역 입력이 필요합니다.\n\n내 정보 설정 페이지로 이동하시겠습니까?')) {
      router.push('/mypage/settings');
    }
    return;
  }
  
  setIsSubmitting(true);

  // API 요청 데이터 및 상품 세부 정보 변수 선언
  let apiRequestData: Record<string, any> = {};
  let productDetails: Record<string, any> = {};

  try {
    // 사용자 인증 상태 확인 - AuthContext를 우선적으로 사용하고, 필요시 다른 소스에서 추출
    console.log('인증 상태 확인 시작 - 사용자 ID 추출 시도');
    
    // 1. AuthContext에서 사용자 정보 확인 (가장 신뢰할 수 있는 소스)
    console.log('useAuth 훅 사용자 정보:', user);
    const authContextUserId = user?.id;
    console.log('useAuth에서 추출한 사용자 ID:', authContextUserId);
    
    // 2. NextAuth 세션에서 사용자 ID 확인 (두 번째 우선순위)
    let sessionUserId = null;
    if (!authContextUserId) {
      const session = await getSession();
      console.log('NextAuth 세션 정보:', session);
      sessionUserId = session?.user?.id;
      console.log('세션에서 추출한 사용자 ID:', sessionUserId);
    }
    
    // 3. 토큰 기반 사용자 ID 추출 (세 번째 우선순위)
    let tokenUserId = null;
    if (!authContextUserId && !sessionUserId) {
      // tokenUtils 사용하여 사용자 ID 추출 시도
      tokenUserId = tokenUtils.getUserIdFromToken();
      console.log('토큰에서 추출한 사용자 ID:', tokenUserId);
    }
    
    // 모든 소스에서 찾은 사용자 ID 중 첫 번째 유효한 값 사용
    const userId = authContextUserId || sessionUserId || tokenUserId;
    console.log('최종 결정된 사용자 ID:', userId);

    // 사용자 인증 상태 처리
    if (!userId) {
      console.error('인증되지 않음 또는 사용자 ID를 찾을 수 없음');
      
      // 마감 시간 계산
      const currentDate = new Date();
      let endTime = new Date(currentDate);
      
      if (values.end_time_option === 'slider' || values.end_time_option === '24hours') {
        // 슬라이더 값(시간)을 현재 시간에 더함
        const hoursToAdd = values.sliderHours || sliderHours;
        endTime = new Date(currentDate.getTime() + (typeof hoursToAdd === 'number' ? hoursToAdd : 24) * 60 * 60 * 1000);
      } else if (values.end_time_option === 'custom' && values.end_time) {
        // 사용자 지정 날짜/시간 사용
        endTime = new Date(values.end_time);
      }
      
      // 초단위를 0으로 버림 처리
      endTime.setSeconds(0, 0);
      
      // 계산된 마감 시간을 한국 시간 문자열로 변환하여 endTimeValue 상태 업데이트
      const calculatedEndTimeKST = toKSTString(endTime);
      console.log('계산된 마감 시간 KST 문자열:', calculatedEndTimeKST);
      setEndTimeValue(calculatedEndTimeKST); // 상태 업데이트
      
      // 현재 선택된 상품 ID 확인
      const currentProductId = parseInt(values.product);
      
      // 제목과 설명 안전하게 처리
      const safeTitle = generateTitle();
      const safeDescription = values.description || '';
      
      // 참여자 수 정보
      const minPart = values.min_participants;
      const maxPart = values.max_participants;
      
      // 상품 상세 정보 준비
      let cleanProductDetails = {};
      
      // 마지막 시도: 백엔드 API에서 프로필 정보 직접 가져오기
      try {
        const token = localStorage.getItem('dungji_auth_token') || 
                     localStorage.getItem('accessToken') || 
                     localStorage.getItem('auth.token');
                     
        if (token) {
          console.log('백엔드 API에서 프로필 정보 직접 가져오기 시도...');
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/profile/`;
          const profileResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('백엔드에서 프로필 정보 가져오기 성공:', profileData);
            
            if (profileData.id) {
              console.log('백엔드 API에서 사용자 ID 추출 성공:', profileData.id);
              // 사용자 ID를 찾았으므로 계속 진행
              const backendUserId = profileData.id;
              
              // 로컬 스토리지에 사용자 정보 업데이트 - AuthContext가 다음에 사용할 수 있도록
              const userDataToStore = {
                id: backendUserId,
                email: profileData.email || '',
                username: profileData.username || '',
                role: profileData.role || 'buyer'
              };
              localStorage.setItem('user', JSON.stringify(userDataToStore));
              localStorage.setItem('auth.user', JSON.stringify(userDataToStore));
              
              // 이 ID로 계속 진행
              return await continueSubmitWithUserId(backendUserId, values, currentProductId, calculatedEndTimeKST, safeTitle, safeDescription, minPart, maxPart, regionType, cleanProductDetails, selectedRegions);
            }
          } else {
            console.error('백엔드 프로필 API 호출 실패:', profileResponse.status);
          }
        }
      } catch (profileError) {
        console.error('백엔드 프로필 정보 가져오기 오류:', profileError);
      }
      
      // 모든 시도 실패 시 사용자에게 알림
      toast({
        variant: 'destructive',
        title: '로그인 필요',
        description: '공구 등록을 위해서는 로그인이 필요합니다. 다시 로그인해주세요.',
      });
      router.push('/login?callbackUrl=/group-purchases/create');
      setIsSubmitting(false);
      return;
    }

    // 마감 시간 계산
    const currentDate = new Date();
    let endTime = new Date(currentDate);
    
    if (values.end_time_option === 'slider' || values.end_time_option === '24hours') {
      // 슬라이더 값(시간)을 현재 시간에 더함
      const hoursToAdd = values.sliderHours || sliderHours;
      console.log('제출 시 슬라이더 값:', values.sliderHours, '상태 값:', sliderHours, '최종 사용 값:', hoursToAdd);
      endTime = new Date(currentDate.getTime() + (typeof hoursToAdd === 'number' ? hoursToAdd : 24) * 60 * 60 * 1000);
    } else if (values.end_time_option === 'custom' && values.end_time) {
      // 사용자 지정 날짜/시간 사용
      endTime = new Date(values.end_time);
    }
    
    // 초단위를 0으로 버림 처리
    endTime.setSeconds(0, 0);
    
    // 계산된 마감 시간을 한국 시간 문자열로 변환
    const calculatedEndTimeKST = toKSTString(endTime);
    console.log('계산된 마감 시간 한국 시간 문자열:', calculatedEndTimeKST);
    setEndTimeValue(calculatedEndTimeKST); // 상태 업데이트
    
    // 현재 선택된 상품 ID 확인
    const currentProductId = parseInt(values.product);
    
    // API 요청 데이터 구성
    apiRequestData = {
      product: currentProductId,
      title: generateTitle(), // 자동 생성된 제목 사용
      min_participants: values.min_participants,
      max_participants: values.max_participants,
      end_time: calculatedEndTimeKST, // 조정된 시간 사용
      description: values.description || '',
      // 다중 지역 지원
      region_type: regionType,
      // 후방 호환성을 위해 기존 region, region_name 필드 유지
      region: regionType === 'local' ? (selectedRegions.length > 0 ? selectedRegions[0].code : null) : null,
      region_name: regionType === 'local' ? (selectedRegions.length > 0 ? selectedRegions[0].name : null) : null,
      // 다중 지역 정보를 regions 배열로 전송
      regions: regionType === 'local' ? selectedRegions.map(region => ({
        // 이미 변환된 code 사용 (시도_시군구 형식)
        code: region.code,
        name: region.name,
        full_name: region.full_name || region.name,
        level: region.level || 1  // 시/군/구 레벨
      })) : [],
    };
      
      // 선택된 상품의 카테고리에 따라 다른 세부 정보 추가
      if (!selectedProduct || selectedProduct.category?.detail_type === 'telecom' || !selectedProduct.category?.detail_type) {
        productDetails = {
          telecom_carrier: values.telecom_carrier || '',
          telecom_plan: values.telecom_plan || '', // 백엔드에서 product_details.telecom_plan을 찾기 때문에 plan_info가 아닌 telecom_plan 사용
          subscription_type: values.subscription_type || '',
          contract_period: '24개월' // 약정기간 24개월로 고정
        };
        console.log('통신사 정보 전송:', productDetails);
      } else if (selectedProduct.category?.detail_type === 'internet' || selectedProduct.category?.detail_type === 'internet_tv') {
        productDetails = {
          telecom_carrier: values.telecom_carrier || '',
          subscription_type: values.subscription_type || '',
          contract_period: '36개월' // 인터넷은 약정기간 36개월로 고정
        };
        console.log('인터넷 정보 전송:', productDetails);
      } else if (selectedProduct.category?.detail_type === 'electronics') {
        productDetails = {
          manufacturer: values.manufacturer || '',
          warranty_period: values.warranty_period || ''
        };
      } else if (selectedProduct.category?.detail_type === 'rental') {
        productDetails = {
          rental_period: values.rental_period || ''
        };
      } else if (selectedProduct.category?.detail_type === 'subscription') {
        productDetails = {
          payment_cycle: values.payment_cycle || ''
        };
      }
      
      // 자동으로 제목과 설명 생성
      const generatedTitle = generateTitle();
      const generatedDescription = `${generatedTitle} 공구입니다.`.trim();
      
      // 수치 필드는 반드시 수치로 변환
      const minPart = typeof values.min_participants === 'string' ? parseInt(values.min_participants, 10) : values.min_participants;
      const maxPart = typeof values.max_participants === 'string' ? parseInt(values.max_participants, 10) : values.max_participants;
      
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
      
      // 사용자 ID가 확인되었으므로 API 요청 데이터 구성 및 제출 함수 호출
      return await continueSubmitWithUserId(userId, values, currentProductId, calculatedEndTimeKST, safeTitle, safeDescription, minPart, maxPart, regionType, cleanProductDetails, selectedRegions);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
      <p className="text-xl font-bold text-blue-700">{mode === 'edit' ? '공구 수정 중...' : '공구 등록 중...'}</p>
      <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
      <div className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
  );
  
  return (
    <div className="container">
      {duplicateGroupBuyDialog}
      
      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={clearCache}
      />
      
      <Card className="w-full max-w-4xl mx-auto mt-5 mb-10 relative">
        {loadingOverlay}
        
        <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-center mb-1">{mode === 'edit' ? '공구 수정하기' : '공구 등록하기'}</CardTitle>
        <CardDescription className="text-center text-gray-500">
          {mode === 'edit' ? '공구 정보를 수정하세요' : '새로운 공동구매를 시작하세요'}
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
            {mode === 'edit' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <AlertCircleIcon className="inline-block h-4 w-4 mr-2" />
                  수정 가능한 항목: <strong>지역{initialData?.current_participants > 1 ? '' : ', 참여 인원, 마감 시간'}</strong>만 변경할 수 있습니다.
                </p>
                {initialData?.current_participants > 1 && (
                  <p className="text-sm text-orange-600 mt-2">
                    <AlertCircleIcon className="inline-block h-4 w-4 mr-2" />
                    참여자가 있어 참여 인원과 마감 시간은 수정할 수 없습니다.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-6">
              <h3 className="text-lg font-medium">기기 선택</h3>
              
              {/* 제조사 카테고리 버튼 */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setManufacturerFilter('samsung');
                    // Reset selection if current selection doesn't match filter
                    const currentProduct = products.find(p => p.id.toString() === form.getValues('product'));
                    if (currentProduct && !currentProduct.name.toLowerCase().includes('갤럭시') && !currentProduct.name.toLowerCase().includes('galaxy')) {
                      form.setValue('product', '');
                      setSelectedProduct(null);
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    manufacturerFilter === 'samsung' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  갤럭시
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManufacturerFilter('apple');
                    // Reset selection if current selection doesn't match filter
                    const currentProduct = products.find(p => p.id.toString() === form.getValues('product'));
                    if (currentProduct && !currentProduct.name.toLowerCase().includes('아이폰') && !currentProduct.name.toLowerCase().includes('iphone')) {
                      form.setValue('product', '');
                      setSelectedProduct(null);
                    }
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    manufacturerFilter === 'apple' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  아이폰
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setManufacturerFilter(null);
                  }}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    manufacturerFilter === null 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
              </div>

              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select 
                        disabled={mode === 'edit'}
                        value={field.value}
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
                          <SelectValue placeholder="상품을 선택해주세요">
                            {field.value && selectedProduct ? selectedProduct.name : "상품을 선택해주세요"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5}>
                          {products
                            .filter((product) => {
                              if (!manufacturerFilter) return true;
                              const productName = product.name.toLowerCase();
                              if (manufacturerFilter === 'samsung') {
                                return productName.includes('갤럭시') || productName.includes('galaxy');
                              }
                              if (manufacturerFilter === 'apple') {
                                return productName.includes('아이폰') || productName.includes('iphone');
                              }
                              return true;
                            })
                            .map((product) => (
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
                  onClick={() => {
                    setRegionType('nationwide');
                    setSelectedRegion(null);
                    form.setValue('region', '');
                    form.setValue('region_name', '');
                  }}
                >
                  전국(비대면)
                </button>
              </div>
              
              {/* 지역 선택 UI - 지역 타입이 'local'일 때만 표시 */}
              {regionType === 'local' && (
                <div className="mt-4 space-y-4">
                  <MultiRegionDropdown
                    maxSelections={2}
                    selectedRegions={selectedRegions.map(r => {
                      const parts = r.name.split(' ');
                      return {
                        province: parts[0] || '',
                        city: parts.slice(1).join(' ') || ''
                      };
                    })}
                    onSelectionChange={(regions) => {
                      // 드롭다운 선택 데이터를 기존 형식으로 변환
                      const convertedRegions = regions.map((r) => ({
                        code: `${r.province}_${r.city}`,
                        name: `${r.province} ${r.city}`,
                        full_name: `${r.province} ${r.city}`,
                        level: 2,
                        is_active: true  // 기본값으로 true 설정
                      }));
                      
                      setSelectedRegions(convertedRegions);
                      
                      // 폼 값 업데이트
                      form.setValue('selected_regions', convertedRegions);
                      
                      // 호환성을 위해 첫 번째 지역은 기존 필드에도 설정
                      if (convertedRegions.length > 0) {
                        form.setValue('region', convertedRegions[0].code);
                        form.setValue('region_name', convertedRegions[0].name);
                      }
                    }}
                  />
                  
                  {/* 지역 선택 안내 메시지 */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 inline-block mr-1 text-green-600" />
                      🏠 가까운 판매자를 만나보세요
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      원하는 지역 최대 2곳을 선택하면, 해당 지역 판매자만 견적 제안이 가능합니다.
                    </p>
                  </div>
                </div>
              )}
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
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={mode === 'edit'}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="통신사 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="SKT">SK</SelectItem>
                                  <SelectItem value="KT">KT</SelectItem>
                                  <SelectItem value="LGU">LG</SelectItem>
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
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={mode === 'edit'}>
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
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={mode === 'edit'}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="요금제 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5G_standard">5만원대</SelectItem>
                                  <SelectItem value="5G_basic_plus">6만원대</SelectItem>
                                  <SelectItem value="5G_premium">7만원대</SelectItem>
                                  <SelectItem value="5G_premium_plus">8만원대</SelectItem>
                                  <SelectItem value="5G_special">9만원대</SelectItem>
                                  <SelectItem value="5G_platinum">10만원이상</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* 인터넷/인터넷+TV 상품일 경우 */}
                  {(selectedProduct.category?.detail_type === 'internet' || selectedProduct.category?.detail_type === 'internet_tv') && (
                    <>
                      <FormField
                        control={form.control}
                        name="telecom_carrier"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={mode === 'edit'}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="통신사 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="KT">KT</SelectItem>
                                  <SelectItem value="SK">SK브로드밴드</SelectItem>
                                  <SelectItem value="LGU">LG U+</SelectItem>
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
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={mode === 'edit'}>
                                <SelectTrigger className="bg-gray-50 h-12">
                                  <SelectValue placeholder="가입유형 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">신규가입</SelectItem>
                                  <SelectItem value="transfer">통신사이동</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* 인터넷/인터넷+TV 통신사별 상품 알아보기 링크 */}
                      <div className="col-span-2 p-3 bg-green-50 rounded-md border border-green-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">🌐 통신사별 상품 확인하기</h4>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href="https://www.bworld.co.kr/product/internet/charge.do?menu_id=P02010000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            SK브로드밴드 →
                          </a>
                          <a
                            href="https://product.kt.com/wDic/productDetail.do?ItemCode=1505&CateCode=6005&filter_code=118&option_code=170&pageSize=10"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            KT →
                          </a>
                          <a
                            href="https://www.lguplus.com/internet/plan?tab=IN&subtab=all"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-colors"
                          >
                            LG U+ →
                          </a>
                        </div>
                      </div>
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
                              <Input {...field} className="bg-gray-50 h-12" placeholder="제조사" disabled={mode === 'edit'} />
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
                              <Input {...field} className="bg-gray-50 h-12" placeholder="12" type="number" disabled={mode === 'edit'} />
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
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mode === 'edit'}>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={mode === 'edit'}>
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
                
                {/* 휴대폰 카테고리 - 통신사별 요금제 알아보기 링크 */}
                {(selectedProduct?.category?.detail_type === 'telecom' || !selectedProduct?.category?.detail_type) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">📱 통신사별 요금제 확인하기</h4>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="https://www.tworld.co.kr/web/product/plan/list"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        SK텔레콤 →
                      </a>
                      <a
                        href="https://product.kt.com/wDic/index.do?CateCode=6002"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        KT →
                      </a>
                      <a
                        href="https://www.lguplus.com/mobile/plan/mplan/plan-all"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-sm bg-white rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        LG U+ →
                      </a>
                    </div>
                  </div>
                )}
              </div>
              </div>
            )}

            {/* 제목 필드 자동 생성으로 대체 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-md font-medium mb-2">공구 제목</h3>
              {mode === 'edit' ? (
                <p className="text-sm text-gray-800 font-medium">{initialData?.title || '제목 없음'}</p>
              ) : (
                <p className="text-sm text-gray-600">
                  상품명, 통신사, 가입유형, 요금제 정보를 기반으로 자동 생성됩니다.  
                </p>
              )}
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
                          disabled={mode === 'edit' && (initialData?.current_participants || 0) > 1}
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
                          disabled={mode === 'edit' && (initialData?.current_participants || 0) > 1}
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
                          disabled={mode === 'edit' && (initialData?.current_participants || 0) > 1}
                          onValueChange={(values) => {
                            // 슬라이더 값만 처리
                            const sliderValue = values[0];
                            setSliderHours(sliderValue);
                            form.setValue('sliderHours', sliderValue); // 중요: form에도 슬라이더 값 설정
                            form.setValue('end_time_option', 'slider');
                            setEndTimeOption('slider');
                            
                            // 슬라이더 값에 따른 종료 시간 설정
                            const currentTime = new Date();
                            const newEndTime = new Date(currentTime.getTime() + sliderValue * 60 * 60 * 1000);
                            form.setValue('end_time', toKSTString(newEndTime));
                            
                            console.log('슬라이더 값 변경:', sliderValue, '시간');
                            console.log('종료 시간:', toKSTString(newEndTime));
                            
                            // 제품이 선택되어 있을 경우에만 제목/설명 업데이트
                            if (selectedProduct) {
                              const title = generateTitle();
                              const description = `${title} 공구입니다.`;
                              
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
                            
                            // 한국 시간 형식으로 변환
                            form.setValue('end_time', toKSTString(endTime));
                            
                            setEndTimeOption(value);
                            console.log('자동 설정된 마감 시간:', toKSTString(endTime));
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
                  {mode === 'edit' ? '수정 중...' : '등록 중...'}
                </>
              ) : (
                mode === 'edit' ? '공구 수정하기' : '공구 등록하기'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    {/* 중복 공구 알림 다이얼로그 */}
    <AlertDialog open={showDuplicateProductDialog} onOpenChange={setShowDuplicateProductDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{errorDialogTitle}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {errorDialogMessage}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setShowDuplicateProductDialog(false)}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    {/* 공구 생성 성공 다이얼로그 */}
    {createdGroupBuyId && (
      <GroupBuySuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        groupBuyId={createdGroupBuyId}
        productName={createdProductName}
        productImage={createdProductImage}
      />
    )}
    </div>
  );
}