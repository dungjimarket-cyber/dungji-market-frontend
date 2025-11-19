'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, AlertCircle, Info, ArrowLeft, Clock, Users, Tag, MapPin, Phone, Link as LinkIcon, Ticket, Lock, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import AddressSearch from '@/components/address/AddressSearch';
import RichTextEditor from '@/components/custom/RichTextEditor';
import LinkPreview from '@/components/custom/LinkPreview';

// 이미지 미리보기 타입
interface ImagePreview {
  file: File | null;
  url: string;
  isEmpty?: boolean;
  existingUrl?: string; // 기존 S3 URL
  id?: number; // 기존 이미지 ID
}

// 카테고리 타입
interface Category {
  value: string;
  label: string;
}

export default async function CustomDealEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomDealEditClient dealId={id} />;
}

function CustomDealEditClient({ dealId }: { dealId: string }) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [imagesModified, setImagesModified] = useState(false); // 이미지 변경 추적
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasParticipants, setHasParticipants] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // 할인코드 배열
  const [discountCodes, setDiscountCodes] = useState<string[]>(['']);

  // 중복 코드 에러
  const [duplicateCodeError, setDuplicateCodeError] = useState<string | null>(null);

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    usage_guide: '',
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
    online_discount_type: 'link_only' as 'link_only' | 'code_only' | 'both',
    discount_url: '',
    discount_valid_days: '1',
    location: '',
    location_detail: '',
    phone_number: '',
    offline_discount_valid_days: '1',
  });

  // 기존 데이터 로드
  useEffect(() => {
    if (authLoading) return; // 인증 로딩 중이면 대기

    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
      return;
    }
    fetchDealDetail();
  }, [dealId, isAuthenticated, authLoading]);

  const fetchDealDetail = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${dealId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('데이터 로드 실패');

      const data = await response.json();

      // 권한 체크 (seller는 ID 자체)
      if (data.seller !== parseInt(user?.id || '0')) {
        toast.error('수정 권한이 없습니다');
        router.push(`/custom-deals/${dealId}`);
        return;
      }

      // 상태 체크 (완료/취소/만료된 공구는 수정 불가)
      if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'expired') {
        const statusText = data.status === 'completed' ? '완료된' : data.status === 'cancelled' ? '취소된' : '만료된';
        toast.error(`${statusText} 공구는 수정할 수 없습니다`);
        router.push('/custom-deals/my');
        return;
      }

      setOriginalData(data);
      setHasParticipants(data.current_participants > 0);

      // 폼 데이터 설정
      setFormData({
        title: data.title || '',
        description: data.description || '',
        usage_guide: data.usage_guide || '',
        type: data.type || 'online',
        pricing_type: data.pricing_type || 'single_product',
        product_name: data.products?.[0]?.name || data.product_name || '',
        original_price: data.products?.[0]?.original_price?.toLocaleString() || data.original_price?.toLocaleString() || '',
        discount_rate: (data.products?.[0]?.discount_rate || data.discount_rate || '').toString(),
        final_price: (() => {
          // 저장된 final_price가 있으면 그 값 사용 (사용자가 직접 입력한 값)
          const savedFinalPrice = data.products?.[0]?.final_price || data.final_price;
          if (savedFinalPrice) {
            return savedFinalPrice.toLocaleString();
          }
          // 없으면 계산 (하위 호환성)
          const original = data.products?.[0]?.original_price || data.original_price || 0;
          const discount = data.products?.[0]?.discount_rate || data.discount_rate || 0;
          if (original > 0 && discount > 0) {
            return Math.floor(original * (100 - discount) / 100).toLocaleString();
          }
          return '';
        })(),
        target_participants: data.target_participants?.toString() || '2',
        deadline_type: 'manual',
        deadline_days: '3',
        deadline_date: data.expired_at ? data.expired_at.split('T')[0] : '',
        deadline_time: data.expired_at ? data.expired_at.split('T')[1].slice(0, 5) : '',
        allow_partial_sale: data.allow_partial_sale || false,
        online_discount_type: data.online_discount_type || 'link_only',
        discount_url: data.discount_url || '',
        discount_valid_days: data.discount_valid_days?.toString() || '1',
        location: data.location || '',
        location_detail: data.location_detail || '',
        phone_number: data.phone_number || '',
        offline_discount_valid_days: data.discount_valid_days?.toString() || '1',
      });

      // 카테고리
      if (data.categories && data.categories.length > 0) {
        setSelectedCategory(data.categories[0]);
      }

      // 이미지 (첫 번째 이미지가 자동으로 대표 이미지)
      if (data.images && data.images.length > 0) {
        setImages(data.images.map((img: any) => ({
          file: null,
          url: img.image_url,
          isEmpty: false,
          existingUrl: img.image_url,
          id: img.id // 이미지 ID 저장
        })));
      }

      // 할인코드
      if (data.discount_codes && data.discount_codes.length > 0) {
        setDiscountCodes(data.discount_codes);
      }

    } catch (error) {
      console.error('데이터 로드 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
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

  // 변경사항 감지
  useEffect(() => {
    if (!originalData) return;

    // 이미지 변경 체크
    if (imagesModified) {
      setHasChanges(true);
      return;
    }

    // 기본 정보 변경 체크 (항상 수정 가능)
    const basicFieldsChanged =
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      (formData.usage_guide || '') !== (originalData.usage_guide || '');

    if (basicFieldsChanged) {
      setHasChanges(true);
      return;
    }

    // 할인 정보 변경 체크 (항상 수정 가능)
    const discountInfoChanged =
      formData.discount_url !== (originalData.discount_url || '') ||
      formData.discount_valid_days !== (originalData.discount_valid_days?.toString() || '1') ||
      formData.offline_discount_valid_days !== (originalData.discount_valid_days?.toString() || '1') ||
      JSON.stringify(discountCodes) !== JSON.stringify(originalData.discount_codes || ['']);

    if (discountInfoChanged) {
      setHasChanges(true);
      return;
    }

    // 부분 판매 옵션 변경 체크 (항상 수정 가능)
    if (formData.allow_partial_sale !== originalData.allow_partial_sale) {
      setHasChanges(true);
      return;
    }

    // 등록 기간 변경 체크 (참여자 있어도 수정 가능)
    const originalDeadlineDate = originalData.expired_at
      ? originalData.expired_at.split('T')[0]
      : '';
    const originalDeadlineTime = originalData.expired_at
      ? originalData.expired_at.split('T')[1].slice(0, 5)
      : '';

    const deadlineChanged =
      formData.deadline_date !== originalDeadlineDate ||
      formData.deadline_time !== originalDeadlineTime;

    if (deadlineChanged) {
      setHasChanges(true);
      return;
    }

    // 참여자가 없을 때만 다른 필드 체크
    if (!hasParticipants) {
      // 카테고리 변경
      const categoryChanged = selectedCategory !== (originalData.categories?.[0] || '');
      if (categoryChanged) {
        setHasChanges(true);
        return;
      }

      // 가격 정보 변경
      const priceChanged =
        formData.pricing_type !== originalData.pricing_type ||
        formData.product_name !== (originalData.products?.[0]?.name || originalData.product_name || '') ||
        formData.original_price !== (originalData.products?.[0]?.original_price?.toLocaleString() || originalData.original_price?.toLocaleString() || '') ||
        formData.discount_rate !== (originalData.products?.[0]?.discount_rate || originalData.discount_rate || '').toString() ||
        formData.target_participants !== (originalData.target_participants?.toString() || '2') ||
        formData.allow_partial_sale !== originalData.allow_partial_sale;

      if (priceChanged) {
        setHasChanges(true);
        return;
      }

      // 온라인 공구 설정 변경
      if (formData.type === 'online') {
        const onlineChanged =
          formData.online_discount_type !== originalData.online_discount_type ||
          formData.discount_url !== (originalData.discount_url || '') ||
          formData.discount_valid_days !== (originalData.discount_valid_days?.toString() || '') ||
          formData.phone_number !== (originalData.phone_number || '');

        if (onlineChanged) {
          setHasChanges(true);
          return;
        }
      }

      // 오프라인 공구 설정 변경
      if (formData.type === 'offline') {
        const offlineChanged =
          formData.location !== (originalData.location || '') ||
          formData.location_detail !== (originalData.location_detail || '') ||
          formData.phone_number !== (originalData.phone_number || '') ||
          formData.offline_discount_valid_days !== (originalData.discount_valid_days?.toString() || '7');

        if (offlineChanged) {
          setHasChanges(true);
          return;
        }
      }
    }

    // 변경사항 없음
    setHasChanges(false);
  }, [
    originalData,
    imagesModified,
    formData,
    selectedCategory,
    discountCodes,
    hasParticipants
  ]);

  // 이미지 업로드 핸들러 (중고거래 로직 복사)
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | File[], targetIndex?: number) => {
    const files = Array.isArray(e) ? e : Array.from(e.target.files || []);
    console.log('🔍 handleImageUpload 호출됨:', { targetIndex, filesLength: files.length });
    if (files.length === 0) return;

    // input 초기화 (같은 파일 재선택 가능하도록)
    if (!Array.isArray(e) && e.target) {
      e.target.value = '';
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 파일이 10MB를 초과합니다`);
        return;
      }
    }

    setImages(prev => {
      const updated = [...prev];

      // targetIndex가 지정된 경우 (특정 슬롯에 추가/교체)
      if (targetIndex !== undefined) {
        if (files.length === 1) {
          const file = files[0];

          // 배열 길이가 targetIndex보다 작으면 확장
          while (updated.length <= targetIndex) {
            updated.push({ file: null, url: '', isEmpty: true });
          }

          const existingImage = updated[targetIndex];

          // 기존 blob URL 해제 (existingUrl은 S3 URL이므로 해제 안 함)
          if (existingImage && existingImage.url && !existingImage.existingUrl) {
            URL.revokeObjectURL(existingImage.url);
          }

          // 지정된 슬롯에 이미지 추가 (existingUrl과 id 제거)
          updated[targetIndex] = {
            file,
            url: URL.createObjectURL(file),
            isEmpty: false
            // existingUrl과 id는 의도적으로 포함하지 않음 (새 파일로 교체)
          };
          setImagesModified(true);
          return updated;
        } else {
          toast.error('한 번에 한 장씩만 추가할 수 있습니다');
          return prev;
        }
      }

      // targetIndex 없는 경우 (메인 input에서 다중 업로드)
      const actualImages = updated.filter(img => img && !img.isEmpty);
      if (actualImages.length + files.length > 5) {
        toast.error('최대 5장까지 업로드 가능합니다');
        return prev;
      }

      files.forEach((file) => {
        // isEmpty 슬롯 먼저 찾기
        const emptySlotIndex = updated.findIndex(img => img?.isEmpty);

        if (emptySlotIndex !== -1) {
          // isEmpty 슬롯에 추가
          if (updated[emptySlotIndex] && updated[emptySlotIndex].url) {
            URL.revokeObjectURL(updated[emptySlotIndex].url);
          }
          updated[emptySlotIndex] = {
            file,
            url: URL.createObjectURL(file),
            isEmpty: false
          };
        } else if (updated.length < 5) {
          // 빈 슬롯 없으면 끝에 추가
          updated.push({
            file,
            url: URL.createObjectURL(file),
            isEmpty: false
          });
        }
      });

      setImagesModified(true);
      return updated;
    });

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

      if (imageToRemove && imageToRemove.url && !imageToRemove.existingUrl) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      updated[index] = { file: null, url: '', isEmpty: true };

      return updated;
    });
    setImagesModified(true); // 이미지 수정됨 표시
  }, []);

  // 대표 이미지 설정 (배열 순서 변경)
  const handleSetMainImage = useCallback((index: number) => {
    setImages(prev => {
      const updated = [...prev];
      const [mainImage] = updated.splice(index, 1);
      return [mainImage, ...updated];
    });
    setImagesModified(true); // 대표 이미지 변경도 수정으로 간주
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
    if (hasParticipants) {
      toast.error('참여자가 있는 공구는 카테고리를 수정할 수 없습니다');
      return;
    }
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

  // 할인코드 인원 기준 자동생성
  const autoGenerateDiscountCodes = () => {
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
    // 참여자가 있을 때는 제목, 설명, 이용안내, 할인정보, 부분 판매 옵션, 등록 기간만 수정 가능
    if (hasParticipants && !['title', 'description', 'usage_guide', 'discount_url', 'discount_valid_days', 'offline_discount_valid_days', 'allow_partial_sale', 'deadline_type', 'deadline_date', 'deadline_time'].includes(field)) {
      toast.error('참여자가 있는 공구는 제목, 상품설명, 이용안내, 할인정보, 부분 판매 옵션, 등록 기간만 수정 가능합니다');
      return;
    }

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

  // 가격 포맷팅
  const formatPrice = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    const numValue = parseInt(numbers);
    if (numValue > 100000000) return '100,000,000';
    return numValue.toLocaleString('ko-KR');
  };

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

  // 정상가 변경 시 할인율 자동 재계산
  const handleOriginalPriceChange = (price: string) => {
    const original = parseInt(price.replace(/,/g, '')) || 0;
    const final = parseInt(formData.final_price.replace(/,/g, '')) || 0;

    setFormData(prev => ({
      ...prev,
      original_price: formatPrice(price)
    }));

    // 공구특가가 이미 입력되어 있으면 할인율 재계산
    if (original > 0 && final > 0) {
      if (final > original) {
        setErrors(prev => ({ ...prev, final_price: '공구특가는 정상가를 초과할 수 없습니다' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.final_price;
          return newErrors;
        });
      }

      const calculatedRate = Math.floor((1 - final / original) * 100);
      setFormData(prev => ({
        ...prev,
        discount_rate: Math.max(0, Math.min(99, calculatedRate)).toString()
      }));
    }
  };

  // 수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      // FormData로 전송
      const submitFormData = new FormData();

      // 이미지 처리 - 이미지가 변경된 경우에만 전송
      if (imagesModified) {
        const actualImages = images.filter(img => img && !img.isEmpty);

        // ✅ 순서대로 기존 이미지 ID 전송 (순서 유지 핵심!)
        actualImages.forEach((image) => {
          if (image.existingUrl && !image.file && image.id) {
            submitFormData.append('existing_image_ids', image.id.toString());
          }
        });

        // ✅ 순서대로 새 이미지 업로드 (압축 적용)
        const newImages = actualImages.filter(img => img.file);
        if (newImages.length > 0) {
          toast('이미지 처리 중...', { description: '이미지를 압축하고 있습니다.' });

          for (let i = 0; i < actualImages.length; i++) {
            const image = actualImages[i];

            if (image.file) {
              try {
                // 이미지 압축 (85% 품질, 최대 1200x1200, webp 변환)
                const compressImageInBrowser = (await import('@/lib/api/used/browser-image-utils')).compressImageInBrowser;
                const compressedBlob = await compressImageInBrowser(image.file, {
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

                submitFormData.append('new_images', compressedFile);
              } catch (error) {
                console.error(`[EDIT] Failed to compress image ${i + 1}:`, error);
                // 압축 실패 시 원본 사용
                submitFormData.append('new_images', image.file);
              }
            }
          }
        }
      }

      // 기본 정보 (참여자 있을 때는 제목/설명/이용안내만)
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      if (formData.usage_guide) submitFormData.append('usage_guide', formData.usage_guide);

      // 할인 정보 (항상 수정 가능)
      if (formData.type === 'online') {
        if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
          submitFormData.append('discount_url', formData.discount_url);
        }
        if (formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') {
          // 할인코드 개수 검증
          const validCodes = discountCodes.filter(code => code.trim());
          const targetCount = parseInt(formData.target_participants);
          if (validCodes.length < targetCount) {
            toast.error(`할인코드가 목표 인원(${targetCount}명)보다 부족합니다. ${targetCount - validCodes.length}개 더 추가해주세요.`);
            setSubmitting(false);
            return;
          }
          submitFormData.append('discount_codes', JSON.stringify(validCodes));
        }
        // 기간행사 쿠폰증정이 아닐 때만 할인 유효기간 전송
        if (!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only') && formData.discount_valid_days) {
          submitFormData.append('discount_valid_days', formData.discount_valid_days);
        }
      } else if (formData.type === 'offline') {
        // 할인코드 개수 검증
        const validCodes = discountCodes.filter(code => code.trim());
        const targetCount = parseInt(formData.target_participants);
        if (validCodes.length < targetCount) {
          toast.error(`할인코드가 목표 인원(${targetCount}명)보다 부족합니다. ${targetCount - validCodes.length}개 더 추가해주세요.`);
          setSubmitting(false);
          return;
        }
        submitFormData.append('discount_codes', JSON.stringify(validCodes));
        // 기간행사 쿠폰증정이 아닐 때만 할인 유효기간 전송
        if (!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only')) {
          submitFormData.append('discount_valid_days', formData.offline_discount_valid_days);
        }
      }

      // 부분 판매 옵션 (항상 수정 가능)
      submitFormData.append('allow_partial_sale', formData.allow_partial_sale.toString());

      // 등록 기간 수정 (기간행사 + 일반 공구의 manual 타입)
      if (formData.deadline_type === 'manual' && formData.deadline_date && formData.deadline_time) {
        const deadlineDateTime = new Date(`${formData.deadline_date}T${formData.deadline_time}`);
        submitFormData.append('expired_at', deadlineDateTime.toISOString());
      }

      // 참여자가 없을 때만 다른 필드 수정 가능 (단, type/target_participants는 제외)
      if (!hasParticipants) {
        // ❌ 수정 불가능 필드는 전송하지 않음: type, target_participants, discount_codes
        submitFormData.append('categories', JSON.stringify([selectedCategory]));
        submitFormData.append('pricing_type', formData.pricing_type);

        // 가격 정보 - coupon_only는 가격 정보 불필요
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

        // 온라인/오프라인 특화 정보
        if (formData.type === 'online') {
          submitFormData.append('online_discount_type', formData.online_discount_type);
          if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
            submitFormData.append('discount_url', formData.discount_url);
          }
          // ❌ discount_codes는 수정 불가이므로 전송하지 않음
          // 기간행사 쿠폰증정이 아닐 때만 할인 유효기간 전송
          if (!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only') && formData.discount_valid_days) {
            submitFormData.append('discount_valid_days', formData.discount_valid_days);
          }
          if (formData.phone_number) {
            submitFormData.append('phone_number', formData.phone_number);
          }
        } else {
          submitFormData.append('location', formData.location);
          if (formData.location_detail) submitFormData.append('location_detail', formData.location_detail);
          submitFormData.append('phone_number', formData.phone_number);
          // 기간행사 쿠폰증정이 아닐 때만 할인 유효기간 전송
          if (!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only')) {
            submitFormData.append('discount_valid_days', formData.offline_discount_valid_days);
          }
          // ❌ discount_codes는 수정 불가이므로 전송하지 않음
        }
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${dealId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: submitFormData
      });

      if (!response.ok) {

        // 응답 텍스트 먼저 가져오기
        const responseText = await response.text();
        console.log('원본 응답 (처음 500자):', responseText.substring(0, 500));

        // JSON 파싱 시도
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseText);
          console.log('파싱된 에러 데이터:', errorData);
        } catch (e) {
          console.error('⚠️ 응답이 JSON이 아닙니다. HTML 또는 텍스트 응답:', e);
          errorData = { error: '서버 에러 (500)' };
        }

        throw new Error(errorData.error || errorData.detail || '수정에 실패했습니다');
      }

      const data = await response.json();
      console.log('[EDIT] 수정 성공:', data);
      toast.success('커스텀 공구가 수정되었습니다!');
      router.push(`/custom-deals/${dealId}`);

    } catch (error: any) {
      console.error('[EDIT] 수정 실패:', error);
      toast.error(error.message || '수정에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-slate-900">커스텀 공구 수정</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">
        {/* 참여자 있을 때 안내 */}
        {hasParticipants && (
          <Card className="mb-6 border-gray-300 bg-white">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">수정 제한 안내</h3>
                  <p className="text-sm text-gray-700">
                    참여자가 있는 공구는 제목, 상품설명, 이용안내, 할인 정보, 부분 판매 옵션, 등록 기간만 수정 가능합니다
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 이미지 업로드 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              상품 이미지
            </CardTitle>
            <p className="text-sm text-slate-500">첫 번째 이미지가 대표 이미지로 설정됩니다 (최대 5장)</p>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
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
                          {index === 0 && (
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
                              {index !== 0 && (
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
                        <>
                          <input
                            type="file"
                            id={`image-add-${index}`}
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, index)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`image-add-${index}`}
                            className="w-full h-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Plus className="w-6 h-6 text-slate-400" />
                          </label>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기본 정보 (항상 수정 가능) */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>제목 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="공구 제목을 입력하세요"
                maxLength={50}
              />
              <p className="text-sm text-slate-500 mt-1 text-right">{formData.title.length}/50</p>
            </div>

            <div className="-mx-5">
              <div className="px-5">
                <Label>상품 설명 *</Label>
              </div>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => handleInputChange('description', content)}
                placeholder="공구 상품에 대한 자세한 설명을 입력하세요"
                maxLength={5000}
              />
            </div>

            <div>
              <Label>이용 안내 (선택)</Label>
              <Textarea
                value={formData.usage_guide}
                onChange={(e) => handleInputChange('usage_guide', e.target.value)}
                placeholder="예시:&#10;- 평일 오후 3시~9시만 사용 가능&#10;- 주말/공휴일 제외"
                rows={4}
                maxLength={1000}
              />
              <p className="text-sm text-slate-500 mt-1 text-right">{formData.usage_guide.length}/1,000</p>
            </div>

            {/* 공구 유형 표시 (수정 불가) */}
            <div>
              <Label>공구 유형</Label>
              <RadioGroup
                value={formData.type}
                disabled
                className="flex gap-4 mt-2 opacity-60"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="online" id="edit-online" disabled />
                  <Label htmlFor="edit-online" className="font-normal cursor-not-allowed">온라인판매</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offline" id="edit-offline" disabled />
                  <Label htmlFor="edit-offline" className="font-normal cursor-not-allowed">오프라인판매</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-slate-500 mt-1">공구 유형은 수정할 수 없습니다</p>
            </div>
          </CardContent>
        </Card>

        {/* 부분 판매 허용 옵션 (기간행사는 숨김) */}
        {originalData?.deal_type !== 'time_based' && (
          <Card className="mb-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                판매 옵션
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
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

        {/* 참여자가 없을 때만 나머지 필드 표시 */}
        {!hasParticipants && (
          <>
            {/* 카테고리 */}
            <Card className="mb-6 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  카테고리 * {errors.categories && <span className="text-red-600 text-sm ml-2">{errors.categories}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                      {cat.label === '건강/의료' ? '건강/헬스케어' : cat.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 가격 정보 - 쿠폰전용만 숨김 */}
            {originalData?.pricing_type !== 'coupon_only' && (
              <Card className="mb-6 border-slate-200">
                <CardHeader>
                  <CardTitle>가격 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div>
                  <Label>가격 유형 *</Label>
                  <RadioGroup
                    value={formData.pricing_type}
                    onValueChange={(value) => handleInputChange('pricing_type', value)}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single_product" id="edit-single" />
                      <Label htmlFor="edit-single" className="cursor-pointer">단일상품</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all_products" id="edit-all" />
                      <Label htmlFor="edit-all" className="cursor-pointer">전품목 할인</Label>
                    </div>
                    {/* 기간행사에서는 쿠폰전용 숨김 */}
                    {originalData?.deal_type !== 'time_based' && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="coupon_only" id="edit-coupon" />
                        <Label htmlFor="edit-coupon" className="cursor-pointer">쿠폰전용</Label>
                      </div>
                    )}
                  </RadioGroup>
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.pricing_type === 'single_product'
                      ? '특정 상품 1개에 대한 할인입니다'
                      : formData.pricing_type === 'all_products'
                      ? '업체의 모든 상품에 적용되는 할인입니다'
                      : '가격 정보 없이 할인코드/링크만 제공합니다'}
                  </p>
                </div>

                {formData.pricing_type === 'single_product' && (
                  <>
                    <div>
                      <Label>상품명 *</Label>
                      <Input
                        value={formData.product_name}
                        onChange={(e) => handleInputChange('product_name', e.target.value)}
                        placeholder="예: 둥지마켓 사과 1박스"
                        maxLength={100}
                      />
                      <p className="text-sm text-slate-500 mt-1 text-right">{formData.product_name.length}/100</p>
                    </div>
                    <div>
                      <Label>정가 *</Label>
                      <Input
                        value={formData.original_price}
                        onChange={(e) => handleOriginalPriceChange(e.target.value)}
                        placeholder="0"
                        className={errors.original_price ? 'border-red-300' : ''}
                      />
                      {errors.original_price && <p className="text-sm text-red-600 mt-1">{errors.original_price}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>할인율 (%) *</Label>
                        <Input
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
                    />
                  </div>
                )}

                {/* 쿠폰전용 안내 */}
                {formData.pricing_type === 'coupon_only' && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    💡 쿠폰전용은 구매과정없이 이벤트나 할인혜택을 코드, 링크 또는 텍스트 형태로 자유롭게 배포할 수 있습니다
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* 모집 설정 (기간행사 제외) */}
            {originalData?.deal_type !== 'time_based' && (
              <Card className="mb-6 border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    모집 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 목표 인원 - 참여자 없을 때만 수정 가능 */}
                  {!hasParticipants && (
                    <div>
                      <Label>목표 인원 *</Label>
                      <Select
                        value={formData.target_participants}
                        onValueChange={(value) => handleInputChange('target_participants', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: user?.username === 'seller10' ? 49 : 19 }, (_, i) => i + 2).map(num => (
                            <SelectItem key={num} value={num.toString()}>{num}명</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 참여자 있을 때 목표 인원 표시만 */}
                  {hasParticipants && (
                    <div>
                      <Label>목표 인원</Label>
                      <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                        <p className="text-sm text-slate-700 font-medium">{formData.target_participants}명</p>
                        <p className="text-xs text-slate-500 mt-1">참여자가 있어 변경할 수 없습니다</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 기간행사 - 할인 링크 */}
            {originalData?.deal_type === 'time_based' && (
              <Card className="mb-6 border-orange-200 bg-orange-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <LinkIcon className="w-5 h-5" />
                    {formData.type === 'online' ? '할인 링크 *' : '이벤트/행사 안내 링크'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>
                      {formData.type === 'online'
                        ? '할인이 적용된 구매 링크 *'
                        : '이벤트/행사 안내 링크 (선택사항)'}
                    </Label>
                    <Input
                      value={formData.discount_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_url: e.target.value }))}
                      placeholder="https://..."
                      maxLength={500}
                      className="bg-white"
                    />
                    <p className="text-sm text-slate-500 mt-1 text-right">{formData.discount_url.length}/500</p>
                  </div>

                  {/* 링크 미리보기 */}
                  {formData.discount_url && formData.discount_url.startsWith('http') && (
                    <LinkPreview url={formData.discount_url} />
                  )}

                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-800 leading-relaxed">
                      💡 {formData.type === 'online'
                        ? '행사 진행중인 판매링크를 입력해주세요'
                        : '매장 행사 정보를 확인할 수 있는 링크를 입력해주세요 (선택사항)'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 기간행사 - 등록 기간 설정 */}
            {originalData?.deal_type === 'time_based' && (
              <Card className="mb-6 border-orange-200 bg-orange-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Calendar className="w-5 h-5" />
                    등록 기간 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 p-4 bg-white rounded-lg border border-orange-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">마감 날짜 *</Label>
                        <Input
                          type="date"
                          value={formData.deadline_date}
                          onChange={(e) => {
                            const selectedDate = new Date(e.target.value);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (selectedDate < today) {
                              toast.error('오늘 이후 날짜를 선택해주세요');
                              return;
                            }
                            setFormData(prev => ({ ...prev, deadline_date: e.target.value }));
                            setHasChanges(true);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">마감 시간 *</Label>
                        <Input
                          type="time"
                          value={formData.deadline_time}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, deadline_time: e.target.value }));
                            setHasChanges(true);
                          }}
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-orange-600">
                      💡 설정한 날짜/시간까지 기간행사가 진행됩니다
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 온라인 전용 필드 - 할인 제공 방식 통합 (기간행사 제외) */}
            {formData.type === 'online' && originalData?.deal_type !== 'time_based' && (
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
                      <RadioGroupItem value="link_only" id="edit-link_only" />
                      <Label htmlFor="edit-link_only" className="font-normal cursor-pointer">
                        링크만 <span className="text-xs text-slate-500">•모든 참여자에게 발송되는 비공개 링크 또는 참여방법</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="code_only" id="edit-code_only" />
                      <Label htmlFor="edit-code_only" className="font-normal cursor-pointer">코드만</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="edit-both" />
                      <Label htmlFor="edit-both" className="font-normal cursor-pointer">링크 + 코드</Label>
                    </div>
                  </RadioGroup>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      💡 공구마감 후 고객에게 발송되는 정보입니다<br />
                      • 스마트스토어 할인링크 등 개별 쿠폰링크도 입력 가능합니다<br />
                      • 할인 링크는 공구 마감후 공개될수 있도록 비공개 처리 부탁드립니다.<br />
                      • 할인코드 용도: 온라인 구매시 코드 또는 링크 사용
                    </p>
                  </div>

                  {(formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') && (
                    <div className="space-y-3">
                      <div>
                        <Label className="flex items-baseline gap-2">
                          판매링크/참여방법안내 *
                          <span className="text-xs text-slate-500 font-normal">(판매링크 또는 참여방법(텍스트))</span>
                        </Label>
                        <Input
                          value={formData.discount_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, discount_url: e.target.value }))}
                          placeholder="공구전용 비공개 링크 또는 참여방식을 입력해주세요"
                          maxLength={500}
                        />
                        <p className="text-sm text-slate-500 mt-1 text-right">{formData.discount_url.length}/500</p>
                        <p className="text-xs text-slate-500">참여방법 예) 가게에서 둥지에서 왔어요 라고 말씀해주세요</p>
                      </div>

                      {/* 링크 미리보기 */}
                      {formData.discount_url && formData.discount_url.startsWith('http') && (
                        <LinkPreview url={formData.discount_url} />
                      )}
                    </div>
                  )}

                  {/* 할인코드 입력 (기간행사 쿠폰증정은 숨김) */}
                  {!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only') && (formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          할인 코드 또는 링크 *
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">
                            {discountCodes.filter(c => c.trim()).length}/{formData.target_participants}개
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={autoGenerateDiscountCodes}
                            className="text-xs"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            인원 기준 자동생성 ({formData.target_participants}개)
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {discountCodes.map((code, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                value={code}
                                onChange={(e) => updateDiscountCode(index, e.target.value)}
                                placeholder={`코드 또는 링크 ${index + 1}`}
                                maxLength={500}
                              />
                              <p className="text-xs text-slate-400 mt-1 text-right">{code.length}/500</p>
                            </div>
                            {discountCodes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newCodes = discountCodes.filter((_, i) => i !== index);
                                  setDiscountCodes(newCodes);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDiscountCodes([...discountCodes, ''])}
                          disabled={discountCodes.length >= parseInt(formData.target_participants)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          할인코드 추가
                        </Button>
                      </div>

                      {/* 중복 코드 에러 메시지 */}
                      {duplicateCodeError && (
                        <p className="text-sm text-red-600 mt-2 animate-pulse">
                          {duplicateCodeError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 할인 유효기간 (기간행사 쿠폰증정은 숨김) */}
                  {!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only') && (
                    <div>
                      <Label>{formData.online_discount_type === 'link_only' ? '할인 판매기간' : '할인 유효기간'} *</Label>
                      <Select
                        value={['1', '3', '7', '14', '30', '60', 'custom'].includes(formData.discount_valid_days) ? formData.discount_valid_days : 'custom'}
                        onValueChange={(value) => {
                          if (value === 'custom') {
                            setFormData(prev => ({ ...prev, discount_valid_days: '' }));
                          } else {
                            setFormData(prev => ({ ...prev, discount_valid_days: value }));
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
                              setFormData(prev => ({ ...prev, discount_valid_days: e.target.value }));
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
                      문의가 필요한 경우 입력해주세요 ({formData.phone_number.length}/20)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 오프라인 전용 필드 - 두 개의 카드로 분리 */}
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
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          placeholder="주소 검색 버튼을 클릭하세요"
                          maxLength={150}
                        />
                        <AddressSearch
                          onComplete={(address) => handleInputChange('location', address)}
                          buttonText="주소 검색"
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-1 text-right">{formData.location.length}/150</p>
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
                      <p className="text-sm text-slate-500 mt-1 text-right">{formData.location_detail.length}/500</p>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        연락처 *
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
                      <p className="text-sm text-slate-500 mt-1 text-right">{formData.phone_number.length}/20</p>
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
                    {/* 할인코드 입력 (기간행사 쿠폰증정은 숨김) */}
                    {!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only') && (
                      <>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            💡 오프라인 매장 할인코드 활용 방법<br />
                            • 참여자가 할인코드를 매장에서 제시 (휴대폰 화면)<br />
                            • 마감 후 관리페이지 QR코드 스캔 기능 사용 또는 할인코드 수동 확인<br />
                            • 할인코드는 공구 마감 후 참여자에게 자동 발송됩니다
                          </p>
                        </div>

                        <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          할인 코드 또는 링크 *
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600">
                            {discountCodes.filter(c => c.trim()).length}/{formData.target_participants}개
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={autoGenerateDiscountCodes}
                            className="text-xs"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            인원 기준 자동생성 ({formData.target_participants}개)
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {discountCodes.map((code, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                value={code}
                                onChange={(e) => updateDiscountCode(index, e.target.value)}
                                placeholder={`코드 또는 링크 ${index + 1}`}
                                maxLength={500}
                              />
                              <p className="text-xs text-slate-400 mt-1 text-right">{code.length}/500</p>
                            </div>
                            {discountCodes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newCodes = discountCodes.filter((_, i) => i !== index);
                                  setDiscountCodes(newCodes);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDiscountCodes([...discountCodes, ''])}
                          disabled={discountCodes.length >= parseInt(formData.target_participants)}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          할인코드 추가
                        </Button>
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
                      </>
                    )}

                    {/* 할인 유효기간 (기간행사 쿠폰증정은 숨김) */}
                    {!(originalData?.deal_type === 'time_based' && originalData?.pricing_type === 'coupon_only') && (
                      <div>
                        <Label>할인 유효기간 *</Label>
                        <Select
                          value={['1', '3', '7', '14', '30', '60', 'custom'].includes(formData.offline_discount_valid_days) ? formData.offline_discount_valid_days : 'custom'}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setFormData(prev => ({ ...prev, offline_discount_valid_days: '' }));
                            } else {
                              setFormData(prev => ({ ...prev, offline_discount_valid_days: value }));
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
                                setFormData(prev => ({ ...prev, offline_discount_valid_days: e.target.value }));
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
              </>
            )}
          </>
        )}

        {/* 등록 기간 설정 (참여자 있어도 수정 가능) */}
        {originalData?.deal_type === 'participant_based' && (
          <Card className="mb-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                등록 기간 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">마감 날짜 *</Label>
                    <Input
                      type="date"
                      value={formData.deadline_date}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const maxDate = new Date(today);
                        maxDate.setDate(maxDate.getDate() + 14);

                        if (selectedDate < today) {
                          toast.error('오늘 이후 날짜를 선택해주세요');
                          return;
                        }
                        if (selectedDate > maxDate) {
                          toast.error('최대 2주(14일) 이내로 설정 가능합니다');
                          return;
                        }
                        setFormData(prev => ({ ...prev, deadline_date: e.target.value }));
                        setHasChanges(true);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">마감 시간 *</Label>
                    <Input
                      type="time"
                      value={formData.deadline_time}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, deadline_time: e.target.value }));
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  💡 최대 2주(14일) 이내로 설정 가능하며, 기간 내 목표 인원 달성 시 조기 마감됩니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 할인 정보 (참여자가 있을 때만 표시 - 할인 정보만 수정 가능) */}
        {hasParticipants && (
          <Card className="mb-6 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                할인 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {formData.type === 'online' && (
              <>
                {(formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') && (
                  <div className="space-y-3">
                    <div>
                      <Label className="flex items-baseline gap-2">
                        판매링크/참여방법안내 *
                        <span className="text-xs text-slate-500 font-normal">(판매링크 또는 참여방법(텍스트))</span>
                      </Label>
                      <Input
                        value={formData.discount_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_url: e.target.value }))}
                        placeholder="공구전용 비공개 링크 또는 참여방식을 입력해주세요"
                        maxLength={500}
                      />
                      <p className="text-sm text-slate-500 mt-1 text-right">{formData.discount_url.length}/500</p>
                      <p className="text-xs text-slate-500">참여방법 예) 가게에서 둥지에서 왔어요 라고 말씀해주세요</p>
                    </div>

                    {/* 링크 미리보기 */}
                    {formData.discount_url && formData.discount_url.startsWith('http') && (
                      <LinkPreview url={formData.discount_url} />
                    )}
                  </div>
                )}

                {(formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        할인 코드 *
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600">
                          {discountCodes.filter(c => c.trim()).length}/{formData.target_participants}개
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={autoGenerateDiscountCodes}
                          className="text-xs"
                        >
                          <Users className="w-3 h-3 mr-1" />
                          인원 기준 자동생성 ({formData.target_participants}개)
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {discountCodes.map((code, index) => (
                        <div key={index} className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              value={code}
                              onChange={(e) => updateDiscountCode(index, e.target.value)}
                              placeholder={`코드 ${index + 1}`}
                              maxLength={500}
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">{code.length}/500</p>
                          </div>
                          {discountCodes.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newCodes = discountCodes.filter((_, i) => i !== index);
                                setDiscountCodes(newCodes);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountCodes([...discountCodes, ''])}
                        disabled={discountCodes.length >= parseInt(formData.target_participants)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        할인코드 추가
                      </Button>
                    </div>

                    {/* 중복 코드 에러 메시지 */}
                    {duplicateCodeError && (
                      <p className="text-sm text-red-600 mt-2 animate-pulse">
                        {duplicateCodeError}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label>{formData.online_discount_type === 'link_only' ? '할인 판매기간' : '할인 유효기간'} *</Label>
                  <Select
                    value={['1', '3', '7', '14', '30', '60', 'custom'].includes(formData.discount_valid_days) ? formData.discount_valid_days : 'custom'}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setFormData(prev => ({ ...prev, discount_valid_days: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, discount_valid_days: value }));
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
                          setFormData(prev => ({ ...prev, discount_valid_days: e.target.value }));
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
              </>
            )}

            {formData.type === 'offline' && (
              <>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    💡 오프라인 매장 할인코드 활용 방법<br />
                    • 참여자가 할인코드를 매장에서 제시 (휴대폰 화면)<br />
                    • 마감 후 관리페이지 QR코드 스캔 기능 사용 또는 할인코드 수동 확인<br />
                    • 할인코드는 공구 마감 후 참여자에게 자동 발송됩니다
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      할인 코드 *
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600">
                        {discountCodes.filter(c => c.trim()).length}/{formData.target_participants}개
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={autoGenerateDiscountCodes}
                        className="text-xs"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        인원 기준 자동생성 ({formData.target_participants}개)
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {discountCodes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={code}
                            onChange={(e) => updateDiscountCode(index, e.target.value)}
                            placeholder={`코드 ${index + 1}`}
                            maxLength={500}
                          />
                          <p className="text-xs text-slate-400 mt-1 text-right">{code.length}/500</p>
                        </div>
                        {discountCodes.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newCodes = discountCodes.filter((_, i) => i !== index);
                              setDiscountCodes(newCodes);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscountCodes([...discountCodes, ''])}
                      disabled={discountCodes.length >= parseInt(formData.target_participants)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      할인코드 추가
                    </Button>
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

                <div>
                  <Label>할인 유효기간 *</Label>
                  <Select
                    value={['1', '3', '7', '14', '30', '60', 'custom'].includes(formData.offline_discount_valid_days) ? formData.offline_discount_valid_days : 'custom'}
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setFormData(prev => ({ ...prev, offline_discount_valid_days: '' }));
                      } else {
                        setFormData(prev => ({ ...prev, offline_discount_valid_days: value }));
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
                          setFormData(prev => ({ ...prev, offline_discount_valid_days: e.target.value }));
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
              </>
            )}
          </CardContent>
        </Card>
        )}

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => router.back()}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            size="lg"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-slate-400 disabled:cursor-not-allowed"
            disabled={submitting || !hasChanges}
            title={!hasChanges ? '변경사항이 없습니다' : ''}
          >
            {submitting ? '수정 중...' : '수정하기'}
          </Button>
        </div>
      </form>
    </div>
  );
}