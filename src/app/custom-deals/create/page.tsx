'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, AlertCircle, Check, Info, Image as ImageIcon, ArrowLeft, Clock, Users, Tag, MapPin, Phone, Link as LinkIcon, Ticket } from 'lucide-react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';
import { useCustomProfileCheck } from '@/hooks/useCustomProfileCheck';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { compressImageInBrowser } from '@/lib/api/used/browser-image-utils';
import RichTextEditor from '@/components/custom/RichTextEditor';

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

// 카테고리 타입
interface Category {
  value: string;
  label: string;
}

export default function CreateCustomDealPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 입력 필드 refs (포커싱용)
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const imageRefDiv = useRef<HTMLDivElement>(null);
  const productNameRef = useRef<HTMLInputElement>(null);
  const originalPriceRef = useRef<HTMLInputElement>(null);
  const discountRateRef = useRef<HTMLInputElement>(null);
  const targetParticipantsRef = useRef<HTMLInputElement>(null);
  const discountUrlRef = useRef<HTMLInputElement>(null);
  const discountCodesRef = useRef<HTMLDivElement>(null);
  const regionsRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);

  const {
    checkProfile,
    missingFields,
    showProfileModal,
    setShowProfileModal,
  } = useCustomProfileCheck();

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 지역 선택 (오프라인용)
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);

  // 할인코드 배열
  const [discountCodes, setDiscountCodes] = useState<string[]>(['']);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 모집기간 설정 여부
  const [useDeadline, setUseDeadline] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    usage_guide: '',
    type: 'online' as 'online' | 'offline',
    pricing_type: 'single_product' as 'single_product' | 'all_products',
    product_name: '',
    original_price: '',
    discount_rate: '',
    target_participants: '2',
    deadline_type: 'auto' as 'auto' | 'manual',
    deadline_days: '3',
    deadline_date: '',
    deadline_time: '',
    allow_partial_sale: false,
    // 온라인
    online_discount_type: 'link_only' as 'link_only' | 'code_only' | 'both',
    discount_url: '',
    discount_valid_days: '',
    // 오프라인
    location: '',
    location_detail: '',
    phone_number: '',
    offline_discount_valid_days: '7',
  });

  // 최종 가격 계산 (단일상품만)
  const calculateFinalPrice = () => {
    if (formData.pricing_type !== 'single_product') return null;
    const original = parseInt(formData.original_price.replace(/,/g, '')) || 0;
    const discount = parseInt(formData.discount_rate) || 0;
    return Math.floor(original * (100 - discount) / 100);
  };

  // 카테고리 목록 가져오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom/categories/`);
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };
    fetchCategories();
  }, []);

  // 페이지 진입 시 인증 체크 (로딩 완료 후에만)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 이미지 업로드 핸들러 (중고거래 로직 복사)
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | File[], targetIndex?: number) => {
    const files = Array.isArray(e) ? e : Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 파일 유효성 검사
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 파일이 10MB를 초과합니다`);
        if (targetIndex !== undefined) {
          setImages(prev => {
            const updated = [...prev];
            updated[targetIndex] = {
              file: null,
              url: '',
              isMain: targetIndex === 0,
              isEmpty: true
            };
            return updated;
          });
        }
        if (!Array.isArray(e) && e.target) {
          e.target.value = '';
        }
        return;
      }
    }

    setImages(prev => {
      const updated = [...prev];

      // 특정 슬롯에 개별 업로드
      if (targetIndex !== undefined && files.length === 1) {
        const file = files[0];
        if (updated[targetIndex] && updated[targetIndex].url) {
          URL.revokeObjectURL(updated[targetIndex].url);
        }
        updated[targetIndex] = {
          file,
          url: URL.createObjectURL(file),
          isMain: targetIndex === 0,
          isEmpty: false
        };
        return updated;
      }

      // 다중 업로드
      const actualImages = updated.filter(img => img && !img.isEmpty);
      if (actualImages.length + files.length > 5) {
        toast.error('최대 5장까지 업로드 가능합니다');
        return prev;
      }

      const lastFilledIndex = actualImages.length > 0 ?
        updated.findLastIndex(img => img && !img.isEmpty) : -1;
      let insertIndex = lastFilledIndex + 1;

      files.forEach((file) => {
        if (insertIndex < 5) {
          if (updated[insertIndex] && updated[insertIndex].url) {
            URL.revokeObjectURL(updated[insertIndex].url);
          }
          updated[insertIndex] = {
            file,
            url: URL.createObjectURL(file),
            isMain: insertIndex === 0,
            isEmpty: false
          };
          insertIndex++;
        }
      });

      return updated;
    });

    // 에러 제거
    if (errors.images) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  }, [errors]);

  // 이미지 삭제
  const handleImageRemove = useCallback((index: number) => {
    setImages(prev => {
      const updated = [...prev];
      const imageToRemove = updated[index];

      if (imageToRemove && imageToRemove.url) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      if (index === 0) {
        updated[index] = {
          file: null,
          url: '',
          isMain: true,
          isEmpty: true
        };
      } else {
        updated[index] = {
          file: null,
          url: '',
          isMain: false,
          isEmpty: true
        };
      }

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

  // 드래그 앤 드롭
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

  // 카테고리 선택
  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
    if (errors.categories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.categories;
        return newErrors;
      });
    }
  };

  // 랜덤 할인코드 생성 (ABC-123 형식)
  const generateRandomCode = () => {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 혼동되는 문자 제외 (I, O)
    const numbers = '23456789'; // 혼동되는 숫자 제외 (0, 1)

    let letterPart = '';
    for (let i = 0; i < 3; i++) {
      letterPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    let numberPart = '';
    for (let i = 0; i < 3; i++) {
      numberPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return `${letterPart}-${numberPart}`;
  };

  // 할인코드 추가
  const addDiscountCode = () => {
    setDiscountCodes(prev => [...prev, '']);
  };

  // 랜덤 할인코드 자동 생성
  const generateDiscountCodes = () => {
    const targetCount = parseInt(formData.target_participants) || 1;
    const newCodes: string[] = [];
    const existingCodes = new Set(discountCodes.filter(code => code.trim()));

    for (let i = 0; i < targetCount; i++) {
      let code = generateRandomCode();
      // 중복 방지
      while (existingCodes.has(code) || newCodes.includes(code)) {
        code = generateRandomCode();
      }
      newCodes.push(code);
    }

    setDiscountCodes(newCodes);
    toast.success(`${targetCount}개의 할인코드가 생성되었습니다`);
  };

  // 할인코드 제거
  const removeDiscountCode = (index: number) => {
    if (discountCodes.length > 1) {
      setDiscountCodes(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 할인코드 변경
  const updateDiscountCode = (index: number, value: string) => {
    setDiscountCodes(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 마감시간 계산
  const calculateDeadline = () => {
    if (!useDeadline) {
      // 모집기간 설정 안함: 7일 후로 자동 설정
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return deadline.toISOString();
    }

    if (formData.deadline_type === 'auto') {
      const days = parseInt(formData.deadline_days);
      const deadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      return deadline.toISOString();
    } else {
      return `${formData.deadline_date}T${formData.deadline_time}:00`;
    }
  };

  // 가격 포맷팅 (최대 1억)
  const formatPrice = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    const numValue = parseInt(numbers);
    if (numValue > 100000000) return '100,000,000';
    return numValue.toLocaleString('ko-KR');
  };

  // 유효성 검증
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let firstErrorRef: React.RefObject<any> | null = null;

    // 기본 필드
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = titleRef;
    }
    if (formData.title.length > 150) {
      newErrors.title = '제목은 최대 150자까지 입력 가능합니다';
      if (!firstErrorRef) firstErrorRef = titleRef;
    }
    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = descriptionRef;
    }
    if (formData.description.length > 3000) {
      newErrors.description = '설명은 최대 3,000자까지 입력 가능합니다';
      if (!firstErrorRef) firstErrorRef = descriptionRef;
    }
    if (formData.usage_guide && formData.usage_guide.length > 1000) newErrors.usage_guide = '이용안내는 최대 1,000자까지 입력 가능합니다';

    // 마감시간 검증 (모집기간 설정 시에만)
    if (useDeadline && formData.deadline_type === 'manual') {
      if (!formData.deadline_date) newErrors.deadline_date = '마감 날짜를 선택해주세요';
      if (!formData.deadline_time) newErrors.deadline_time = '마감 시간을 선택해주세요';

      if (formData.deadline_date && formData.deadline_time) {
        const deadline = new Date(`${formData.deadline_date}T${formData.deadline_time}`);
        const now = new Date();
        const minDeadline = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후
        const maxDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후

        if (deadline < minDeadline) {
          newErrors.deadline_time = '마감시간은 최소 1시간 이후로 설정해주세요';
        }
        if (deadline > maxDeadline) {
          newErrors.deadline_date = '마감시간은 최대 7일 이내로 설정해주세요';
        }
      }
    }

    // 카테고리
    if (!selectedCategory) {
      newErrors.categories = '카테고리를 선택해주세요';
      if (!firstErrorRef) firstErrorRef = categoryRef;
    }

    // 이미지
    const actualImages = images.filter(img => img && !img.isEmpty);
    if (actualImages.length === 0) {
      newErrors.images = '최소 1장 이상의 이미지를 등록해주세요';
      if (!firstErrorRef) firstErrorRef = imageRefDiv;
    }

    // 가격
    if (formData.pricing_type === 'single_product') {
      if (!formData.product_name.trim()) {
        newErrors.product_name = '상품명을 입력해주세요';
        if (!firstErrorRef) firstErrorRef = productNameRef;
      }
      if (!formData.original_price) {
        newErrors.original_price = '정가를 입력해주세요';
        if (!firstErrorRef) firstErrorRef = originalPriceRef;
      }
      const originalPrice = parseInt(formData.original_price.replace(/,/g, ''));
      if (originalPrice > 100000000) {
        newErrors.original_price = '정가는 최대 1억원까지 입력 가능합니다';
        if (!firstErrorRef) firstErrorRef = originalPriceRef;
      }
    }
    if (!formData.discount_rate) {
      newErrors.discount_rate = '할인율을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = discountRateRef;
    }
    const discountRate = parseInt(formData.discount_rate);
    if (discountRate < 0 || discountRate > 99) {
      newErrors.discount_rate = '할인율은 0~99% 사이여야 합니다';
      if (!firstErrorRef) firstErrorRef = discountRateRef;
    }

    // 온라인 공구
    if (formData.type === 'online') {
      if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
        if (!formData.discount_url.trim()) {
          newErrors.discount_url = '할인 링크를 입력해주세요';
          if (!firstErrorRef) firstErrorRef = discountUrlRef;
        }
      }
      if (formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') {
        const validCodes = discountCodes.filter(c => c.trim());
        if (validCodes.length === 0) {
          newErrors.discount_codes = '할인코드를 1개 이상 입력해주세요';
          if (!firstErrorRef) firstErrorRef = discountCodesRef;
        }
        const targetCount = parseInt(formData.target_participants);
        if (validCodes.length < targetCount) {
          newErrors.discount_codes = `할인코드 개수가 목표 인원(${targetCount}명)보다 적습니다`;
          if (!firstErrorRef) firstErrorRef = discountCodesRef;
        }
      }
    }

    // 오프라인 공구
    if (formData.type === 'offline') {
      if (selectedRegions.length === 0) {
        newErrors.regions = '지역을 1개 이상 선택해주세요';
        if (!firstErrorRef) firstErrorRef = regionsRef;
      }
      if (!formData.location.trim()) {
        newErrors.location = '매장 위치를 입력해주세요';
        if (!firstErrorRef) firstErrorRef = locationRef;
      }
      if (formData.location.length > 150) {
        newErrors.location = '매장 위치는 최대 150자까지 입력 가능합니다';
        if (!firstErrorRef) firstErrorRef = locationRef;
      }
      if (!formData.phone_number.trim()) {
        newErrors.phone_number = '연락처를 입력해주세요';
        if (!firstErrorRef) firstErrorRef = phoneNumberRef;
      }
      if (formData.phone_number.length > 20) {
        newErrors.phone_number = '연락처는 최대 20자까지 입력 가능합니다';
        if (!firstErrorRef) firstErrorRef = phoneNumberRef;
      }
      const validCodes = discountCodes.filter(c => c.trim());
      if (validCodes.length === 0) {
        newErrors.discount_codes = '할인코드를 1개 이상 입력해주세요';
        if (!firstErrorRef) firstErrorRef = discountCodesRef;
      }
      const targetCount = parseInt(formData.target_participants);
      if (validCodes.length < targetCount) {
        newErrors.discount_codes = `할인코드 개수가 목표 인원(${targetCount}명)보다 적습니다`;
        if (!firstErrorRef) firstErrorRef = discountCodesRef;
      }
    }

    setErrors(newErrors);

    // 첫 번째 에러 필드로 포커스 및 스크롤
    if (Object.keys(newErrors).length > 0 && firstErrorRef?.current) {
      if ('focus' in firstErrorRef.current) {
        firstErrorRef.current.focus();
      }
      firstErrorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }

    return Object.keys(newErrors).length === 0;
  };

  // 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    const requiresBusiness = formData.type === 'offline';
    const isProfileComplete = await checkProfile(requiresBusiness);
    if (!isProfileComplete) {
      setShowProfileModal(true);
      return;
    }

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      toast.error(errors[firstErrorField] || '입력 내용을 확인해주세요');
      return;
    }

    try {
      setLoading(true);

      // FormData로 전송 (중고거래 방식)
      const actualImages = images.filter(img => img && !img.isEmpty);
      const submitFormData = new FormData();

      // 이미지 파일 추가 (원본 파일, 백엔드에서 압축 처리)
      for (const img of actualImages) {
        if (img.file) {
          submitFormData.append('images', img.file);
        }
      }

      // 기본 정보
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      if (formData.usage_guide) submitFormData.append('usage_guide', formData.usage_guide);
      submitFormData.append('type', formData.type);
      submitFormData.append('categories', JSON.stringify([selectedCategory]));
      submitFormData.append('pricing_type', formData.pricing_type);
      submitFormData.append('target_participants', formData.target_participants);
      submitFormData.append('expired_at', calculateDeadline());
      submitFormData.append('allow_partial_sale', formData.allow_partial_sale.toString());

      // 가격 정보
      const validCodes = discountCodes.filter(c => c.trim());

      if (formData.pricing_type === 'single_product') {
        submitFormData.append('products', JSON.stringify([{
          name: formData.product_name,
          original_price: parseInt(formData.original_price.replace(/,/g, '')),
          discount_rate: parseInt(formData.discount_rate)
        }]));
      } else {
        submitFormData.append('discount_rate', formData.discount_rate);
      }

      // 온라인/오프라인 특화 정보
      if (formData.type === 'online') {
        submitFormData.append('online_discount_type', formData.online_discount_type);
        if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
          submitFormData.append('discount_url', formData.discount_url);
        }
        if (formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') {
          submitFormData.append('discount_codes', JSON.stringify(validCodes));
        }
        if (formData.discount_valid_days) {
          submitFormData.append('discount_valid_days', formData.discount_valid_days);
        }
      } else {
        // 지역 정보 (중고거래와 동일한 방식)
        const regionStrings = selectedRegions.map(r => `${r.province} ${r.city}`);
        selectedRegions.forEach((region) => {
          submitFormData.append('regions', `${region.province} ${region.city}`);
        });
        // Serializer 유효성 검사를 위해 region_codes도 전송
        submitFormData.append('region_codes', JSON.stringify(regionStrings));
        submitFormData.append('location', formData.location);
        if (formData.location_detail) submitFormData.append('location_detail', formData.location_detail);
        submitFormData.append('phone_number', formData.phone_number);
        submitFormData.append('discount_valid_days', formData.offline_discount_valid_days);
        submitFormData.append('discount_codes', JSON.stringify(validCodes));
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: submitFormData
      });

      console.log('API 응답 상태:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 에러 응답 (raw):', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('서버 에러 응답 (parsed):', errorData);
          throw new Error(errorData.error || JSON.stringify(errorData) || '등록에 실패했습니다');
        } catch (e) {
          throw new Error(`등록 실패 (${response.status}): ${errorText.substring(0, 200)}`);
        }
      }

      const data = await response.json();
      console.log('등록 성공 응답:', data);
      toast.success('커스텀 공구가 등록되었습니다!');
      router.push(`/custom-deals/${data.id}`);

    } catch (error: any) {
      console.error('등록 실패:', error);
      toast.error(error.message || '등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const finalPrice = calculateFinalPrice();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">커스텀 공구 등록</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">
        {/* 등록 안내 */}
        <Card className="mb-6 border-slate-200 bg-slate-50">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-slate-900 mb-1">등록 전 확인사항</h3>
                <p className="text-sm text-slate-700 mb-1">
                  오프라인 공구는 사업자 회원만 등록 가능합니다
                </p>
                <p className="text-sm text-slate-600">
                  등록 불가: 할부/약정 상품, 금융상품, 학원/강의, 방문 서비스, 청소년 유해상품
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이미지 업로드 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              상품 이미지 {errors.images && <span className="text-red-600 text-sm ml-2">{errors.images}</span>}
            </CardTitle>
            <p className="text-sm text-slate-500">첫 번째 이미지가 대표 이미지로 설정됩니다 (최대 5장)</p>
          </CardHeader>
          <CardContent>
            <div
              ref={imageRefDiv}
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : errors.images
                  ? 'border-red-300 bg-red-50'
                  : 'border-slate-300 hover:border-slate-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, index) => {
                  const image = images[index];
                  const hasImage = image && !image?.isEmpty;

                  return (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden ${
                        hasImage ? 'border-slate-300' : 'border-dashed border-slate-200'
                      }`}
                    >
                      {hasImage ? (
                        <>
                          <div
                            className="absolute inset-0 cursor-pointer"
                            onClick={() => window.open(image.url, '_blank')}
                          >
                            <Image
                              src={image.url}
                              alt={`이미지 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          {image.isMain && (
                            <Badge className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 pointer-events-none">
                              대표
                            </Badge>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 hover:opacity-100 transition-opacity bg-black/30">
                            {!image.isMain && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 bg-white hover:bg-white shadow-lg"
                                onClick={() => handleSetMainImage(index)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 shadow-lg"
                              onClick={() => handleImageRemove(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <Plus className="w-6 h-6 text-slate-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  이미지 선택
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  또는 이미지를 드래그 앤 드롭하세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기본 정보 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 제목 */}
            <div>
              <Label>제목 *</Label>
              <Input
                ref={titleRef}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="공구 제목을 입력하세요"
                className={errors.title ? 'border-red-300' : ''}
                maxLength={150}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                <p className="text-sm text-slate-500 ml-auto">{formData.title.length}/150</p>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <Label>상세 설명 *</Label>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => handleInputChange('description', content)}
                placeholder="공구 상품에 대한 자세한 설명을 입력하세요"
                maxLength={3000}
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
            </div>

            {/* 이용 안내 */}
            <div>
              <Label>이용 안내 (선택)</Label>
              <Textarea
                value={formData.usage_guide}
                onChange={(e) => handleInputChange('usage_guide', e.target.value)}
                placeholder="예시:&#10;- 평일 오후 3시~9시만 사용 가능&#10;- 주말/공휴일 제외&#10;- 1인 1회 한정&#10;- 현장 결제 시에만 적용"
                className={errors.usage_guide ? 'border-red-300' : ''}
                rows={4}
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                {errors.usage_guide && <p className="text-sm text-red-600">{errors.usage_guide}</p>}
                <p className="text-sm text-slate-500 ml-auto">{formData.usage_guide.length}/1,000</p>
              </div>
            </div>

            {/* 타입 선택 */}
            <div>
              <Label>공구 유형 *</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value as 'online' | 'offline')}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="font-normal cursor-pointer">온라인</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offline" id="offline" />
                  <Label htmlFor="offline" className="font-normal cursor-pointer">오프라인</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              카테고리 * {errors.categories && <span className="text-red-600 text-sm ml-2">{errors.categories}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={categoryRef} className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`
                    py-2 px-3 rounded-lg border-2 font-medium transition-all text-sm
                    ${selectedCategory === cat.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 가격 정보 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle>가격 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 가격 유형 선택 */}
            <div>
              <Label>가격 유형 *</Label>
              <RadioGroup
                value={formData.pricing_type}
                onValueChange={(value) => handleInputChange('pricing_type', value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single_product" id="single" />
                  <Label htmlFor="single" className="cursor-pointer">단일상품</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_products" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">전품목 할인</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 단일상품: 상품명, 정가, 할인율 */}
            {formData.pricing_type === 'single_product' && (
              <>
                <div>
                  <Label>상품명 *</Label>
                  <Input
                    ref={productNameRef}
                    value={formData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    placeholder="예: 둥지마켓 사과 1박스"
                    className={errors.product_name ? 'border-red-300' : ''}
                    maxLength={100}
                  />
                  {errors.product_name && <p className="text-sm text-red-600 mt-1">{errors.product_name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>정가 *</Label>
                    <Input
                      ref={originalPriceRef}
                      value={formData.original_price}
                      onChange={(e) => handleInputChange('original_price', formatPrice(e.target.value))}
                      placeholder="0"
                      className={errors.original_price ? 'border-red-300' : ''}
                    />
                    {errors.original_price && <p className="text-sm text-red-600 mt-1">{errors.original_price}</p>}
                  </div>
                  <div>
                    <Label>할인율 (%) *</Label>
                    <Input
                      ref={discountRateRef}
                      type="number"
                      value={formData.discount_rate}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value <= 99) {
                          handleInputChange('discount_rate', e.target.value);
                        }
                      }}
                      placeholder="0"
                      min="0"
                      max="99"
                      onKeyDown={(e) => {
                        if (e.key === '.' || e.key === '-' || e.key === 'e') e.preventDefault();
                      }}
                      className={errors.discount_rate ? 'border-red-300' : ''}
                    />
                    {errors.discount_rate && <p className="text-sm text-red-600 mt-1">{errors.discount_rate}</p>}
                  </div>
                </div>

                {formData.original_price && formData.discount_rate && finalPrice !== null && finalPrice > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-slate-600 mb-1">공구특가</p>
                    <p className="text-2xl font-bold text-blue-600">{finalPrice.toLocaleString()}원</p>
                  </div>
                )}
              </>
            )}

            {/* 전품목 할인: 할인율만 */}
            {formData.pricing_type === 'all_products' && (
              <div>
                <Label>할인율 (%) *</Label>
                <Input
                  type="number"
                  value={formData.discount_rate}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value <= 99) {
                      handleInputChange('discount_rate', e.target.value);
                    }
                  }}
                  placeholder="0"
                  min="0"
                  max="99"
                  onKeyDown={(e) => {
                    if (e.key === '.' || e.key === '-' || e.key === 'e') e.preventDefault();
                  }}
                  className={errors.discount_rate ? 'border-red-300' : ''}
                />
                {errors.discount_rate && <p className="text-sm text-red-600 mt-1">{errors.discount_rate}</p>}
                {formData.discount_rate && (
                  <p className="text-xs text-slate-500 mt-1">
                    해당 업체의 모든 상품에 {formData.discount_rate}% 할인이 적용됩니다
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 모집 설정 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              모집 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>목표 인원 *</Label>
              <Select value={formData.target_participants} onValueChange={(value) => handleInputChange('target_participants', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 9 }, (_, i) => i + 2).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}명</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  모집 마감 시간 (선택)
                </Label>
                <Button
                  type="button"
                  variant={useDeadline ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setUseDeadline(!useDeadline);
                    if (useDeadline) {
                      // 설정 해제 시 초기화
                      handleInputChange('deadline_type', 'auto');
                      handleInputChange('deadline_days', '3');
                      handleInputChange('deadline_date', '');
                      handleInputChange('deadline_time', '');
                    }
                  }}
                >
                  {useDeadline ? '설정 해제' : '모집기간 설정'}
                </Button>
              </div>

              {!useDeadline && (
                <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                  모집기간을 설정하지 않으면 <span className="font-medium text-slate-700">등록 시간 기준 7일 후</span> 자동으로 마감 처리됩니다
                </p>
              )}

              {useDeadline && (
                <>
                  {/* 자동/직접 선택 토글 */}
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('deadline_type', 'auto')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                        formData.deadline_type === 'auto'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      자동 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('deadline_type', 'manual')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all ${
                        formData.deadline_type === 'manual'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      직접 선택
                    </button>
                  </div>

                  {/* 자동 선택 */}
                  {formData.deadline_type === 'auto' && (
                <>
                  <p className="text-sm text-slate-500 mb-2">등록 시간 기준으로 자동 계산됩니다</p>
                  <div className="grid grid-cols-7 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleInputChange('deadline_days', day.toString())}
                        className={`
                          py-3 px-2 rounded-lg border-2 font-medium transition-all text-center
                          ${formData.deadline_days === day.toString()
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }
                        `}
                      >
                        {day}일
                      </button>
                    ))}
                  </div>
                </>
                  )}

                  {/* 직접 선택 */}
                  {formData.deadline_type === 'manual' && (
                <>
                  <p className="text-sm text-slate-500 mb-2">최소 1시간 이후 ~ 최대 7일 이내로 설정해주세요</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">날짜</Label>
                      <Input
                        type="date"
                        value={formData.deadline_date}
                        onChange={(e) => handleInputChange('deadline_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className={errors.deadline_date ? 'border-red-300' : ''}
                      />
                      {errors.deadline_date && <p className="text-sm text-red-600 mt-1">{errors.deadline_date}</p>}
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">시간</Label>
                      <Input
                        type="time"
                        value={formData.deadline_time}
                        onChange={(e) => handleInputChange('deadline_time', e.target.value)}
                        className={errors.deadline_time ? 'border-red-300' : ''}
                      />
                      {errors.deadline_time && <p className="text-sm text-red-600 mt-1">{errors.deadline_time}</p>}
                    </div>
                  </div>
                </>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">부분 판매 허용</p>
                <p className="text-sm text-slate-500">인원 미달 시 24시간 내 판매 여부 선택 가능</p>
              </div>
              <Switch
                checked={formData.allow_partial_sale}
                onCheckedChange={(checked) => handleInputChange('allow_partial_sale', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 온라인 전용 필드 */}
        {formData.type === 'online' && (
          <Card className="mb-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                할인 제공 방식
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.online_discount_type}
                onValueChange={(value) => handleInputChange('online_discount_type', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="link_only" id="link_only" />
                  <Label htmlFor="link_only" className="font-normal cursor-pointer">링크만</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="code_only" id="code_only" />
                  <Label htmlFor="code_only" className="font-normal cursor-pointer">코드만</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">링크 + 코드</Label>
                </div>
              </RadioGroup>

              {(formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') && (
                <div className="space-y-3">
                  <div>
                    <Label>할인 링크 *</Label>
                    <Input
                      ref={discountUrlRef}
                      value={formData.discount_url}
                      onChange={(e) => handleInputChange('discount_url', e.target.value)}
                      placeholder="https://example.com/discount"
                      className={errors.discount_url ? 'border-red-300' : ''}
                      maxLength={200}
                    />
                    {errors.discount_url && <p className="text-sm text-red-600 mt-1">{errors.discount_url}</p>}
                  </div>

                  {/* 링크 테스트 버튼 */}
                  {formData.discount_url && formData.discount_url.startsWith('http') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(formData.discount_url, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      링크 테스트
                    </Button>
                  )}
                </div>
              )}

              {(formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    할인 코드 * {errors.discount_codes && <span className="text-red-600 text-sm">{errors.discount_codes}</span>}
                  </Label>
                  <div className="space-y-2 mt-2">
                    {discountCodes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={code}
                          onChange={(e) => updateDiscountCode(index, e.target.value)}
                          placeholder={`코드 ${index + 1}`}
                          maxLength={100}
                        />
                        {discountCodes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDiscountCode(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDiscountCode}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        코드 추가
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={generateDiscountCodes}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        자동 생성
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>할인 유효기간 (선택)</Label>
                <Select value={formData.discount_valid_days} onValueChange={(value) => handleInputChange('discount_valid_days', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3일</SelectItem>
                    <SelectItem value="7">7일</SelectItem>
                    <SelectItem value="14">14일</SelectItem>
                    <SelectItem value="30">30일</SelectItem>
                    <SelectItem value="60">60일</SelectItem>
                    <SelectItem value="90">90일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 오프라인 전용 필드 */}
        {formData.type === 'offline' && (
          <>
            <Card className="mb-6 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  지역 및 매장 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>지역 선택 * {errors.regions && <span className="text-red-600 text-sm ml-2">{errors.regions}</span>}</Label>
                  <p className="text-sm text-slate-500 mb-2">최대 3개까지 선택 가능합니다</p>
                  <MultiRegionDropdown
                    selectedRegions={selectedRegions}
                    onSelectionChange={setSelectedRegions}
                    maxSelections={3}
                  />
                </div>

                <div>
                  <Label>매장 위치 *</Label>
                  <Input
                    ref={locationRef}
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="서울시 강남구 테헤란로 123"
                    className={errors.location ? 'border-red-300' : ''}
                    maxLength={150}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                    <p className="text-sm text-slate-500 ml-auto">{formData.location.length}/300</p>
                  </div>
                </div>

                <div>
                  <Label>위치 상세 (선택)</Label>
                  <Textarea
                    value={formData.location_detail}
                    onChange={(e) => handleInputChange('location_detail', e.target.value)}
                    placeholder="건물명, 층수 등 추가 정보"
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    연락처 *
                  </Label>
                  <Input
                    ref={phoneNumberRef}
                    value={formData.phone_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9\-]/g, '');
                      if (value.length <= 20) {
                        handleInputChange('phone_number', value);
                      }
                    }}
                    placeholder="010-1234-5678"
                    className={errors.phone_number ? 'border-red-300' : ''}
                    maxLength={20}
                  />
                  {errors.phone_number && <p className="text-sm text-red-600 mt-1">{errors.phone_number}</p>}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  할인 코드 및 유효기간
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>할인 코드 * {errors.discount_codes && <span className="text-red-600 text-sm ml-2">{errors.discount_codes}</span>}</Label>
                  <div className="space-y-2 mt-2">
                    {discountCodes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={code}
                          onChange={(e) => updateDiscountCode(index, e.target.value)}
                          placeholder={`코드 ${index + 1}`}
                          maxLength={100}
                        />
                        {discountCodes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDiscountCode(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDiscountCode}
                        className="flex-1"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        코드 추가
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={generateDiscountCodes}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        자동 생성
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    ⚠️ 배달 주문 시 사용 불가. 방문 포장 또는 매장 식사만 가능합니다.
                  </p>
                </div>

                <div>
                  <Label>할인 유효기간 *</Label>
                  <Select value={formData.offline_discount_valid_days} onValueChange={(value) => handleInputChange('offline_discount_valid_days', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3일</SelectItem>
                      <SelectItem value="7">7일</SelectItem>
                      <SelectItem value="14">14일</SelectItem>
                      <SelectItem value="30">30일</SelectItem>
                      <SelectItem value="60">60일</SelectItem>
                      <SelectItem value="90">90일</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500 mt-1">
                    할인코드는 발급일로부터 선택하신 기간 동안 사용 가능합니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* 등록 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading}
          >
            {loading ? '등록 중...' : '등록하기'}
          </Button>
        </div>
      </form>

      {/* Profile Check Modal */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={() => {
          setShowProfileModal(false);
          router.push('/mypage');
        }}
      />
    </div>
  );
}