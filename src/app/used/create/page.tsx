/**
 * 중고폰 등록 페이지
 * /used/create
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, AlertCircle, Check, Info, Image as ImageIcon } from 'lucide-react';
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
import { PHONE_BRANDS, CONDITION_GRADES, BATTERY_STATUS_LABELS, BATTERY_STATUS_DESCRIPTIONS } from '@/types/used';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { searchRegionsByName, type Region } from '@/lib/api/regionService';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';
import { errorLogger } from '@/lib/errorLogger';
import { compressImageInBrowser } from '@/lib/api/used/browser-image-utils';

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [canRegister, setCanRegister] = useState(true);
  const [penaltyEnd, setPenaltyEnd] = useState<string | null>(null);

  // 다중 지역 선택 관련 상태
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 입력 필드 refs
  const brandRef = useRef<HTMLButtonElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const storageRef = useRef<HTMLButtonElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const minOfferPriceRef = useRef<HTMLInputElement>(null);
  const conditionGradeRef = useRef<HTMLButtonElement>(null);
  const conditionDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const batteryStatusRef = useRef<HTMLButtonElement>(null);
  const meetingPlaceRef = useRef<HTMLTextAreaElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<HTMLDivElement>(null);
  
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

  // 천원 단위로 맞추기
  const roundToThousand = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return '0';
    return Math.round(num / 1000) * 1000;
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
    // 토큰이 없으면 체크하지 않음
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setCheckingLimit(false);
      return;
    }

    try {
      setCheckingLimit(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/check-limit/`
        : `${baseUrl}/api/used/phones/check-limit/`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Check limit API failed:', response.status);
        // API 실패 시에도 등록은 가능하도록 설정
        setCanRegister(true);
        return;
      }

      const data = await response.json();

      setActiveCount(data.active_count || 0);
      setCanRegister(data.can_register !== false); // undefined도 true로 처리
      setPenaltyEnd(data.penalty_end || null);

      if (!data.can_register) {
        if (data.penalty_end) {
          const endTime = new Date(data.penalty_end);
          const now = new Date();
          const diff = endTime.getTime() - now.getTime();
          const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
          const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const timeStr = endTime.toLocaleTimeString('ko-KR', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });

          toast({
            title: '6시간 패널티 적용 중',
            description: `${timeStr}부터 가능 (${hoursLeft}시간 ${minutesLeft}분 남음)`,
            variant: 'destructive',
          });
        } else if (data.active_count >= 5) {
          toast({
            title: '등록 제한 (5개 초과)',
            description: `판매 중 ${data.active_count}개. 기존 상품 삭제 필요`,
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
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | File[], replaceIndex?: number) => {
    const files = Array.isArray(e) ? e : Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 파일 유효성 검사
    for (const file of files) {
      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        toast({
          title: '지원하지 않는 파일 형식',
          description: '이미지 파일만 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 파일 크기 체크 (3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: '이미지 크기 초과',
          description: `${file.name} 파일이 3MB를 초과합니다.`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (replaceIndex !== undefined) {
      // 특정 슬롯 클릭 시에도 여러 파일 모두 추가
      const actualImageCount = images.filter(img => img && !img.isEmpty).length;

      if (actualImageCount + files.length > 10) {
        toast({
          title: '이미지 개수 초과',
          description: '최대 10장까지 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 기존 대표 이미지가 있는지 확인
      const hasMainImage = images.some(img => img && !img.isEmpty && img.isMain);

      setImages(prev => {
        let updated = [...prev];

        // 첫 번째 슬롯 클릭 시 기존 대표 이미지들 모두 해제
        if (replaceIndex === 0) {
          updated = updated.map(img => ({ ...img, isMain: false }));
        }

        const newImages = files.map((file, index) => ({
          file,
          url: URL.createObjectURL(file),
          // 첫 번째 슬롯 클릭하고 첫 번째 파일이거나, 대표 이미지가 없고 전체 첫 이미지일 때만
          isMain: (replaceIndex === 0 && index === 0) || (!hasMainImage && actualImageCount === 0 && index === 0),
          isEmpty: false
        }));

        let currentIndex = replaceIndex;

        // replaceIndex부터 시작해서 빈 슬롯에 순서대로 채우기
        for (const newImage of newImages) {
          // 현재 위치에 이미지가 있으면 다음 빈 슬롯 찾기
          while (currentIndex < 10 && updated[currentIndex] && !updated[currentIndex].isEmpty) {
            currentIndex++;
          }

          if (currentIndex >= 10) break; // 10장 초과 방지

          // 기존 이미지 URL 정리
          if (updated[currentIndex] && updated[currentIndex].url) {
            URL.revokeObjectURL(updated[currentIndex].url);
          }

          // 빈 슬롯이 없으면 추가
          if (currentIndex >= updated.length) {
            updated.push(newImage);
          } else {
            updated[currentIndex] = newImage;
          }

          currentIndex++;
        }

        return updated;
      });
    } else {
      // 새 이미지 추가 (다음 빈 슬롯에)
      const actualImageCount = images.filter(img => img && !img.isEmpty).length;

      if (actualImageCount + files.length > 10) {
        toast({
          title: '이미지 개수 초과',
          description: '최대 10장까지 업로드 가능합니다.',
          variant: 'destructive',
        });
        return;
      }

      // 기존 대표 이미지가 있는지 확인
      const hasMainImage = images.some(img => img && !img.isEmpty && img.isMain);

      const newImages = files.map((file, index) => ({
        file,
        url: URL.createObjectURL(file),
        // 대표 이미지가 없고 첫 이미지일 때만 대표로 설정
        isMain: !hasMainImage && actualImageCount === 0 && index === 0,
        isEmpty: false
      }));

      setImages(prev => {
        const updated = [...prev];
        // 빈 슬롯 채우기
        let addedCount = 0;
        for (let i = 0; i < 10 && addedCount < newImages.length; i++) {
          if (!updated[i] || updated[i].isEmpty) {
            updated[i] = newImages[addedCount];
            addedCount++;
          }
        }
        // 남은 이미지가 있으면 추가
        if (addedCount < newImages.length) {
          updated.push(...newImages.slice(addedCount));
        }
        return updated.slice(0, 10); // 최대 10개로 제한
      });
    }
  }, [images, toast]);

  // 이미지 삭제 (빈 슬롯으로 변경)
  const handleImageRemove = useCallback((index: number) => {
    setImages(prev => {
      const updated = [...prev];
      // 기존 이미지 URL 정리
      if (updated[index] && updated[index].url) {
        URL.revokeObjectURL(updated[index].url);
      }
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

  // 드래그 앤 드롭 핸들러
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (droppedFiles.length > 0) {
      handleImageUpload(droppedFiles);
    }
  }, [handleImageUpload]);


  // 폼 입력 핸들러
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 입력 시 해당 필드 에러 제거
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 다중 지역 선택 핸들러
  const handleRegionSelectionChange = useCallback((regions: SelectedRegion[]) => {
    setSelectedRegions(regions);
    // 지역 선택 시 에러 제거
    if (errors.regions) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.regions;
        return newErrors;
      });
    }
  }, [errors]);

  // 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이미 처리 중이면 중복 실행 방지
    if (loading) {
      return;
    }

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
            const endTime = new Date(limitData.penalty_end);
            const timeStr = endTime.toLocaleTimeString('ko-KR', {
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            });

            toast({
              title: '6시간 패널티 적용 중',
              description: `${timeStr}부터 등록 가능`,
              variant: 'destructive',
            });
          } else if (limitData.active_count >= 5) {
            toast({
              title: '등록 제한 (5개 초과)',
              description: `판매 중 ${limitData.active_count}개. 기존 상품 삭제 필요`,
              variant: 'destructive',
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

    // 유효성 검사
    const newErrors: Record<string, string> = {};
    let firstErrorRef: React.RefObject<any> | null = null;

    // 이미지 검사
    const actualImages = images.filter(img => img && !img.isEmpty);
    if (actualImages.length === 0) {
      newErrors.images = '최소 1장 이상의 상품 이미지가 필요합니다';
      if (!firstErrorRef) firstErrorRef = imageRef;
    }

    // 브랜드 검사
    if (!formData.brand) {
      newErrors.brand = '브랜드를 선택해주세요';
      if (!firstErrorRef) firstErrorRef = brandRef;
    }

    // 모델명 검사
    if (!formData.model || !formData.model.trim()) {
      newErrors.model = '모델명을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = modelRef;
    } else if (formData.model.length > 50) {
      newErrors.model = '모델명은 최대 50자까지 입력 가능합니다';
      if (!firstErrorRef) firstErrorRef = modelRef;
    }

    // 저장공간 검사
    if (!formData.storage) {
      newErrors.storage = '저장공간을 선택해주세요';
      if (!firstErrorRef) firstErrorRef = storageRef;
    } else {
      const storageNum = parseInt(formData.storage);
      if (isNaN(storageNum)) {
        newErrors.storage = '숫자만 입력 가능합니다';
        if (!firstErrorRef) firstErrorRef = storageRef;
      } else if (storageNum > 9999) {
        newErrors.storage = '최대 9999GB까지 입력 가능합니다';
        if (!firstErrorRef) firstErrorRef = storageRef;
      } else if (storageNum < 1) {
        newErrors.storage = '최소 1GB 이상 입력해주세요';
        if (!firstErrorRef) firstErrorRef = storageRef;
      }
    }

    // 색상 검사
    if (!formData.color || !formData.color.trim()) {
      newErrors.color = '색상을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = colorRef;
    } else if (formData.color.length > 30) {
      newErrors.color = '색상은 최대 30자까지 입력 가능합니다';
      if (!firstErrorRef) firstErrorRef = colorRef;
    }

    // 가격 검사
    if (!formData.price) {
      newErrors.price = '즉시 판매가를 입력해주세요';
      if (!firstErrorRef) firstErrorRef = priceRef;
    } else {
      const price = parseInt(formData.price);
      if (price % 1000 !== 0) {
        newErrors.price = '가격은 천원 단위로 입력해주세요';
        if (!firstErrorRef) firstErrorRef = priceRef;
      } else if (price > 9900000) {
        newErrors.price = '최대 판매 금액은 990만원입니다';
        if (!firstErrorRef) firstErrorRef = priceRef;
      } else if (price < 1000) {
        newErrors.price = '최소 가격은 1,000원입니다';
        if (!firstErrorRef) firstErrorRef = priceRef;
      }
    }

    // 최소 제안가 검사
    if (!formData.min_offer_price) {
      newErrors.min_offer_price = '최소 제안가를 입력해주세요';
      if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
    } else {
      const minPrice = parseInt(formData.min_offer_price);
      if (minPrice % 1000 !== 0) {
        newErrors.min_offer_price = '가격은 천원 단위로 입력해주세요';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      } else if (minPrice > 9900000) {
        newErrors.min_offer_price = '최대 제안 금액은 990만원입니다';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      } else if (minPrice < 1000) {
        newErrors.min_offer_price = '최소 가격은 1,000원입니다';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      } else if (formData.price && minPrice >= parseInt(formData.price)) {
        newErrors.min_offer_price = '최소 제안가는 즉시 판매가보다 낮아야 합니다';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      }
    }

    // 상태 등급 검사
    if (!formData.condition_grade) {
      newErrors.condition_grade = '상태 등급을 선택해주세요';
      if (!firstErrorRef) firstErrorRef = conditionGradeRef;
    }

    // 제품 상태 설명 검사
    if (!formData.condition_description || !formData.condition_description.trim()) {
      newErrors.condition_description = '제품 상태 및 설명을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = conditionDescriptionRef;
    } else if (formData.condition_description.length < 10) {
      newErrors.condition_description = '최소 10자 이상 입력해주세요';
      if (!firstErrorRef) firstErrorRef = conditionDescriptionRef;
    } else if (formData.condition_description.length > 2000) {
      newErrors.condition_description = '최대 2000자까지 입력 가능합니다';
      if (!firstErrorRef) firstErrorRef = conditionDescriptionRef;
    }

    // 배터리 상태 검사
    if (!formData.battery_status) {
      newErrors.battery_status = '배터리 상태를 선택해주세요';
      if (!firstErrorRef) firstErrorRef = batteryStatusRef;
    }

    // 구성품 검사 (최소 하나는 필요)
    if (!formData.has_box && !formData.has_charger && !formData.has_earphones) {
      newErrors.components = '구성품을 최소 1개 이상 선택해주세요';
      if (!firstErrorRef) firstErrorRef = componentsRef;
    }

    // 거래 지역 검사
    if (selectedRegions.length === 0) {
      newErrors.regions = '거래 가능 지역을 최소 1개 이상 선택해주세요';
      if (!firstErrorRef) firstErrorRef = regionRef;
    }

    // 거래시 요청사항 검사
    if (!formData.meeting_place || !formData.meeting_place.trim()) {
      newErrors.meeting_place = '거래시 요청사항을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = meetingPlaceRef;
    } else if (formData.meeting_place.length > 200) {
      newErrors.meeting_place = '최대 200자까지 입력 가능합니다';
      if (!firstErrorRef) firstErrorRef = meetingPlaceRef;
    }

    // 에러가 있으면 처리
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // 첫 번째 에러 필드로 포커스 및 스크롤
      if (firstErrorRef?.current) {
        if ('focus' in firstErrorRef.current) {
          firstErrorRef.current.focus();
        }
        firstErrorRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    // 모든 에러 클리어
    setErrors({});

    setLoading(true);

    try {
      // FormData 생성
      const uploadData = new FormData();
      
      // 이미지 추가 (빈 슬롯 제외, 파일 검증)
      const actualImages = images.filter(img => img && !img.isEmpty && img.file instanceof File);

      // 이미지 검증은 이미 위에서 완료했으므로 여기서는 생략
      if (actualImages.length === 0) {
        setLoading(false);
        return;
      }

      // 이미지 크기 체크 및 압축
      for (const img of actualImages) {
        if (!img.file) continue;
      }

      // 대표 이미지 찾기 (첫 번째 이미지가 기본 대표)
      let mainImageIndex = 0;
      const mainImageFound = actualImages.findIndex(img => img.isMain);
      if (mainImageFound !== -1) {
        mainImageIndex = mainImageFound;
      }

      // 이미지 압축 및 전송
      toast({
        title: '이미지 처리 중...',
        description: '이미지를 압축하고 있습니다. 잠시만 기다려주세요.',
      });

      for (let i = 0; i < actualImages.length; i++) {
        const img = actualImages[i];

        try {
          // 이미지 압축 (85% 품질, 최대 1200x1200)
          const compressedBlob = await compressImageInBrowser(img.file!, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.85,
            format: 'webp'
          });

          // Blob을 File로 변환
          const compressedFile = new File(
            [compressedBlob],
            `image_${i}.webp`,
            { type: 'image/webp' }
          );

          uploadData.append('images', compressedFile);
        } catch (error) {
          console.error(`Failed to compress image ${i + 1}:`, error);
          // 압축 실패 시 원본 사용
          uploadData.append('images', img.file!);
        }
      }

      // 대표 이미지 인덱스 한 번만 전송
      uploadData.append('mainImageIndex', mainImageIndex.toString());

      // 폼 데이터 추가 - 명확한 필드별 처리
      // boolean 필드 - 항상 전송 (false 값도 중요함)
      ['body_only', 'has_box', 'has_charger', 'has_earphones', 'accept_offers'].forEach(key => {
        const value = formData[key as keyof typeof formData];
        uploadData.append(key, value.toString());
      });

      // 숫자 필드 - 값이 있는 경우만 전송
      ['price', 'min_offer_price', 'storage'].forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (value !== '' && value !== null && value !== undefined) {
          uploadData.append(key, value.toString());
        }
      });

      // 텍스트 필드 - 빈 문자열도 전송 (백엔드에서 처리)
      ['brand', 'model', 'color', 'condition_grade', 'battery_status',
       'condition_description', 'description', 'meeting_place'].forEach(key => {
        const value = formData[key as keyof typeof formData];
        uploadData.append(key, value ? value.toString() : '');
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

      // 상세 페이지로 이동 (loading 상태 유지하여 버튼 비활성화 유지)
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

      // 오류 발생 시에만 loading 해제
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
            activeCount >= 5 ? 'bg-amber-50 border-amber-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activeCount >= 5 ? 'bg-amber-100' : 'bg-orange-100'
                }`}>
                  <span className={`text-sm font-semibold ${
                    activeCount >= 5 ? 'text-amber-700' : 'text-orange-700'
                  }`}>{activeCount}</span>
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    activeCount >= 5 ? 'text-amber-900' : 'text-orange-900'
                  }`}>
                    활성 상품 {activeCount}/5개
                  </p>
                  <p className={`text-xs ${
                    activeCount >= 5 ? 'text-amber-700' : 'text-orange-700'
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
          <div
            ref={imageRef}
            className={`relative bg-white rounded-lg p-6 shadow-sm transition-all ${
              isDragging ? 'ring-2 ring-dungji-primary ring-opacity-50 bg-blue-50' :
              errors.images ? 'ring-1 ring-red-300' : ''
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              <Label className="text-lg font-semibold">
                상품 이미지 <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-gray-500 ml-2">(최대 10장)</span>
              </Label>
              {errors.images && (
                <p className="mt-1 text-xs text-red-500/70">{errors.images}</p>
              )}
            </div>

            {/* 드래그 앤 드롭 안내 */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-lg z-10">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-dungji-primary mx-auto mb-2" />
                  <p className="text-dungji-primary font-semibold">여기에 이미지를 놓으세요</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {/* 이미지 미리보기 슬롯 */}
              {[...Array(10)].map((_, index) => {
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
                          <span className="text-xs text-gray-500">사진 추가</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              if (isFirstSlot) {
                                // 첫 번째 슬롯은 항상 인덱스 0으로 업로드
                                handleImageUpload(e, 0);
                              } else if (index === 1 && (!images[1] || images[1].isEmpty)) {
                                // 두 번째 슬롯이 비어있으면 인덱스 1로 업로드
                                handleImageUpload(e, 1);
                              } else {
                                // 그 외의 경우 일반 업로드
                                handleImageUpload(e, index);
                              }
                            }}
                            className="hidden"
                            disabled={loading || !canUpload}
                          />
                        </>
                      ) : (
                        <div className="text-gray-300">
                          <Camera className="w-6 h-6 mb-1" />
                          <span className="text-xs">사진 추가</span>
                        </div>
                      )}
                    </label>
                  );
                }
              })}
            </div>

            <p className="text-sm text-gray-500 mt-4">
              * <span className="font-semibold">첫 번째 슬롯(대표)에 반드시 이미지를 등록해주세요.</span>
              * 최대 10장까지 등록 가능합니다. (자동 압축 처리)
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
                  <SelectTrigger
                    ref={brandRef}
                    className={errors.brand ? 'border-red-300' : ''}
                  >
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
                {errors.brand && (
                  <p className="mt-1 text-xs text-red-500/70">{errors.brand}</p>
                )}
              </div>

              {/* 모델명 */}
              <div>
                <Label htmlFor="model">모델명 <span className="text-red-500">*</span></Label>
                <Input
                  ref={modelRef}
                  id="model"
                  placeholder="예: iPhone 15 Pro"
                  value={formData.model}
                  onChange={(e) => {
                    if (e.target.value.length <= 50) {
                      handleInputChange('model', e.target.value);
                    }
                  }}
                  maxLength={50}
                  className={errors.model ? 'border-red-300' : ''}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.model.length}/50자</p>
                {errors.model && (
                  <p className="text-xs text-red-500/70">{errors.model}</p>
                )}
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
                  <SelectTrigger
                    ref={storageRef}
                    className={errors.storage ? 'border-red-300' : ''}
                  >
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '');
                      if (value.length <= 4) {  // 최대 4자리 (9999GB)
                        handleInputChange('storage', value);
                      }
                    }}
                    maxLength={4}
                    className="mt-2"
                  />
                )}
                {errors.storage && (
                  <p className="mt-1 text-xs text-red-500/70">{errors.storage}</p>
                )}
              </div>

              {/* 색상 */}
              <div>
                <Label htmlFor="color">색상 <span className="text-red-500">*</span></Label>
                <Input
                  ref={colorRef}
                  id="color"
                  placeholder="예: 스페이스 블랙"
                  value={formData.color}
                  onChange={(e) => {
                    if (e.target.value.length <= 30) {
                      handleInputChange('color', e.target.value);
                    }
                  }}
                  maxLength={30}
                  className={errors.color ? 'border-red-300' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.color.length}/30자</p>
                {errors.color && (
                  <p className="text-xs text-red-500/70">{errors.color}</p>
                )}
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
                  ref={priceRef}
                  id="price"
                  type="text"
                  placeholder="0"
                  value={formatPrice(formData.price)}
                  className={errors.price ? 'border-red-300' : ''}
                  onChange={(e) => {
                    const unformatted = unformatPrice(e.target.value);
                    // 최대 금액 제한 (990만원)
                    if (parseInt(unformatted) > 9900000) {
                      return;
                    }
                    handleInputChange('price', unformatted);
                  }}
                  onBlur={(e) => {
                    // 포커스 아웃 시 천원 단위로 자동 조정
                    const unformatted = unformatPrice(e.target.value);
                    if (unformatted) {
                      const rounded = roundToThousand(unformatted);
                      handleInputChange('price', rounded.toString());
                    }
                  }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  가격은 천원 단위로 입력 가능합니다
                </p>
                <p className="text-xs text-green-600 mt-1">
                  별도의 수락 과정 없이 즉시 거래가 진행됩니다
                </p>
                {errors.price && (
                  <p className="text-xs text-red-500/70">{errors.price}</p>
                )}
              </div>

              {/* 최소 제안 가격 */}
              <div>
                <Label htmlFor="min_offer_price">최소 제안 가격 <span className="text-red-500">*</span></Label>
                <Input
                  ref={minOfferPriceRef}
                  id="min_offer_price"
                  type="text"
                  placeholder="0"
                  value={formatPrice(formData.min_offer_price)}
                  className={errors.min_offer_price ? 'border-red-300' : ''}
                  onChange={(e) => {
                    const unformatted = unformatPrice(e.target.value);
                    // 최대 금액 제한 (990만원)
                    if (parseInt(unformatted) > 9900000) {
                      return;
                    }
                    handleInputChange('min_offer_price', unformatted);
                  }}
                  onBlur={(e) => {
                    // 포커스 아웃 시 천원 단위로 자동 조정
                    const unformatted = unformatPrice(e.target.value);
                    if (unformatted) {
                      const rounded = roundToThousand(unformatted);
                      handleInputChange('min_offer_price', rounded.toString());
                    }
                  }}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  가격은 천원 단위로 입력 가능합니다 (즉시 판매가보다 낮게)
                </p>
                {errors.min_offer_price && (
                  <p className="text-xs text-red-500/70">{errors.min_offer_price}</p>
                )}
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
                  <SelectTrigger
                    ref={conditionGradeRef}
                    className={errors.condition_grade ? 'border-red-300' : ''}
                  >
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
                {errors.condition_grade && (
                  <p className="mt-1 text-xs text-red-500/70">{errors.condition_grade}</p>
                )}
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
                  <SelectTrigger
                    ref={batteryStatusRef}
                    className={errors.battery_status ? 'border-red-300' : ''}
                  >
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
                {errors.battery_status && (
                  <p className="mt-1 text-xs text-red-500/70">{errors.battery_status}</p>
                )}
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div><span className="font-medium text-green-600">🟢 최상:</span> 새제품 또는 새제품 수준 • 하루 종일 충전 걱정 없음</div>
                    <div><span className="font-medium text-blue-600">🔵 좋음:</span> 하루 사용 시 충전 없이 가능 • 아침부터 저녁까지 일반 사용 OK</div>
                    <div><span className="font-medium text-yellow-600">🟡 보통:</span> 가끔 충전 필요, 발열 시 급속 감소 • 오후에 한 번은 충전해야 함</div>
                    <div><span className="font-medium text-red-600">🔴 나쁨:</span> 충전 자주 필요, 교체 고려 상태 • 반나절도 버티기 어려움</div>
                    <div><span className="font-medium text-gray-600">⚫ 불량:</span> 간헐적으로 꺼짐, 교체 필요 • 갑자기 전원이 꺼지거나 불안정</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 구성품 */}
            <div ref={componentsRef}>
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
              {errors.components && (
                <p className="mt-1 text-xs text-red-500/70">{errors.components}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {formData.body_only ? '폰 본체만 거래합니다' : '포함된 구성품을 모두 선택해주세요'}
              </p>
            </div>

            {/* 제품 상태 및 설명 - 통합 */}
            <div className="space-y-2">
              <Label htmlFor="condition_description">제품 상태 및 설명 <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Textarea
                  ref={conditionDescriptionRef}
                  id="condition_description"
                  placeholder="제품의 상태를 자세히 설명해주세요\n예: 기스, 찍힘, 배터리 성능, 기능 이상 유무 등\n구매자가 제품 상태를 정확히 파악할 수 있도록 작성해주세요"
                  value={formData.condition_description}
                  onChange={(e) => {
                    if (e.target.value.length <= 2000) {
                      handleInputChange('condition_description', e.target.value);
                    }
                  }}
                  rows={6}
                  className={`min-h-[150px] resize-y ${errors.condition_description ? 'border-red-300' : ''}`}
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
              {errors.condition_description && (
                <p className="text-xs text-red-500/70">{errors.condition_description}</p>
              )}
            </div>
          </div>

          {/* 거래 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">거래 정보</h2>
            
            {/* 거래 가능 지역 선택 */}
            <div ref={regionRef} className="space-y-2">
              <Label>거래 가능 지역 <span className="text-red-500">*</span></Label>
              <p className="text-sm text-gray-500 mb-2">최대 3개 지역까지 선택 가능합니다</p>
              <MultiRegionDropdown
                maxSelections={3}
                onSelectionChange={handleRegionSelectionChange}
                selectedRegions={selectedRegions}
              />
              {errors.regions && (
                <p className="text-xs text-red-500/70">{errors.regions}</p>
              )}
            </div>
            
            {/* 거래시 요청사항 */}
            <div className="space-y-2">
              <Label htmlFor="meeting_place">거래시 요청사항 <span className="text-red-500">*</span></Label>
              <Textarea
                ref={meetingPlaceRef}
                id="meeting_place"
                placeholder="예: 강남역 10번 출구 선호, 평일 저녁만 가능, 주말 오전 가능 등"
                value={formData.meeting_place}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    handleInputChange('meeting_place', e.target.value);
                  }
                }}
                rows={3}
                className={errors.meeting_place ? 'border-red-300' : ''}
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">구체적인 거래 장소나 시간대를 입력해주세요</p>
                <p className="text-xs text-gray-500">{formData.meeting_place.length}/200자</p>
              </div>
              {errors.meeting_place && (
                <p className="text-xs text-red-500/70">{errors.meeting_place}</p>
              )}
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

          {/* 하단 여백 - 버튼 영역 공간 확보 */}
          <div className="h-24"></div>
        </form>

        {/* 하단 고정 버튼 영역 - 모바일 최적화 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-[100]">
          <div className="p-4 pb-6">
            <div className="container mx-auto max-w-3xl flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="flex-1 h-12 text-base font-medium"
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || checkingLimit}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-dungji-primary hover:from-blue-700 hover:to-dungji-primary-dark text-base font-medium disabled:opacity-50"
              >
                {loading ? '등록 중...' : checkingLimit ? '확인 중...' : '등록하기'}
              </Button>
            </div>
          </div>
        </div>
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