'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, AlertCircle, Info, ArrowLeft, Clock, Users, Tag, MapPin, Phone, Link as LinkIcon, Ticket, Lock, Check } from 'lucide-react';
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

  // 에러 상태
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    online_discount_type: 'link_only' as 'link_only' | 'code_only' | 'both',
    discount_url: '',
    discount_valid_days: '',
    location: '',
    location_detail: '',
    phone_number: '',
    offline_discount_valid_days: '7',
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
      console.log('[EDIT] 데이터 로드:', { seller: data.seller, userId: user?.id });

      // 권한 체크 (seller는 ID 자체)
      if (data.seller !== parseInt(user?.id || '0')) {
        console.log('[EDIT] 권한 없음:', data.seller, '!==', parseInt(user?.id || '0'));
        toast.error('수정 권한이 없습니다');
        router.push(`/custom-deals/${dealId}`);
        return;
      }

      console.log('[EDIT] 권한 확인 완료');

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
        target_participants: data.target_participants?.toString() || '2',
        deadline_type: 'auto',
        deadline_days: '3',
        deadline_date: '',
        deadline_time: '',
        allow_partial_sale: data.allow_partial_sale || false,
        online_discount_type: data.online_discount_type || 'link_only',
        discount_url: data.discount_url || '',
        discount_valid_days: data.discount_valid_days?.toString() || '',
        location: data.location || '',
        location_detail: data.location_detail || '',
        phone_number: data.phone_number || '',
        offline_discount_valid_days: data.discount_valid_days?.toString() || '7',
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
      formData.discount_valid_days !== (originalData.discount_valid_days?.toString() || '') ||
      formData.offline_discount_valid_days !== (originalData.discount_valid_days?.toString() || '7') ||
      JSON.stringify(discountCodes) !== JSON.stringify(originalData.discount_codes || ['']);

    if (discountInfoChanged) {
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
    if (files.length === 0) return;

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

      if (targetIndex !== undefined && files.length === 1) {
        const file = files[0];
        const existingImage = updated[targetIndex];

        // 기존 blob URL 해제 (existingUrl은 S3 URL이므로 해제 안 함)
        if (existingImage && existingImage.url && !existingImage.existingUrl) {
          URL.revokeObjectURL(existingImage.url);
        }

        // 새 이미지로 교체 (existingUrl과 id 제거)
        updated[targetIndex] = {
          file,
          url: URL.createObjectURL(file),
          isEmpty: false
          // existingUrl과 id는 의도적으로 포함하지 않음 (새 파일로 교체)
        };
        setImagesModified(true); // 이미지 수정됨 표시
        return updated;
      }

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
            isEmpty: false
          };
          insertIndex++;
        }
      });

      setImagesModified(true); // 이미지 수정됨 표시
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

  // 폼 입력 핸들러
  const handleInputChange = (field: string, value: any) => {
    // 참여자가 있을 때는 제목, 설명, 이용안내만 수정 가능
    if (hasParticipants && !['title', 'description', 'usage_guide'].includes(field)) {
      toast.error('참여자가 있는 공구는 제목, 상세설명, 이용안내만 수정 가능합니다');
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
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

  // 수정 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[EDIT] handleSubmit 시작');

    if (submitting) return;

    try {
      setSubmitting(true);
      console.log('[EDIT] 제출 시작');

      // FormData로 전송
      const submitFormData = new FormData();

      // 이미지 처리 - 이미지가 변경된 경우에만 전송
      if (imagesModified) {
        const actualImages = images.filter(img => img && !img.isEmpty);

        // 첫 번째 이미지가 대표 이미지 (정렬 불필요, 이미 순서대로 배열됨)
        const existingImages = actualImages.filter(img => img.existingUrl && !img.file && img.id);
        const newImages = actualImages.filter(img => img.file);

        // 기존 이미지 ID들 전송 (유지할 이미지) - 정렬된 순서대로
        existingImages.forEach((image) => {
          if (image.id) {
            submitFormData.append('existing_image_ids', image.id.toString());
          }
        });

        // 새로 추가된 이미지만 업로드 (압축 적용)
        if (newImages.length > 0) {
          // 이미지 압축 로직은 생략 (백엔드에서 처리)
          for (const image of newImages) {
            if (image.file) {
              submitFormData.append('new_images', image.file);
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
          submitFormData.append('discount_codes', JSON.stringify(discountCodes.filter(code => code.trim())));
        }
        if (formData.discount_valid_days) {
          submitFormData.append('discount_valid_days', formData.discount_valid_days);
        }
      } else if (formData.type === 'offline') {
        submitFormData.append('discount_codes', JSON.stringify(discountCodes.filter(code => code.trim())));
        submitFormData.append('discount_valid_days', formData.offline_discount_valid_days);
      }

      // 참여자가 없을 때만 다른 필드 수정 가능 (단, type/target_participants는 제외)
      if (!hasParticipants) {
        // ❌ 수정 불가능 필드는 전송하지 않음: type, target_participants, discount_codes
        submitFormData.append('categories', JSON.stringify([selectedCategory]));
        submitFormData.append('pricing_type', formData.pricing_type);
        submitFormData.append('allow_partial_sale', formData.allow_partial_sale.toString());

        // 가격 정보
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
          // ❌ discount_codes는 수정 불가이므로 전송하지 않음
          if (formData.discount_valid_days) {
            submitFormData.append('discount_valid_days', formData.discount_valid_days);
          }
          if (formData.phone_number) {
            submitFormData.append('phone_number', formData.phone_number);
          }
        } else {
          submitFormData.append('location', formData.location);
          if (formData.location_detail) submitFormData.append('location_detail', formData.location_detail);
          submitFormData.append('phone_number', formData.phone_number);
          submitFormData.append('discount_valid_days', formData.offline_discount_valid_days);
          // ❌ discount_codes는 수정 불가이므로 전송하지 않음
        }
      }

      // 디버깅: FormData 전송 내용 상세 출력
      console.log('====================================');
      console.log('📦 FormData 전송 내용 상세 디버깅');
      console.log('====================================');
      console.log('🔸 참여자 여부:', hasParticipants);
      console.log('🔸 이미지 변경 여부:', imagesModified);
      console.log('🔸 현재 images 상태:', images);
      console.log('');
      console.log('📋 전송될 필드 목록:');
      const formDataEntries: Array<[string, any]> = [];
      for (let [key, value] of submitFormData.entries()) {
        formDataEntries.push([key, value]);
        if (value instanceof File) {
          console.log(`  ✅ ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)}KB)`);
        } else {
          console.log(`  ✅ ${key}: ${value}`);
        }
      }
      console.log('');
      console.log('📊 전송 필드 개수:', formDataEntries.length);
      console.log('====================================');

      console.log('[EDIT] API 호출 직전');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/${dealId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: submitFormData
      });

      console.log('');
      console.log('🔻 API 응답 정보 🔻');
      console.log('상태 코드:', response.status);
      console.log('상태 텍스트:', response.statusText);
      console.log('Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        console.error('❌ API 오류 발생');

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
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-900 mb-1">수정 제한 안내</h3>
                  <p className="text-sm text-amber-800">
                    참여자가 있는 공구는 제목, 상세설명, 이용안내, 할인 정보만 수정 가능합니다
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

            <div>
              <Label>상세 설명 *</Label>
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
          </CardContent>
        </Card>

        {/* 할인 정보 (항상 수정 가능) */}
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
                      <Label>할인 링크 *</Label>
                      <Input
                        value={formData.discount_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount_url: e.target.value }))}
                        placeholder="https://example.com/discount"
                      />
                    </div>

                    {/* 링크 미리보기 */}
                    {formData.discount_url && formData.discount_url.startsWith('http') && (
                      <LinkPreview url={formData.discount_url} />
                    )}
                  </div>
                )}

                {(formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') && (
                  <div>
                    <Label className="flex items-center gap-2">
                      <Ticket className="w-4 h-4" />
                      할인 코드 *
                    </Label>
                    <div className="space-y-2 mt-2">
                      {discountCodes.map((code, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={code}
                            onChange={(e) => {
                              const newCodes = [...discountCodes];
                              newCodes[index] = e.target.value;
                              setDiscountCodes(newCodes);
                            }}
                            placeholder={`코드 ${index + 1}`}
                          />
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
                      {discountCodes.length < parseInt(formData.target_participants) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDiscountCodes([...discountCodes, ''])}
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          할인코드 추가
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <Label>할인 유효기간 (선택)</Label>
                  <Select
                    value={formData.discount_valid_days || 'none'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discount_valid_days: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택 안함" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안함</SelectItem>
                      <SelectItem value="3">3일</SelectItem>
                      <SelectItem value="7">7일</SelectItem>
                      <SelectItem value="14">14일</SelectItem>
                      <SelectItem value="30">30일</SelectItem>
                      <SelectItem value="60">60일</SelectItem>
                      <SelectItem value="90">90일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {formData.type === 'offline' && (
              <>
                <div>
                  <Label className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    할인 코드 *
                  </Label>
                  <div className="space-y-2 mt-2">
                    {discountCodes.map((code, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={code}
                          onChange={(e) => {
                            const newCodes = [...discountCodes];
                            newCodes[index] = e.target.value;
                            setDiscountCodes(newCodes);
                          }}
                          placeholder={`코드 ${index + 1}`}
                        />
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
                    {discountCodes.length < parseInt(formData.target_participants) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDiscountCodes([...discountCodes, ''])}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        할인코드 추가
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>할인 유효기간 *</Label>
                  <Select
                    value={formData.offline_discount_valid_days}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, offline_discount_valid_days: value }))}
                  >
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
              </>
            )}
          </CardContent>
        </Card>

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
                      {cat.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 공구 유형 (수정 불가) */}
            <Card className="mb-6 border-slate-200 bg-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  공구 유형
                  <Badge variant="secondary" className="text-xs">수정불가</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.type}
                  disabled
                  className="flex gap-4 opacity-60"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="edit-online" disabled />
                    <Label htmlFor="edit-online" className="font-normal">온라인</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="offline" id="edit-offline" disabled />
                    <Label htmlFor="edit-offline" className="font-normal">오프라인</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* 가격 정보 */}
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
                  </RadioGroup>
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.pricing_type === 'single_product'
                      ? '특정 상품 1개에 대한 할인입니다'
                      : '업체의 모든 상품에 적용되는 할인입니다'}
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
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>정가 *</Label>
                        <Input
                          value={formData.original_price}
                          onChange={(e) => handleInputChange('original_price', formatPrice(e.target.value))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label>할인율 (%) *</Label>
                        <Input
                          type="number"
                          value={formData.discount_rate}
                          onChange={(e) => handleInputChange('discount_rate', e.target.value)}
                          placeholder="0"
                          min="0"
                          max="99"
                        />
                      </div>
                    </div>
                    {/* 최종 가격 표시 */}
                    {formData.original_price && formData.discount_rate && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">최종 판매가</span>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {Math.floor(
                                parseInt(formData.original_price.replace(/,/g, '')) *
                                (100 - parseInt(formData.discount_rate || '0')) / 100
                              ).toLocaleString()}원
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              ({formData.discount_rate}% 할인 적용)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {formData.pricing_type === 'all_products' && (
                  <div>
                    <Label>할인율 (%) *</Label>
                    <Input
                      type="number"
                      value={formData.discount_rate}
                      onChange={(e) => handleInputChange('discount_rate', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="99"
                    />
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
                  <Label className="flex items-center gap-2">
                    목표 인원 *
                    <Badge variant="secondary" className="text-xs">수정불가</Badge>
                  </Label>
                  <Select value={formData.target_participants} disabled>
                    <SelectTrigger className="opacity-60 bg-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 9 }, (_, i) => i + 2).map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}명</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Phone className="w-5 h-5" />
                    온라인 공구 추가 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                        maxLength={300}
                      />
                      <AddressSearch
                        onComplete={(address) => handleInputChange('location', address)}
                        buttonText="주소 검색"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>위치 상세 (선택)</Label>
                    <Textarea
                      value={formData.location_detail}
                      onChange={(e) => handleInputChange('location_detail', e.target.value)}
                      placeholder="건물명, 층수 등 추가 정보"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      연락처 *
                    </Label>
                    <Input
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      placeholder="010-1234-5678"
                      maxLength={20}
                    />
                  </div>

                  {(selectedCategory === 'food' || selectedCategory === 'cafe') && (
                    <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 mt-2">
                      ⚠️ 요식업의 경우 포장 및 매장 이용 시에만 사용 가능함을 표기합니다.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
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