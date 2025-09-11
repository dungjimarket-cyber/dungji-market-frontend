/**
 * 중고폰 등록 페이지
 * /used/create
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUsedPhoneProfileCheck } from '@/hooks/useUsedPhoneProfileCheck';
import UsedPhoneProfileCheckModal from '@/components/common/UsedPhoneProfileCheckModal';
import { PHONE_BRANDS, CONDITION_GRADES, BATTERY_STATUS_LABELS } from '@/types/used';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { searchRegionsByName, type Region } from '@/lib/api/regionService';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';
import { errorLogger } from '@/lib/errorLogger';

// 모바일 디버그 패널 (클라이언트 사이드에서만 로드)
const MobileDebugPanel = dynamic(
  () => import('@/components/common/MobileDebugPanel'),
  { ssr: false }
);

// 이미지 미리보기 타입
interface ImagePreview {
  file: File | null;
  url: string;
  isMain: boolean;
  isEmpty?: boolean;
}

// 선택된 지역 타입
interface SelectedRegion {
  province: string;
  city: string;
}

export default function CreateUsedPhonePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const {
    isCheckingProfile,
    isProfileComplete,
    missingFields,
    checkProfile,
    showProfileModal,
    setShowProfileModal,
  } = useUsedPhoneProfileCheck();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [canRegister, setCanRegister] = useState(true);
  const [penaltyEnd, setPenaltyEnd] = useState<string | null>(null);
  
  // 다중 지역 선택 관련 상태
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    storage: '',
    color: '',
    price: '',
    min_offer_price: '',
    accept_offers: true,  // 항상 true로 설정
    condition_grade: '',
    condition_description: '',
    battery_status: '',
    body_only: false,  // 본체만 옵션 추가
    has_box: false,
    has_charger: false,
    has_earphones: false,
    description: '', // 추가 설명용 - 현재 사용 안함
    region: '',  // Region ID
    meeting_place: '',
  });

  // 가격 포맷팅 헬퍼 함수
  const formatPrice = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    
    // 숫자를 원화 형식으로 변환
    return parseInt(numbers).toLocaleString('ko-KR');
  };

  // 가격 언포맷팅 헬퍼 함수
  const unformatPrice = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  // 페이지 진입 시 프로필 체크 및 등록 제한 체크
  useEffect(() => {
    if (isAuthenticated) {
      checkProfile();
      checkRegistrationLimit();
    }
  }, [isAuthenticated, checkProfile]);

  // 등록 가능 여부 체크 (활성 상품 5개 제한 및 패널티)
  const checkRegistrationLimit = async () => {
    try {
      setCheckingLimit(true);
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/check-limit/`
        : `${baseUrl}/api/used/phones/check-limit/`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to check limit');
      
      const data = await response.json();
      
      setActiveCount(data.active_count || 0);
      setCanRegister(data.can_register || false);
      setPenaltyEnd(data.penalty_end || null);
      
      if (!data.can_register) {
        if (data.penalty_end) {
          const penaltyTime = new Date(data.penalty_end);
          const now = new Date();
          const hoursLeft = Math.ceil((penaltyTime.getTime() - now.getTime()) / (1000 * 60 * 60));
          
          toast({
            title: '등록 제한',
            description: `패널티 적용 중입니다. ${hoursLeft}시간 후 등록 가능합니다.`,
            variant: 'destructive',
          });
        } else if (data.active_count >= 5) {
          toast({
            title: '등록 제한',
            description: '활성 상품이 5개에 도달했습니다. 기존 상품을 삭제하거나 판매 완료 후 등록 가능합니다.',
            variant: 'destructive',
          });
        }
      }
      
    } catch (error) {
      console.error('Failed to check registration limit:', error);
      // 에러 시에도 등록 페이지는 볼 수 있도록 함
      setCanRegister(true);
    } finally {
      setCheckingLimit(false);
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, replaceIndex?: number) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (replaceIndex !== undefined) {
      // 특정 슬롯에 이미지 교체/추가
      const newImage: ImagePreview = {
        file: files[0],
        url: URL.createObjectURL(files[0]),
        isMain: replaceIndex === 0,
        isEmpty: false
      };
      
      setImages(prev => {
        const updated = [...prev];
        // 해당 위치에 이미지가 이미 있는지 확인
        if (replaceIndex < updated.length) {
          updated[replaceIndex] = newImage;
        } else {
          // 새 위치에 추가 (빈 슬롯 채우기)
          while (updated.length < replaceIndex) {
            updated.push({
              file: null,
              url: '',
              isMain: false,
              isEmpty: true
            });
          }
          updated.push(newImage);
        }
        return updated;
      });
    } else {
      // 새 이미지 추가 (다음 빈 슬롯에)
      const actualImageCount = images.filter(img => img && !img.isEmpty).length;
      
      if (actualImageCount + files.length > 5) {
        toast({
          title: '이미지 개수 초과',
          description: '최대 5장까지 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }
      
      const newImages = files.map((file, index) => ({
        file,
        url: URL.createObjectURL(file),
        isMain: actualImageCount === 0 && index === 0,
        isEmpty: false
      }));

      setImages(prev => {
        const updated = [...prev];
        // 빈 슬롯 채우기
        let addedCount = 0;
        for (let i = 0; i < 5 && addedCount < newImages.length; i++) {
          if (!updated[i] || updated[i].isEmpty) {
            updated[i] = newImages[addedCount];
            addedCount++;
          }
        }
        // 남은 이미지가 있으면 추가
        if (addedCount < newImages.length) {
          updated.push(...newImages.slice(addedCount));
        }
        return updated.slice(0, 5); // 최대 5개로 제한
      });
    }
  }, [images, toast]);

  // 이미지 삭제 (빈 슬롯으로 변경)
  const handleImageRemove = useCallback((index: number) => {
    setImages(prev => {
      const updated = [...prev];
      // 이미지를 삭제하고 빈 슬롯으로 변경
      updated[index] = {
        file: null,
        url: '',
        isMain: index === 0,
        isEmpty: true
      };
      return updated;
    });
  }, []);

  // 대표 이미지 설정
  const handleSetMainImage = useCallback((index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isMain: i === index,
    })));
  }, []);

  // 폼 입력 핸들러
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 다중 지역 선택 핸들러
  const handleRegionSelectionChange = useCallback((regions: SelectedRegion[]) => {
    setSelectedRegions(regions);
  }, []);

  // 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast({
        title: '로그인 필요',
        description: '상품 등록은 로그인 후 이용 가능합니다.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    // 등록 제한 실시간 체크 (사용자가 등록 버튼을 눌렀을 때 최신 상태 확인)
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/check-limit/`
        : `${baseUrl}/api/used/phones/check-limit/`;
      
      const checkResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (checkResponse.ok) {
        const limitData = await checkResponse.json();
        
        if (!limitData.can_register) {
          if (limitData.penalty_end) {
            const penaltyTime = new Date(limitData.penalty_end);
            const now = new Date();
            const hoursLeft = Math.ceil((penaltyTime.getTime() - now.getTime()) / (1000 * 60 * 60));
            
            toast({
              title: '등록 제한',
              description: `패널티 적용 중입니다. ${hoursLeft}시간 후 등록 가능합니다.`,
              variant: 'destructive',
            });
          } else if (limitData.active_count >= 5) {
            toast({
              title: '동시 판매 제한',
              description: `현재 판매 중인 상품이 ${limitData.active_count}개입니다. 최대 5개까지만 동시 판매 가능합니다. 기존 상품을 삭제하거나 판매 완료 후 등록해주세요.`,
              variant: 'destructive',
              duration: 5000,
            });
          }
          return;
        }
      }
    } catch (error) {
      console.error('Failed to check registration limit:', error);
      // 체크 실패 시에도 등록 시도는 계속 진행 (서버에서 최종 확인)
    }

    // 프로필 완성도 체크 (중고폰용)
    const profileComplete = await checkProfile();
    if (!profileComplete) {
      setShowProfileModal(true);
      return;
    }

    // 유효성 검사 - 첫 번째 슬롯(대표 이미지) 필수
    if (images.length === 0 || !images[0] || images[0].isEmpty) {
      toast({
        title: '대표 이미지를 등록해주세요',
        description: '첫 번째 슬롯에 대표 이미지가 필수입니다.',
        variant: 'destructive',
      });
      return;
    }
    
    // 실제 이미지가 있는지 확인
    const actualImages = images.filter(img => img && !img.isEmpty);
    if (actualImages.length === 0) {
      toast({
        title: '이미지를 등록해주세요',
        description: '최소 1장 이상의 상품 이미지가 필요합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.brand) {
      toast({
        title: '브랜드를 선택해주세요',
        description: '상품의 브랜드를 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.model) {
      toast({
        title: '모델명을 입력해주세요',
        description: '상품의 모델명을 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.storage) {
      toast({
        title: '저장공간을 선택해주세요',
        description: '상품의 저장공간 용량을 선택하거나 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.color) {
      toast({
        title: '색상을 입력해주세요',
        description: '상품의 색상을 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.price) {
      toast({
        title: '즉시 판매가를 입력해주세요',
        description: '상품의 즉시 판매가를 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.min_offer_price) {
      toast({
        title: '최소 제안가를 입력해주세요',
        description: '최소 제안 가격을 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    // 최소 제안가가 즉시 판매가보다 높거나 같은지 체크
    if (parseInt(formData.min_offer_price) >= parseInt(formData.price)) {
      toast({
        title: '최소 제안가를 확인해주세요',
        description: '최소 제안가는 즉시 판매가보다 낮아야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.condition_grade) {
      toast({
        title: '상태 등급을 선택해주세요',
        description: 'S급부터 C급 중 상품 상태를 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.battery_status) {
      toast({
        title: '배터리 상태를 선택해주세요',
        description: '배터리 성능 상태를 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    // 구성품 체크 (최소 하나는 선택)
    if (!formData.body_only && !formData.has_box && !formData.has_charger && !formData.has_earphones) {
      toast({
        title: '구성품을 선택해주세요',
        description: '본체만 또는 포함된 구성품을 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedRegions.length === 0) {
      toast({
        title: '거래 가능 지역을 선택해주세요',
        description: '최소 1개 이상의 거래 가능 지역을 선택해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.meeting_place) {
      toast({
        title: '거래 요청사항을 입력해주세요',
        description: '거래 장소나 시간대 등의 요청사항을 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.condition_description || formData.condition_description.length < 10) {
      toast({
        title: '제품 상태 및 설명을 입력해주세요',
        description: '제품 상태와 설명을 10자 이상 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // FormData 생성
      const uploadData = new FormData();
      
      // 이미지 추가 (빈 슬롯 제외)
      const actualImages = images.filter(img => img && !img.isEmpty && img.file);
      actualImages.forEach((img, index) => {
        uploadData.append('images', img.file!);  // ! operator since we filtered for img.file
        if (img.isMain) {
          uploadData.append('mainImageIndex', index.toString());
        }
      });

      // 폼 데이터 추가 (region 필드 제외, 타입별 처리)
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'region') {
          // boolean 값은 항상 전송 (false도 전송해야 함)
          if (typeof value === 'boolean') {
            uploadData.append(key, value.toString());
          } 
          // 숫자 필드 처리 (빈 문자열이 아닌 경우만)
          else if ((key === 'price' || key === 'min_offer_price' || key === 'storage') && value !== '') {
            // 숫자로 변환 가능한 경우만 전송
            const numValue = parseInt(value.toString());
            if (!isNaN(numValue)) {
              uploadData.append(key, numValue.toString());
            }
          }
          // 나머지 필드 (빈 문자열이 아닌 경우만 전송)
          else if (value !== '' && value !== undefined && value !== null) {
            uploadData.append(key, value.toString());
          }
        }
      });

      // 지역 정보 추가
      if (selectedRegions.length > 0) {
        // regions 필드 - 다중 지역 (추후 처리용)
        selectedRegions.forEach((region) => {
          uploadData.append('regions', `${region.province} ${region.city}`);
        });
        
        // region 필드 - 단일 지역 (현재 필수 필드)
        // 첫 번째 선택 지역을 기본 지역으로 설정
        try {
          const primaryRegion = selectedRegions[0];
          // 지역명으로 실제 지역 코드 찾기
          const searchName = primaryRegion.city || primaryRegion.province;
          const regions = await searchRegionsByName(searchName);
          
          if (regions && regions.length > 0) {
            // 가장 정확한 매칭 찾기
            const exactMatch = regions.find(r => 
              r.full_name.includes(primaryRegion.province) && 
              r.full_name.includes(primaryRegion.city)
            ) || regions[0];
            
            uploadData.append('region', exactMatch.code);
            console.log('Region code found:', exactMatch.code, exactMatch.full_name);
          } else {
            // 기본값 사용
            uploadData.append('region', '11');  // 서울특별시 코드
            console.log('Region not found, using default: Seoul');
          }
        } catch (error) {
          console.error('Failed to fetch region code:', error);
          uploadData.append('region', '11');  // 서울특별시 코드
        }
      } else {
        // 지역을 선택하지 않은 경우 기본값 설정
        uploadData.append('region', '11');  // 서울특별시 코드
        console.log('No region selected, using default: Seoul');
      }

      // API 설정
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/`
        : `${baseUrl}/api/used/phones/`;

      // 디버깅용 FormData 내용 출력
      console.log('===== 전송할 FormData =====');
      console.log('Base URL:', baseUrl);
      console.log('Final API URL:', apiUrl);
      console.log('Token 존재:', !!token);
      console.log('FormData 내용:');
      for (let [key, value] of uploadData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      console.log('=============================')
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData,
      });

      console.log('Response status:', response.status);
      console.log('Response statusText:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: errorText };
        }
        console.error('===== API 에러 응답 =====');
        console.error('Status:', response.status);
        console.error('Error Data:', errorData);
        console.error('=============================')
        
        // 상세한 오류 메시지 처리
        let errorMessage = '상품 등록에 실패했습니다.';
        
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (typeof errorData === 'object') {
          // 필드별 오류 처리
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      toast({
        title: '등록 완료',
        description: '상품이 성공적으로 등록되었습니다.',
      });

      // 상세 페이지로 이동
      router.push(`/used/${data.id}`);
      
    } catch (error) {
      console.error('Registration failed:', error);
      
      // 에러 로깅
      errorLogger.log(error instanceof Error ? error : new Error(String(error)), {
        page: 'used/create',
        formData: Object.fromEntries(
          Object.entries(formData).filter(([_, v]) => v !== '' && v !== false)
        ),
        imageCount: images.length,
        regionCount: selectedRegions.length
      });
      
      let errorMessage = '상품 등록 중 오류가 발생했습니다.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // 네트워크 오류 체크
        if (error.message.includes('fetch')) {
          errorMessage = '서버 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
        }
        // 인증 오류 체크
        else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
        }
        // 권한 오류 체크
        else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          errorMessage = '권한이 없습니다.';
        }
        // 서버 오류 체크
        else if (error.message.includes('500') || error.message.includes('Internal')) {
          errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
      }
      
      // 화면에 에러 표시 (더 눈에 띄게)
      const copyLogs = confirm(`등록 실패!\n\n${errorMessage}\n\n'확인'을 누르면 오류 로그를 클립보드에 복사합니다.\n'취소'를 누르면 디버그 패널(🐛)을 확인하세요.`);
      
      if (copyLogs) {
        const copied = await errorLogger.copyToClipboard();
        if (copied) {
          alert('오류 로그가 클립보드에 복사되었습니다.\n메모장에 붙여넣기(Ctrl+V)하여 확인하거나 개발자에게 전달해주세요.');
        }
      }
      
      toast({
        title: '등록 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">중고폰 판매 등록</h1>

        {/* 활성 상품 개수 표시 */}
        {!checkingLimit && activeCount > 0 && (
          <div className={`border rounded-lg p-4 mb-6 ${
            activeCount >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-dungji-secondary border-dungji-primary-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activeCount >= 5 ? 'bg-amber-100' : 'bg-dungji-secondary-light'
                }`}>
                  <span className={`text-sm font-semibold ${
                    activeCount >= 5 ? 'text-amber-700' : 'text-dungji-primary-700'
                  }`}>{activeCount}</span>
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    activeCount >= 5 ? 'text-amber-900' : 'text-dungji-primary-900'
                  }`}>
                    활성 상품 {activeCount}/5개
                  </p>
                  <p className={`text-xs ${
                    activeCount >= 5 ? 'text-amber-700' : 'text-dungji-primary-700'
                  }`}>
                    {activeCount >= 5 ? '상품 등록 제한에 도달했습니다' : '최대 5개까지 동시 판매 가능'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 이미지 업로드 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Label className="text-lg font-semibold mb-4 block">
              상품 이미지 <span className="text-red-500">*</span>
            </Label>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {/* 이미지 미리보기 슬롯 */}
              {[...Array(5)].map((_, index) => {
                const image = images[index];
                
                if (image && !image.isEmpty) {
                  return (
                    <div key={index} className="relative aspect-square group">
                      <input
                        type="file"
                        id={`image-replace-${index}`}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, index)}
                      />
                      
                      <Image
                        src={image.url}
                        alt={`상품 이미지 ${index + 1}`}
                        fill
                        className="object-cover rounded-lg cursor-pointer"
                        onClick={() => setPreviewImage(image.url)}
                      />
                      
                      {/* 호버 시 오버레이 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg pointer-events-none" />
                      
                      {/* 대표 이미지 표시 */}
                      {image.isMain && (
                        <div className="absolute top-2 left-2 bg-dungji-primary text-white px-2 py-1 text-xs rounded font-medium">
                          대표
                        </div>
                      )}
                      
                      {/* 액션 버튼들 - 모바일에서는 X만, PC에서는 전체 버튼 */}
                      <div className="absolute bottom-2 right-2 sm:left-2 sm:right-2 flex gap-1">
                        {/* PC에서만 변경/대표 버튼 표시 */}
                        <div className="hidden sm:flex gap-1 flex-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <label
                            htmlFor={`image-replace-${index}`}
                            className="flex-1 bg-white/90 backdrop-blur text-xs py-1 rounded hover:bg-white text-center cursor-pointer"
                          >
                            변경
                          </label>
                          {!image.isMain && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetMainImage(index);
                              }}
                              className="flex-1 bg-white/90 backdrop-blur text-xs py-1 rounded hover:bg-white"
                            >
                              대표
                            </button>
                          )}
                        </div>
                        {/* X 버튼은 모바일/PC 모두 표시 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageRemove(index);
                          }}
                          className="bg-red-500/90 backdrop-blur text-white px-2 py-1 rounded hover:bg-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // 빈 슬롯
                  const actualImageCount = images.filter(img => img && !img.isEmpty).length;
                  const isNextSlot = index === actualImageCount;
                  const isFirstSlot = index === 0;
                  const canUpload = isFirstSlot || (isNextSlot && actualImageCount > 0);
                  
                  return (
                    <label
                      key={index}
                      className={`relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
                        canUpload
                          ? 'border-gray-300 hover:border-dungji-primary bg-gray-50 hover:bg-dungji-secondary cursor-pointer'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      {/* 첫 번째 슬롯에 대표 표시 */}
                      {isFirstSlot && (
                        <div className="absolute top-2 left-2 bg-dungji-primary text-white px-2 py-1 text-xs rounded font-medium z-10">
                          대표
                        </div>
                      )}
                      
                      {canUpload ? (
                        <>
                          <Camera className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">{index + 1}/5</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple={isNextSlot && !isFirstSlot}
                            onChange={(e) => {
                              if (isFirstSlot && (!images[0] || images[0].isEmpty)) {
                                // 첫 번째 슬롯이 비어있으면 교체
                                handleImageUpload(e, 0);
                              } else {
                                handleImageUpload(e);
                              }
                            }}
                            className="hidden"
                            disabled={loading || !canUpload}
                          />
                        </>
                      ) : (
                        <div className="text-gray-300">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-xs">{index + 1}/5</span>
                        </div>
                      )}
                    </label>
                  );
                }
              })}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              * <span className="font-semibold">첫 번째 슬롯(대표)에 반드시 이미지를 등록해주세요.</span>
              * 최대 5장까지 등록 가능합니다. (각 3MB 이하)
              * 전면, 후면, 측면, 모서리 사진을 포함하면 신뢰도가 높아집니다.
              * 흠집이나 파손 부위는 선명하게 촬영해주세요.
              * 이미지를 클릭하면 크게 볼 수 있습니다.
            </p>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 브랜드 */}
              <div>
                <Label htmlFor="brand">브랜드 <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.brand} 
                  onValueChange={(value) => handleInputChange('brand', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PHONE_BRANDS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 모델명 */}
              <div>
                <Label htmlFor="model">모델명 <span className="text-red-500">*</span></Label>
                <Input
                  id="model"
                  placeholder="예: iPhone 15 Pro"
                  value={formData.model}
                  onChange={(e) => {
                    if (e.target.value.length <= 50) {
                      handleInputChange('model', e.target.value);
                    }
                  }}
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.model.length}/50자</p>
              </div>

              {/* 저장공간 */}
              <div>
                <Label htmlFor="storage">저장공간 <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.storage === '64' || formData.storage === '128' || formData.storage === '256' || formData.storage === '512' || formData.storage === '1024' ? formData.storage : 'custom'} 
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      handleInputChange('storage', '');
                    } else {
                      handleInputChange('storage', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="64">64GB</SelectItem>
                    <SelectItem value="128">128GB</SelectItem>
                    <SelectItem value="256">256GB</SelectItem>
                    <SelectItem value="512">512GB</SelectItem>
                    <SelectItem value="1024">1TB</SelectItem>
                    <SelectItem value="custom">직접 입력</SelectItem>
                  </SelectContent>
                </Select>
                {/* 직접 입력 필드 */}
                {(formData.storage !== '64' && formData.storage !== '128' && formData.storage !== '256' && formData.storage !== '512' && formData.storage !== '1024') && (
                  <Input
                    type="number"
                    placeholder="저장공간을 입력하세요 (GB)"
                    value={formData.storage}
                    onChange={(e) => handleInputChange('storage', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* 색상 */}
              <div>
                <Label htmlFor="color">색상 <span className="text-red-500">*</span></Label>
                <Input
                  id="color"
                  placeholder="예: 스페이스 블랙"
                  value={formData.color}
                  onChange={(e) => {
                    if (e.target.value.length <= 30) {
                      handleInputChange('color', e.target.value);
                    }
                  }}
                  maxLength={30}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.color.length}/30자</p>
              </div>
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">가격 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 즉시 판매가 */}
              <div>
                <Label htmlFor="price">즉시 판매가 <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  type="text"
                  placeholder="0"
                  value={formatPrice(formData.price)}
                  onChange={(e) => {
                    const unformatted = unformatPrice(e.target.value);
                    handleInputChange('price', unformatted);
                  }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  즉시 판매가 입력 시 해당 금액이 제출되면 판매완료로 전환됩니다
                </p>
              </div>

              {/* 최소 제안 가격 */}
              <div>
                <Label htmlFor="min_offer_price">최소 제안 가격 <span className="text-red-500">*</span></Label>
                <Input
                  id="min_offer_price"
                  type="text"
                  placeholder="0"
                  value={formatPrice(formData.min_offer_price)}
                  onChange={(e) => {
                    const unformatted = unformatPrice(e.target.value);
                    // 즉시 판매가보다 낮은지 체크
                    if (formData.price && parseInt(unformatted) >= parseInt(formData.price)) {
                      toast({
                        title: '최소 제안가는 즉시 판매가보다 낮아야 합니다',
                        description: '즉시 판매가보다 낮게 입력 부탁드립니다.',
                        variant: 'destructive',
                      });
                      return;
                    }
                    handleInputChange('min_offer_price', unformatted);
                  }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  즉시 판매가보다 낮게 입력해주세요
                </p>
              </div>
            </div>

            {/* 가격 정보 표시 */}
            {formData.price && formData.min_offer_price && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">즉시 판매가:</span>
                  <span className="font-medium">{parseInt(formData.price).toLocaleString('ko-KR')}원</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">최소 제안가:</span>
                  <span className="font-medium">{parseInt(formData.min_offer_price).toLocaleString('ko-KR')}원</span>
                </div>
              </div>
            )}
          </div>

          {/* 상태 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">상태 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 상태 등급 */}
              <div>
                <Label htmlFor="condition_grade">상태 등급 <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.condition_grade} 
                  onValueChange={(value) => handleInputChange('condition_grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_GRADES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  <div><span className="font-medium">S급:</span> 사용감 거의 없음, 미세 기스 이하</div>
                  <div><span className="font-medium">A급:</span> 생활기스 있으나 깨끗한 상태</div>
                  <div><span className="font-medium">B급:</span> 사용감 있음, 모서리 찍힘 등</div>
                  <div><span className="font-medium">C급:</span> 사용감 많음, 기능 정상</div>
                </div>
              </div>

              {/* 배터리 상태 */}
              <div>
                <Label htmlFor="battery_status">배터리 상태 <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.battery_status} 
                  onValueChange={(value) => handleInputChange('battery_status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BATTERY_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  iPhone: 설정 → 배터리 → 배터리 성능 상태<br/>
                  Android: 설정 → 디바이스 케어 → 배터리
                </p>
              </div>
            </div>

            {/* 구성품 */}
            <div>
              <Label className="mb-3 block">구성품 <span className="text-red-500">*</span></Label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.body_only}
                    onChange={(e) => {
                      const isBodyOnly = e.target.checked;
                      handleInputChange('body_only', isBodyOnly);
                      // 본체만 선택 시 다른 구성품 체크 해제
                      if (isBodyOnly) {
                        handleInputChange('has_box', false);
                        handleInputChange('has_charger', false);
                        handleInputChange('has_earphones', false);
                      }
                    }}
                    className="rounded"
                  />
                  <span className="font-medium text-orange-600">본체만</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${formData.body_only ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.has_box}
                    onChange={(e) => handleInputChange('has_box', e.target.checked)}
                    disabled={formData.body_only}
                    className="rounded"
                  />
                  <span>박스</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${formData.body_only ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.has_charger}
                    onChange={(e) => handleInputChange('has_charger', e.target.checked)}
                    disabled={formData.body_only}
                    className="rounded"
                  />
                  <span>충전기</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${formData.body_only ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.has_earphones}
                    onChange={(e) => handleInputChange('has_earphones', e.target.checked)}
                    disabled={formData.body_only}
                    className="rounded"
                  />
                  <span>이어폰</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.body_only ? '폰 본체만 거래합니다' : '포함된 구성품을 모두 선택해주세요'}
              </p>
            </div>

            {/* 제품 상태 및 설명 - 통합 */}
            <div className="space-y-2">
              <Label htmlFor="condition_description">제품 상태 및 설명 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Textarea
                  id="condition_description"
                  placeholder="제품의 상태를 자세히 설명해주세요\n예: 기스, 찍힘, 배터리 성능, 기능 이상 유무 등\n구매자가 제품 상태를 정확히 파악할 수 있도록 작성해주세요"
                  value={formData.condition_description}
                  onChange={(e) => {
                    if (e.target.value.length <= 2000) {
                      handleInputChange('condition_description', e.target.value);
                    }
                  }}
                  rows={6}
                  className="min-h-[150px] resize-y"
                  maxLength={2000}
                />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  최소 10자 이상 입력해주세요
                </p>
                <p className={`text-xs ${formData.condition_description.length >= 1900 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.condition_description.length}/2000자
                </p>
              </div>
            </div>
          </div>

          {/* 거래 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">거래 정보</h2>
            
            {/* 거래 가능 지역 선택 */}
            <div className="space-y-2">
              <Label>거래 가능 지역 <span className="text-red-500">*</span></Label>
              <p className="text-sm text-gray-500 mb-2">최대 3개 지역까지 선택 가능합니다</p>
              <MultiRegionDropdown
                maxSelections={3}
                onSelectionChange={handleRegionSelectionChange}
                selectedRegions={selectedRegions}
              />
            </div>
            
            {/* 거래 요청사항 */}
            <div className="space-y-2">
              <Label htmlFor="meeting_place">거래 요청사항 <span className="text-red-500">*</span></Label>
              <Textarea
                id="meeting_place"
                placeholder="예: 강남역 10번 출구 선호, 평일 저녁만 가능, 주말 오전 가능 등"
                value={formData.meeting_place}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    handleInputChange('meeting_place', e.target.value);
                  }
                }}
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">구체적인 거래 장소나 시간대를 입력해주세요</p>
                <p className="text-xs text-gray-500">{formData.meeting_place.length}/500자</p>
              </div>
            </div>

            {/* 상품 설명 - 주석 처리 */}
            {/* <div>
              <Label htmlFor="description">상품 설명</Label>
              <Textarea
                id="description"
                placeholder="상품에 대한 추가 설명을 작성해주세요"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
              />
            </div> */}
          </div>

          {/* 안내 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">⚠️ 주의사항</span><br/>
              • 가격 제안이 들어온 후에는 즉시 판매가와 설명만 수정 가능합니다<br/>
              • 제품 정보, 상태, 거래 지역은 변경할 수 없으니 신중하게 입력해주세요
            </p>
          </div>

          {/* 등록 버튼 */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || checkingLimit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? '등록 중...' : checkingLimit ? '확인 중...' : '등록하기'}
            </Button>
          </div>
        </form>
      </div>

      {/* 중고폰용 프로필 체크 모달 */}
      <UsedPhoneProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          router.push('/used');
        }}
        missingFields={missingFields}
        onUpdateProfile={() => {
          router.push('/mypage');
        }}
      />

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={previewImage}
              alt="이미지 미리보기"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-800 p-2 rounded-full hover:bg-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      
      {/* 모바일 디버그 패널 */}
      <MobileDebugPanel />
    </div>
  );
}