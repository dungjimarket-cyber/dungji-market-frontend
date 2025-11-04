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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import AddressSearch from '@/components/address/AddressSearch';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import { compressImageInBrowser } from '@/lib/api/used/browser-image-utils';
import RichTextEditor from '@/components/custom/RichTextEditor';
import { CustomPenalty } from '@/lib/api/custom/penaltyApi';
import { checkCanCreateCustomDeal } from '@/lib/api/custom/createDealCheck';

// 이미지 미리보기 타입
interface ImagePreview {
  file: File | null;
  url: string;
  isMain: boolean;
  isEmpty?: boolean;
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

  // 사업자 회원 여부 확인
  const isBusinessUser = user?.is_business_verified === true;

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
  const locationRef = useRef<HTMLInputElement>(null);
  const phoneNumberRef = useRef<HTMLInputElement>(null);

  // 프로필 모달 상태 (연락처만 체크)
  const [profileMissingFields, setProfileMissingFields] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 할인코드 배열
  const [discountCodes, setDiscountCodes] = useState<string[]>(['']);

  // 중복 코드 에러
  const [duplicateCodeError, setDuplicateCodeError] = useState<string | null>(null);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 모집기간 설정 여부
  const [useDeadline, setUseDeadline] = useState(false);

  // 중복 등록 모달 상태
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateDialogMessage, setDuplicateDialogMessage] = useState('');

  // 패널티 모달 상태
  const [penaltyInfo, setPenaltyInfo] = useState<CustomPenalty | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    usage_guide: '',
    deal_type: 'participant_based' as 'participant_based' | 'time_based', // 특가 유형
    type: 'online' as 'online' | 'offline',
    pricing_type: 'single_product' as 'single_product' | 'all_products' | 'coupon_only',
    product_name: '',
    original_price: '',
    discount_rate: '',
    final_price: '', // 공구특가 직접 입력
    target_participants: '2',
    deadline_type: 'auto' as 'auto' | 'manual',
    deadline_days: '3',
    deadline_date: '',
    deadline_time: '',
    allow_partial_sale: false,
    // 온라인
    online_discount_type: 'link_only' as 'link_only' | 'code_only' | 'both',
    discount_url: '',
    discount_valid_days: '1',
    // 오프라인
    location: '',
    location_detail: '',
    phone_number: '',
    offline_discount_valid_days: '1',
  });

  // 할인율 변경 시 공구특가 자동 계산
  const handleDiscountRateChange = (rate: string) => {
    if (formData.pricing_type !== 'single_product') {
      handleInputChange('discount_rate', rate);
      return;
    }

    const original = parseInt(formData.original_price.replace(/,/g, '')) || 0;
    const discount = parseInt(rate) || 0;

    if (original > 0 && discount >= 0 && discount <= 99) {
      const calculated = Math.floor(original * (100 - discount) / 100);
      setFormData(prev => ({
        ...prev,
        discount_rate: rate,
        final_price: calculated.toLocaleString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        discount_rate: rate,
        final_price: ''
      }));
    }
  };

  // 공구특가 변경 시 할인율 자동 계산
  const handleFinalPriceChange = (price: string) => {
    const original = parseInt(formData.original_price.replace(/,/g, '')) || 0;
    const final = parseInt(price.replace(/,/g, '')) || 0;

    if (original > 0 && final > 0) {
      // 공구특가가 정상가를 초과하는지 체크
      if (final > original) {
        setErrors(prev => ({ ...prev, final_price: '공구특가는 정상가를 초과할 수 없습니다' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.final_price;
          return newErrors;
        });
      }

      // 할인율 계산: (1 - 공구특가/정상가) * 100
      const calculatedRate = Math.floor((1 - final / original) * 100);
      setFormData(prev => ({
        ...prev,
        final_price: formatPrice(price),
        discount_rate: Math.max(0, Math.min(99, calculatedRate)).toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        final_price: formatPrice(price)
      }));
    }
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

  // 진행 중인 공구 체크 함수
  const checkActiveDeals = useCallback(async () => {
    try {
      // seller10 계정은 5개 제한 예외 처리 (API 호출 전에 먼저 체크)
      if (user?.username === 'seller10') {
        return true;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) return true;

      // status 필터 제거 - 모든 상태를 가져와서 프론트에서 필터링
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/?seller=me`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) return true;

      const data = await response.json();

      // 모집중 또는 판매자 확정 대기 상태의 공구 개수 확인 (최대 5개)
      if (data.results && data.results.length > 0) {
        const activeDealCount = data.results.filter(
          (deal: any) => deal.status === 'recruiting' || deal.status === 'pending_seller'
        ).length;

        if (activeDealCount >= 5) {
          setDuplicateDialogMessage(
            `최대 5개의 공구까지 동시 진행 가능합니다.\n\n현재 ${activeDealCount}개의 공구가 진행 중입니다.`
          );
          setShowDuplicateDialog(true);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('활성 공구 체크 실패:', error);
      return true; // 에러 시 등록 진행
    }
  }, [user]);

  // 페이지 진입 시 인증 체크 (로딩 완료 후에만)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // 페이지 진입 시 진행 중인 공구 체크
  useEffect(() => {
    const checkOnPageLoad = async () => {
      // 인증 완료 후에만 체크
      if (!authLoading && isAuthenticated) {
        await checkActiveDeals();
      }
    };
    checkOnPageLoad();
  }, [authLoading, isAuthenticated, checkActiveDeals]);

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

  // 할인코드 변경 (중복 입력 차단)
  const updateDiscountCode = (index: number, value: string) => {
    // 입력하려는 값이 다른 코드와 중복되는지 확인
    const trimmedValue = value.trim();
    if (trimmedValue) {
      const isDuplicate = discountCodes.some((code, i) =>
        i !== index && code.trim() === trimmedValue
      );

      if (isDuplicate) {
        setDuplicateCodeError('중복된 할인코드는 입력할 수 없습니다. 모든 참여자에게 동일한 코드를 제공하시려면 링크 입력창을 이용해주세요.');
        // 3초 후 에러 메시지 자동 제거
        setTimeout(() => setDuplicateCodeError(null), 3000);
        return; // 중복이면 업데이트하지 않음
      }
    }

    // 중복이 아니면 에러 제거 및 업데이트
    setDuplicateCodeError(null);
    setDiscountCodes(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // 폼 입력 핸들러
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // 목표인원 변경 시 할인코드 조정
    if (field === 'target_participants') {
      const newCount = parseInt(value);
      if (newCount < discountCodes.length) {
        // 인원을 줄이면 코드도 줄임
        setDiscountCodes(discountCodes.slice(0, newCount));
        toast.info(`목표인원이 ${newCount}명으로 줄어 할인코드가 ${newCount}개로 조정되었습니다`);
      }
      // 인원을 늘리면 기존 코드는 유지 (사용자가 필요시 추가)
    }

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
    // 기간행사: deadline_date + deadline_time 사용
    if (formData.deal_type === 'time_based') {
      return `${formData.deadline_date}T${formData.deadline_time}:00`;
    }

    // 인원 모집 특가
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
  const validateForm = (): { isValid: boolean; errors: Record<string, string>; firstErrorRef: React.RefObject<any> | null } => {
    const newErrors: Record<string, string> = {};
    let firstErrorRef: React.RefObject<any> | null = null;

    console.log('[VALIDATE] 검증 시작');

    // 기본 필드
    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = titleRef;
    }
    if (formData.title.length > 50) {
      newErrors.title = '제목은 최대 50자까지 입력 가능합니다';
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

    // 인원 모집 특가 vs 기간행사 공통/차이점

    // 기간행사 전용 검증
    if (formData.deal_type === 'time_based') {
      // 등록 기간 필수
      if (!formData.deadline_date) {
        newErrors.deadline_date = '마감 날짜를 선택해주세요';
      }
      if (!formData.deadline_time) {
        newErrors.deadline_time = '마감 시간을 선택해주세요';
      }

      // 온라인: 할인 링크 필수 (쿠폰증정 제외)
      if (formData.type === 'online' && formData.pricing_type !== 'coupon_only') {
        if (!formData.discount_url.trim()) {
          newErrors.discount_url = '판매링크/참여방법을 입력해주세요';
          if (!firstErrorRef) firstErrorRef = discountUrlRef;
        }
      }

      // 오프라인: 매장 위치 및 연락처 필수
      if (formData.type === 'offline') {
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
      }

      // 에러가 있으면 포커스 이동 후 종료
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        if (firstErrorRef?.current) {
          firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorRef.current.focus?.();
        }
        return { isValid: false, errors: newErrors, firstErrorRef };
      }
      // 기간행사도 가격 정보 검증 계속 진행
    }

    // 인원 모집 특가 전용 검증
    // 마감시간 검증 (모집기간 설정 시에만)
    if (useDeadline && formData.deadline_type === 'manual') {
      if (!formData.deadline_date) newErrors.deadline_date = '마감 날짜를 선택해주세요';
      if (!formData.deadline_time) newErrors.deadline_time = '마감 시간을 선택해주세요';

      if (formData.deadline_date && formData.deadline_time) {
        const deadline = new Date(`${formData.deadline_date}T${formData.deadline_time}`);
        const now = new Date();
        const minDeadline = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 후
        const maxDeadline = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14일 후

        if (deadline < minDeadline) {
          newErrors.deadline_time = '마감시간은 최소 1시간 이후로 설정해주세요';
        }
        if (deadline > maxDeadline) {
          newErrors.deadline_date = '마감시간은 최대 14일 이내로 설정해주세요';
        }
      }
    }

    // 가격 - coupon_only는 가격 정보 불필요
    if (formData.pricing_type !== 'coupon_only') {
      if (formData.pricing_type === 'single_product') {
        if (!formData.product_name.trim()) {
          newErrors.product_name = '상품명을 입력해주세요';
          if (!firstErrorRef) firstErrorRef = productNameRef;
        }
        if (!formData.original_price) {
          newErrors.original_price = '정상가를 입력해주세요';
          if (!firstErrorRef) firstErrorRef = originalPriceRef;
        }
        const originalPrice = parseInt(formData.original_price.replace(/,/g, ''));
        if (originalPrice > 100000000) {
          newErrors.original_price = '정상가는 최대 1억원까지 입력 가능합니다';
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

      // 공구특가 검사 (단일상품인 경우만)
      if (formData.pricing_type === 'single_product') {
        if (!formData.final_price) {
          newErrors.final_price = '공구특가를 입력해주세요';
        } else {
          const finalPrice = parseInt(formData.final_price.replace(/,/g, ''));
          const originalPrice = parseInt(formData.original_price.replace(/,/g, '')) || 0;

          if (finalPrice > 100000000) {
            newErrors.final_price = '공구특가는 최대 1억원까지 입력 가능합니다';
          } else if (finalPrice > originalPrice) {
            newErrors.final_price = '공구특가는 정상가를 초과할 수 없습니다';
          }
        }
      }
    }

    // 인원 모집 특가 전용: 온라인 할인 제공 방식 검증
    if (formData.deal_type === 'participant_based' && formData.type === 'online') {
      if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
        if (!formData.discount_url.trim()) {
          newErrors.discount_url = '판매링크/참여방법을 입력해주세요';
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

    // 오프라인: 매장 위치 및 연락처 검증 (기간행사 포함)
    if (formData.type === 'offline') {
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

      // 인원 모집 특가일 때만 할인코드 검증
      if (formData.deal_type === 'participant_based') {
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

    const isValid = Object.keys(newErrors).length === 0;

    console.log('[VALIDATE] 검증 완료:', {
      isValid,
      errorCount: Object.keys(newErrors).length,
      errors: newErrors
    });

    if (!isValid) {
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
    }

    return { isValid, errors: newErrors, firstErrorRef };
  };

  // 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[DEBUG] handleSubmit 시작');
    if (loading) return;

    // 1. 패널티, 중복, 프로필 체크 (통합)
    try {
      console.log('[DEBUG] 패널티 체크 시작');
      const result = await checkCanCreateCustomDeal(user);
      console.log('[DEBUG] 패널티 체크 결과:', result);

      if (!result.canProceed) {
        // 패널티가 있는 경우
        if (result.penaltyInfo) {
          setPenaltyInfo(result.penaltyInfo);
          setShowPenaltyModal(true);
          return;
        }

        // 중복 등록인 경우
        if (result.duplicateMessage) {
          setDuplicateDialogMessage(result.duplicateMessage);
          setShowDuplicateDialog(true);
          return;
        }

        // 프로필 정보 부족한 경우
        if (result.missingFields) {
          setProfileMissingFields(result.missingFields);
          setShowProfileModal(true);
          return;
        }
      }
    } catch (error) {
      console.error('등록 전 체크 실패:', error);
      // 체크 실패 시에도 계속 진행
    }

    // 2. 개인회원의 오프라인 공구 등록 방지
    console.log('[DEBUG] 오프라인 체크:', formData.type, isBusinessUser);
    if (formData.type === 'offline' && !isBusinessUser) {
      toast.error('오프라인매장은 사업자 회원만 등록할 수 있습니다');
      return;
    }

    // 3. 폼 유효성 검증
    console.log('[DEBUG] validateForm 시작');
    console.log('[DEBUG] formData:', {
      deal_type: formData.deal_type,
      pricing_type: formData.pricing_type,
      deadline_date: formData.deadline_date,
      deadline_time: formData.deadline_time
    });

    const validation = validateForm();
    console.log('[DEBUG] validateForm 결과:', validation.isValid);
    console.log('[DEBUG] validation.errors:', validation.errors);

    if (!validation.isValid) {
      const firstErrorField = Object.keys(validation.errors)[0];
      const firstErrorMessage = validation.errors[firstErrorField];
      console.log('[DEBUG] 첫 번째 에러 필드:', firstErrorField, firstErrorMessage);
      toast.error(firstErrorMessage || '입력 내용을 확인해주세요');
      return;
    }

    console.log('[DEBUG] validation 통과, 등록 시작');

    try {
      setLoading(true);

      // FormData로 전송 (중고거래 방식)
      const actualImages = images.filter(img => img && !img.isEmpty);
      console.log('[DEBUG] actualImages 개수:', actualImages.length);
      console.log('[DEBUG] actualImages:', actualImages.map((img, i) => ({
        index: i,
        hasFile: !!img.file,
        fileName: img.file?.name,
        fileSize: img.file?.size,
        isFile: img.file instanceof File
      })));

      const submitFormData = new FormData();

      // 이미지 압축 및 추가 (중고폰 방식과 동일)
      toast('이미지 처리 중...', { description: '이미지를 압축하고 있습니다. 잠시만 기다려주세요.' });

      let appendedCount = 0;
      for (let i = 0; i < actualImages.length; i++) {
        const img = actualImages[i];

        if (img.file) {
          try {
            // 이미지 압축 (85% 품질, 최대 1200x1200, webp 변환)
            const compressedBlob = await compressImageInBrowser(img.file, {
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

            console.log('[DEBUG] Compressed:', img.file.name, img.file.size, '->', compressedFile.size);
            submitFormData.append('images', compressedFile);
            appendedCount++;
          } catch (error) {
            console.error(`[DEBUG] Failed to compress image ${i + 1}:`, error);
            // 압축 실패 시 원본 사용
            submitFormData.append('images', img.file);
            appendedCount++;
          }
        } else {
          console.warn('[DEBUG] Image without file:', img);
        }
      }
      console.log('[DEBUG] Total images appended:', appendedCount);

      // 기본 정보
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      if (formData.usage_guide) submitFormData.append('usage_guide', formData.usage_guide);
      submitFormData.append('deal_type', formData.deal_type);
      submitFormData.append('type', formData.type);
      submitFormData.append('categories', JSON.stringify([selectedCategory]));
      submitFormData.append('expired_at', calculateDeadline());

      // 기간행사 vs 인원 모집 특가
      if (formData.deal_type === 'time_based') {
        // 기간행사: 할인 링크 + 가격 정보
        if (formData.type === 'online' && formData.discount_url) {
          submitFormData.append('discount_url', formData.discount_url);
        }
        // 오프라인: 매장 정보
        if (formData.type === 'offline') {
          submitFormData.append('location', formData.location);
          if (formData.location_detail) submitFormData.append('location_detail', formData.location_detail);
          submitFormData.append('phone_number', formData.phone_number);
        }
        // target_participants는 보내지 않음 (백엔드에서 null 허용)
      } else {
        // 인원 모집 특가만: 목표 인원, 부분 판매
        submitFormData.append('target_participants', formData.target_participants);
        submitFormData.append('allow_partial_sale', formData.allow_partial_sale.toString());
      }

      // 가격 정보 (공통) - coupon_only는 가격 정보 불필요
      submitFormData.append('pricing_type', formData.pricing_type);

      if (formData.pricing_type === 'coupon_only') {
        // 쿠폰전용: 가격 정보 전송하지 않음
      } else if (formData.pricing_type === 'single_product') {
        submitFormData.append('products', JSON.stringify([{
          name: formData.product_name,
          original_price: parseInt(formData.original_price.replace(/,/g, '')),
          discount_rate: parseInt(formData.discount_rate),
          final_price: parseInt(formData.final_price.replace(/,/g, ''))
        }]));
      } else {
        submitFormData.append('discount_rate', formData.discount_rate);
      }

      // 인원 모집 특가만: 할인 코드/링크 전송
      if (formData.deal_type === 'participant_based') {
        const validCodes = discountCodes.filter(c => c.trim());

        // 온라인 특화 정보
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
          if (formData.phone_number) {
            submitFormData.append('phone_number', formData.phone_number);
          }
        }
        // 오프라인 특화 정보
        else {
          submitFormData.append('location', formData.location);
          if (formData.location_detail) submitFormData.append('location_detail', formData.location_detail);
          submitFormData.append('phone_number', formData.phone_number);
          submitFormData.append('discount_valid_days', formData.offline_discount_valid_days);
          submitFormData.append('discount_codes', JSON.stringify(validCodes));
        }
      }

      // 디버깅: 전송할 데이터 로그 출력
      console.log('=== 커스텀 공구 등록 데이터 ===');
      console.log('타입:', formData.type);
      console.log('가격 유형:', formData.pricing_type);
      console.log('이미지 개수:', actualImages.length);

      // FormData 내용 출력 (multiple values 고려)
      const formDataEntries: Record<string, any[]> = {};
      for (const [key, value] of submitFormData.entries()) {
        if (!formDataEntries[key]) {
          formDataEntries[key] = [];
        }
        if (value instanceof File) {
          formDataEntries[key].push(`[File: ${value.name}, ${(value.size / 1024).toFixed(2)}KB]`);
        } else {
          formDataEntries[key].push(value);
        }
      }
      console.log('전송 데이터:', formDataEntries);

      // images 키의 모든 파일 확인
      const imageFiles = submitFormData.getAll('images');
      console.log('[DEBUG] FormData.getAll("images") 개수:', imageFiles.length);
      console.log('[DEBUG] FormData.getAll("images") 상세:', imageFiles.map((f: any) =>
        f instanceof File ? `${f.name} (${f.size} bytes)` : f
      ));

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
                  오프라인매장은 사업자 회원만 등록 가능합니다
                </p>
                <p className="text-sm font-bold text-slate-900">
                  등록 불가: 할부/약정 상품, 금융상품, 사행성, 방문 서비스, 청소년 유해상품
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
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden group ${
                        hasImage ? 'border-slate-300' : 'border-dashed border-slate-200'
                      }`}
                    >
                      {hasImage ? (
                        <>
                          <Image src={image.url} alt={`이미지 ${index + 1}`} fill className="object-cover rounded-lg" />

                          {/* 호버 시 오버레이 */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg pointer-events-none" />

                          {/* 대표 이미지 표시 */}
                          {image.isMain && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded font-medium z-10">대표</div>
                          )}

                          {/* 액션 버튼들 - 모바일에서는 X만, PC에서는 전체 버튼 */}
                          <div className="absolute bottom-2 right-2 sm:left-2 sm:right-2 flex gap-1 z-20">
                            {/* PC에서만 변경/대표 버튼 표시 */}
                            <div className="hidden sm:flex gap-1 flex-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <label
                                htmlFor={`image-replace-${index}`}
                                className="flex-1 bg-white/90 backdrop-blur text-slate-900 text-xs py-1 rounded hover:bg-white text-center cursor-pointer"
                              >
                                변경
                              </label>
                              <input
                                type="file"
                                id={`image-replace-${index}`}
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, index)}
                                className="hidden"
                              />
                              {!image.isMain && (
                                <button
                                  type="button"
                                  className="flex-1 bg-white/90 backdrop-blur text-slate-900 text-xs py-1 rounded hover:bg-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetMainImage(index);
                                  }}
                                >
                                  대표
                                </button>
                              )}
                            </div>
                            {/* X 버튼은 모바일/PC 모두 표시 */}
                            <button
                              type="button"
                              className="bg-red-500/90 backdrop-blur text-white px-2 py-1 rounded hover:bg-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageRemove(index);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
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
          <CardContent className="space-y-4 p-5">
            {/* 제목 */}
            <div>
              <Label>제목 *</Label>
              <Input
                ref={titleRef}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="공구 제목을 입력하세요"
                className={errors.title ? 'border-red-300' : ''}
                maxLength={50}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                <p className="text-sm text-slate-500 ml-auto">{formData.title.length}/50</p>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <Label>상품 설명 *</Label>
                <span className="text-xs text-slate-500">• 판매중인 상품 url, 매장정보, 상품정보 등 자유롭게 입력해주세요</span>
              </div>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => handleInputChange('description', content)}
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

            {/* 타입 선택 (온라인/오프라인) */}
            <div>
              <Label className="text-base font-semibold">판매 유형 *</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value as 'online' | 'offline')}
                className="flex gap-6 mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="online" className="w-5 h-5" />
                  <Label htmlFor="online" className="text-base cursor-pointer">온라인판매</Label>
                </div>
                {isBusinessUser && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="offline" id="offline" className="w-5 h-5" />
                    <Label htmlFor="offline" className="text-base cursor-pointer">오프라인매장</Label>
                  </div>
                )}
              </RadioGroup>
              {!isBusinessUser && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 오프라인매장은 사업자 회원만 이용 가능합니다
                  </p>
                </div>
              )}
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
                    py-2 px-3 rounded-lg border-2 font-medium transition-all
                    ${cat.label === '건강/의료' ? 'text-xs' : 'text-sm'}
                    ${selectedCategory === cat.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  {cat.label === '건강/의료' ? '건강/헬스케어' : cat.label}
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
            {/* 기간행사 체크박스 */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <div>
                <p className="font-medium text-orange-900">기간행사로 등록</p>
                <p className="text-sm text-orange-700">인원제한 없이 정해진 기간동안 제공되는 할인 혜택</p>
              </div>
              <Switch
                checked={formData.deal_type === 'time_based'}
                onCheckedChange={(checked) => {
                  handleInputChange('deal_type', checked ? 'time_based' : 'participant_based');
                }}
              />
            </div>

            {/* 가격 유형 선택 */}
            <div>
              <Label>가격 유형 *</Label>
              <RadioGroup
                value={formData.pricing_type}
                onValueChange={(value) => {
                  handleInputChange('pricing_type', value);
                }}
                className="flex flex-wrap gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single_product" id="single" />
                  <Label htmlFor="single" className="cursor-pointer">단일상품</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_products" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">전품목 할인</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coupon_only" id="coupon" />
                  <Label htmlFor="coupon" className="cursor-pointer">서비스제공 (서비스, 할인쿠폰 등)</Label>
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
                <div>
                  <Label>정상가(판매중인 가격) *</Label>
                  <Input
                    ref={originalPriceRef}
                    value={formData.original_price}
                    onChange={(e) => handleInputChange('original_price', formatPrice(e.target.value))}
                    placeholder="0"
                    className={errors.original_price ? 'border-red-300' : ''}
                  />
                  {errors.original_price && <p className="text-sm text-red-600 mt-1">{errors.original_price}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>할인율 (%) *</Label>
                    <Input
                      ref={discountRateRef}
                      type="number"
                      value={formData.discount_rate}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value <= 99) {
                          handleDiscountRateChange(e.target.value);
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
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Label className="text-blue-900">공구특가 *</Label>
                    <Input
                      value={formData.final_price}
                      onChange={(e) => handleFinalPriceChange(e.target.value)}
                      placeholder="0"
                      className={`mt-1.5 bg-white ${errors.final_price ? 'border-red-300' : 'border-blue-300'}`}
                    />
                    {errors.final_price && <p className="text-sm text-red-600 mt-1">{errors.final_price}</p>}
                    <p className="text-xs text-blue-600 mt-1">최대 1억원</p>
                  </div>
                </div>
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

            {/* 가격 입력 안내 */}
            {formData.pricing_type !== 'coupon_only' && (
              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                💡 {formData.deal_type === 'time_based' ? '기간행사 할인가로 입력해주세요' : '공구 전용 할인가로 입력해주세요'}
              </div>
            )}

            {/* 서비스제공 안내 */}
            {formData.pricing_type === 'coupon_only' && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                {formData.deal_type === 'time_based' ? (
                  <>
                    💡 기간행사 서비스제공: 가격 정보 없이 기간 내 조건 없이 무료 서비스나 이벤트를 제공합니다
                    <div className="mt-2">
                      • 오프라인: 매장 위치와 연락처만 입력<br/>
                      • 온라인: 행사 안내 링크 입력 (선택사항)
                    </div>
                  </>
                ) : (
                  <>
                    💡 인원 모집 쿠폰증정: 목표 인원 달성 시 참여자에게만 쿠폰을 제공합니다
                    <div className="mt-2">
                      • 할인 코드, 링크 또는 텍스트 형태로 제공 가능
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 기간행사: 할인 링크 / 서비스제공+기간행사: 행사 안내 링크 */}
        {formData.deal_type === 'time_based' && (
          <Card className="mb-6 border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <LinkIcon className="w-5 h-5" />
                {formData.pricing_type === 'coupon_only'
                  ? '이벤트/행사 안내 링크'
                  : formData.type === 'online'
                    ? '할인 링크 *'
                    : '이벤트/행사 안내 링크'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>
                  {formData.pricing_type === 'coupon_only'
                    ? '이벤트/행사 안내 링크 (선택사항)'
                    : formData.type === 'online'
                      ? '할인이 적용된 구매 링크 *'
                      : '이벤트/행사 안내 링크 (선택사항)'}
                </Label>
                <Input
                  value={formData.discount_url}
                  onChange={(e) => handleInputChange('discount_url', e.target.value)}
                  placeholder="https://..."
                  className={`bg-white ${errors.discount_url ? 'border-red-300' : ''}`}
                  ref={discountUrlRef}
                />
                {errors.discount_url && <p className="text-sm text-red-600 mt-1">{errors.discount_url}</p>}

                {/* 링크 테스트 버튼 */}
                {formData.discount_url && formData.discount_url.startsWith('http') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(formData.discount_url, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-2 mt-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    링크 테스트
                  </Button>
                )}

                <p className="text-xs text-gray-600 mt-2">
                  💡 {formData.type === 'online'
                    ? '행사 진행중인 판매링크를 입력해주세요'
                    : '매장 행사 정보를 확인할 수 있는 링크를 입력해주세요 (선택사항)'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 기간행사: 등록 기간 */}
        {formData.deal_type === 'time_based' && (
          <Card className="mb-6 border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Clock className="w-5 h-5" />
                등록 기간 *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-orange-700">기간행사 진행 기간을 설정해주세요</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-700">마감 날짜 *</Label>
                  <Input
                    type="date"
                    value={formData.deadline_date}
                    onChange={(e) => handleInputChange('deadline_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.deadline_date ? 'border-red-300 bg-white' : 'bg-white'}
                  />
                  {errors.deadline_date && <p className="text-sm text-red-600 mt-1">{errors.deadline_date}</p>}
                </div>
                <div>
                  <Label className="text-sm text-slate-700">마감 시간 *</Label>
                  <Input
                    type="time"
                    value={formData.deadline_time}
                    onChange={(e) => handleInputChange('deadline_time', e.target.value)}
                    className={errors.deadline_time ? 'border-red-300 bg-white' : 'bg-white'}
                  />
                  {errors.deadline_time && <p className="text-sm text-red-600 mt-1">{errors.deadline_time}</p>}
                </div>
              </div>

              <p className="text-xs text-slate-600">
                💡 설정한 날짜/시간까지 기간행사가 진행됩니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* 인원 모집 특가: 모집 설정 */}
        {formData.deal_type === 'participant_based' && (
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
                  {Array.from({ length: 19 }, (_, i) => i + 2).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}명</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2 text-blue-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  공구 모집 기간
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
                  className={useDeadline ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}
                >
                  {useDeadline ? '설정 해제' : '모집기간 수동 설정'}
                </Button>
              </div>

              {!useDeadline && (
                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  모집기간을 설정하지 않으면 <span className="font-medium text-blue-700">등록 시간 기준 7일 후</span> 자동으로 마감 처리됩니다
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
                          : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50'
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
                          : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      직접 선택
                    </button>
                  </div>

                  {/* 자동 선택 */}
                  {formData.deadline_type === 'auto' && (
                <>
                  <p className="text-xs text-blue-600 mb-2">등록 시간 기준으로 자동 계산됩니다</p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleInputChange('deadline_days', day.toString())}
                        className={`
                          py-2 px-1.5 rounded-md border text-xs font-medium transition-all text-center
                          ${formData.deadline_days === day.toString()
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:bg-blue-50'
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
                  <p className="text-sm text-blue-600 mb-2">최소 1시간 이후 ~ 최대 14일 이내로 설정해주세요</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600">날짜</Label>
                      <Input
                        type="date"
                        value={formData.deadline_date}
                        onChange={(e) => handleInputChange('deadline_date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
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
                  <p className="text-xs text-slate-500 mt-2">
                    💡 현재 시간 기준으로 1시간 이후부터 설정 가능합니다
                  </p>
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
        )}

        {/* 할인 제공 방식: 인원 모집 특가의 온라인만 */}
        {formData.deal_type === 'participant_based' && formData.type === 'online' && (
          <Card className="mb-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                {formData.pricing_type === 'coupon_only' ? '쿠폰 제공 방식' : '할인 제공 방식'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.online_discount_type}
                onValueChange={(value) => handleInputChange('online_discount_type', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="link_only" id="link_only" />
                  <Label htmlFor="link_only" className="font-normal cursor-pointer">
                    링크만 <span className="text-xs text-slate-500">•모든 참여자에게 발송되는 비공개 링크 또는 참여방법</span>
                  </Label>
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

              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  💡 {formData.pricing_type === 'coupon_only'
                    ? '기간 내 쿠폰을 요청한 사용자에게 제공됩니다'
                    : '공구마감 후 참여자에게 제공됩니다'}
                </p>

                <div className="space-y-3">
                  {/* 스마트스토어 안내 */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-2">【 스마트스토어 판매자 】</p>
                    <p className="text-xs text-slate-600 mb-2">
                      아래 이미지와 같이 설정 후 상품링크를 복사하여 입력해주세요
                    </p>
                    <Image
                      src="/images/스마트스토어비공개세팅방법.png"
                      alt="스마트스토어 비공개 설정 방법"
                      width={300}
                      height={150}
                      className="rounded border border-slate-200 mb-2"
                    />
                    <p className="text-xs text-slate-600">
                      ① 상품복사 → ② 공구가격 수정 → ③ 전시중지+네이버쇼핑 해제 → ④ 링크복사
                    </p>
                  </div>

                  {/* 기타 쇼핑몰 안내 */}
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-1">【 기타 쇼핑몰 (쿠팡/11번가 등) 】</p>
                    <p className="text-xs text-slate-600">
                      • 할인코드 입력 (참여인원 수만큼)
                    </p>
                  </div>

                  <p className="text-xs text-orange-600 font-medium">
                    ※ 공구 진행 중 일반 고객 노출 방지 필수
                  </p>
                </div>
              </div>

              {(formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') && (
                <div className="space-y-3">
                  <div>
                    <Label className="flex items-baseline gap-2">
                      판매링크/참여방법안내 *
                      <span className="text-xs text-slate-500 font-normal">(판매링크 또는 참여방법(텍스트))</span>
                    </Label>
                    <Input
                      ref={discountUrlRef}
                      value={formData.discount_url}
                      onChange={(e) => handleInputChange('discount_url', e.target.value)}
                      placeholder="공구전용 비공개 링크 또는 참여방식을 입력해주세요"
                      className={errors.discount_url ? 'border-red-300' : ''}
                      maxLength={500}
                    />
                    {errors.discount_url && <p className="text-sm text-red-600 mt-1">{errors.discount_url}</p>}
                    <p className="text-xs text-slate-500">참여방법 예) 가게에서 둥지에서 왔어요 라고 말씀해주세요</p>
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
                    할인 코드 또는 링크 * {errors.discount_codes && <span className="text-red-600 text-sm">{errors.discount_codes}</span>}
                  </Label>
                  <div className="space-y-2 mt-2">
                    {discountCodes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={code}
                          onChange={(e) => updateDiscountCode(index, e.target.value)}
                          placeholder={`코드 또는 링크 ${index + 1}`}
                          maxLength={500}
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
                        disabled={discountCodes.length >= parseInt(formData.target_participants)}
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

                  {/* 중복 코드 에러 메시지 */}
                  {duplicateCodeError && (
                    <p className="text-sm text-red-600 mt-2 animate-pulse">
                      {duplicateCodeError}
                    </p>
                  )}
                </div>
              )}

              {/* 할인 유효기간 - 인원 모집 특가만 */}
              {(formData.deal_type as string) !== 'time_based' && (
                <div>
                  <Label>{formData.online_discount_type === 'link_only' ? '할인 판매기간' : '할인 유효기간'} *</Label>
                  <Select
                    value={['1', '3', '7', '14', '30', '60', 'custom'].includes(formData.discount_valid_days) ? formData.discount_valid_days : 'custom'}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        handleInputChange('discount_valid_days', '');
                      } else {
                        handleInputChange('discount_valid_days', value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1일</SelectItem>
                      <SelectItem value="3">3일</SelectItem>
                      <SelectItem value="7">7일</SelectItem>
                      <SelectItem value="14">14일</SelectItem>
                      <SelectItem value="30">30일</SelectItem>
                      <SelectItem value="60">60일</SelectItem>
                      <SelectItem value="custom">직접입력 (1~60일)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 직접입력 선택 시 숫자 입력 필드 표시 */}
                  {!['1', '3', '7', '14', '30', '60'].includes(formData.discount_valid_days) && (
                    <Input
                      type="number"
                      value={formData.discount_valid_days}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || '';
                        if (value === '' || (value >= 1 && value <= 60)) {
                          handleInputChange('discount_valid_days', e.target.value);
                        }
                      }}
                      placeholder="1~60 사이의 숫자 입력"
                      min="1"
                      max="60"
                      className="mt-2"
                    />
                  )}

                  <p className="text-sm text-slate-500 mt-1">
                    공구 마감 후부터 유효기간 적용
                  </p>
                </div>
              )}

              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  연락처 (선택)
                </Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9\-]/g, '');
                    if (value.length <= 20) {
                      handleInputChange('phone_number', value);
                    }
                  }}
                  placeholder="010-1234-5678"
                  maxLength={20}
                />
                <p className="text-xs text-slate-500 mt-1">
                  문의가 필요한 경우 입력해주세요
                </p>
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
                  매장 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>매장 위치 *</Label>
                  <div className="flex gap-2">
                    <Input
                      ref={locationRef}
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="주소 검색 버튼을 클릭하세요"
                      className={errors.location ? 'border-red-300' : ''}
                      maxLength={150}
                    />
                    <AddressSearch
                      onComplete={(address) => handleInputChange('location', address)}
                      buttonText="주소 검색"
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
                    <p className="text-sm text-slate-500 ml-auto">{formData.location.length}/150</p>
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

            {/* 인원 모집 특가: 할인 코드 */}
            {formData.deal_type === 'participant_based' && (
              <Card className="mb-6 border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    할인 코드 및 유효기간
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      💡 오프라인 매장 할인코드 활용 방법<br />
                      • 참여자가 할인코드를 매장에서 제시 (휴대폰 화면)<br />
                      • 마감 후 관리페이지 QR코드 스캔 기능 사용 또는 할인코드 수동 확인<br />
                      • 할인코드는 공구 마감 후 참여자에게 자동 발송됩니다
                    </p>
                  </div>

                <div>
                  <Label>할인 코드 또는 링크 * {errors.discount_codes && <span className="text-red-600 text-sm ml-2">{errors.discount_codes}</span>}</Label>
                  <div className="space-y-2 mt-2">
                    {discountCodes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={code}
                          onChange={(e) => updateDiscountCode(index, e.target.value)}
                          placeholder={`코드 또는 링크 ${index + 1}`}
                          maxLength={500}
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
                        disabled={discountCodes.length >= parseInt(formData.target_participants)}
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

                  {/* 중복 코드 에러 메시지 */}
                  {duplicateCodeError && (
                    <p className="text-sm text-red-600 mt-2 animate-pulse">
                      {duplicateCodeError}
                    </p>
                  )}

                  {(selectedCategory === 'food' || selectedCategory === 'cafe') && (
                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-300 mt-2">
                      ⚠️ 요식업의 경우 포장 및 매장 이용 시에만 사용 가능함을 표기합니다.
                    </p>
                  )}
                </div>

                {/* 할인 유효기간 - 인원 모집 특가만 */}
                {(formData.deal_type as string) !== 'time_based' && (
                  <div>
                    <Label>할인 유효기간 *</Label>
                    <Select
                      value={['1', '3', '7', '14', '30', '60', 'custom'].includes(formData.offline_discount_valid_days) ? formData.offline_discount_valid_days : 'custom'}
                      onValueChange={(value) => {
                        if (value === 'custom') {
                          handleInputChange('offline_discount_valid_days', '');
                        } else {
                          handleInputChange('offline_discount_valid_days', value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1일</SelectItem>
                        <SelectItem value="3">3일</SelectItem>
                        <SelectItem value="7">7일</SelectItem>
                        <SelectItem value="14">14일</SelectItem>
                        <SelectItem value="30">30일</SelectItem>
                        <SelectItem value="60">60일</SelectItem>
                        <SelectItem value="custom">직접입력 (1~60일)</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* 직접입력 선택 시 숫자 입력 필드 표시 */}
                    {!['1', '3', '7', '14', '30', '60'].includes(formData.offline_discount_valid_days) && (
                      <Input
                        type="number"
                        value={formData.offline_discount_valid_days}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || '';
                          if (value === '' || (value >= 1 && value <= 60)) {
                            handleInputChange('offline_discount_valid_days', e.target.value);
                          }
                        }}
                        placeholder="1~60 사이의 숫자 입력"
                        min="1"
                        max="60"
                        className="mt-2"
                      />
                    )}

                    <p className="text-sm text-slate-500 mt-1">
                      공구 마감 후부터 유효기간 적용
                    </p>
                  </div>
                )}
              </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 등록 버튼 */}
        <div className="space-y-3">
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
              disabled={loading || (user?.penalty_info?.is_active || user?.penaltyInfo?.isActive)}
            >
              {loading ? '등록 중...' : '공구/행사 등록'}
            </Button>
          </div>

          {/* 패널티 안내 메시지 */}
          {(user?.penalty_info?.is_active || user?.penaltyInfo?.isActive) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    패널티로 인해 공구 등록이 제한됩니다
                  </p>
                  <p className="text-xs text-red-700">
                    남은 시간: {user?.penalty_info?.remaining_text || user?.penaltyInfo?.remainingText ||
                      `${user?.penalty_info?.remaining_hours || user?.penaltyInfo?.remainingHours || 0}시간 ${user?.penalty_info?.remaining_minutes || user?.penaltyInfo?.remainingMinutes || 0}분`}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    사유: {user?.penalty_info?.reason || user?.penaltyInfo?.reason || '패널티 적용 중'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Profile Check Modal */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={profileMissingFields}
        onUpdateProfile={() => {
          setShowProfileModal(false);
          router.push('/mypage');
        }}
      />

      {/* Penalty Modal */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={penaltyInfo}
        userRole="buyer"
      />

      {/* Duplicate Active Deal Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent className="max-w-sm bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              진행중인 공구가 있습니다
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left whitespace-pre-line text-gray-700 text-sm">
              {duplicateDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowDuplicateDialog(false);
                router.push('/custom-deals/my');
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white w-full"
            >
              내 공구 보러가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}