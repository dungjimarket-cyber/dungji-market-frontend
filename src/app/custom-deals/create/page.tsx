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
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    checkProfile,
    missingFields,
    showProfileModal,
    setShowProfileModal,
  } = useCustomProfileCheck();

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 지역 선택 (오프라인용)
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);

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
    original_price: '',
    discount_rate: '',
    target_participants: '2',
    max_wait_hours: '72',
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

  // 최종 가격 계산
  const calculateFinalPrice = () => {
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

  // 페이지 진입 시 인증 체크
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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
      if (actualImages.length + files.length > 10) {
        toast.error('최대 10장까지 업로드 가능합니다');
        return prev;
      }

      const lastFilledIndex = actualImages.length > 0 ?
        updated.findLastIndex(img => img && !img.isEmpty) : -1;
      let insertIndex = lastFilledIndex + 1;

      files.forEach((file) => {
        if (insertIndex < 10) {
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

  // 카테고리 토글
  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(value)) {
        return prev.filter(c => c !== value);
      } else if (prev.length >= 5) {
        toast.error('카테고리는 최대 5개까지 선택 가능합니다');
        return prev;
      } else {
        return [...prev, value];
      }
    });
    if (errors.categories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.categories;
        return newErrors;
      });
    }
  };

  // 할인코드 추가
  const addDiscountCode = () => {
    setDiscountCodes(prev => [...prev, '']);
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

  // 가격 포맷팅
  const formatPrice = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    return parseInt(numbers).toLocaleString('ko-KR');
  };

  // 유효성 검증
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 기본 필드
    if (!formData.title.trim()) newErrors.title = '제목을 입력해주세요';
    if (formData.title.length > 200) newErrors.title = '제목은 최대 200자까지 입력 가능합니다';
    if (!formData.description.trim()) newErrors.description = '설명을 입력해주세요';
    if (formData.description.length > 5000) newErrors.description = '설명은 최대 5,000자까지 입력 가능합니다';
    if (formData.usage_guide && formData.usage_guide.length > 1000) newErrors.usage_guide = '이용안내는 최대 1,000자까지 입력 가능합니다';

    // 카테고리
    if (selectedCategories.length === 0) newErrors.categories = '최소 1개 이상의 카테고리를 선택해주세요';

    // 이미지
    const actualImages = images.filter(img => img && !img.isEmpty);
    if (actualImages.length === 0) newErrors.images = '최소 1장 이상의 이미지를 등록해주세요';

    // 가격
    if (!formData.original_price) newErrors.original_price = '정가를 입력해주세요';
    if (!formData.discount_rate) newErrors.discount_rate = '할인율을 입력해주세요';
    const discountRate = parseInt(formData.discount_rate);
    if (discountRate < 0 || discountRate > 100) newErrors.discount_rate = '할인율은 0~100% 사이여야 합니다';

    // 온라인 공구
    if (formData.type === 'online') {
      if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
        if (!formData.discount_url.trim()) newErrors.discount_url = '할인 링크를 입력해주세요';
      }
      if (formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') {
        const validCodes = discountCodes.filter(c => c.trim());
        if (validCodes.length === 0) newErrors.discount_codes = '할인코드를 1개 이상 입력해주세요';
        const targetCount = parseInt(formData.target_participants);
        if (validCodes.length < targetCount) newErrors.discount_codes = `할인코드 개수가 목표 인원(${targetCount}명)보다 적습니다`;
      }
    }

    // 오프라인 공구
    if (formData.type === 'offline') {
      if (selectedRegions.length === 0) newErrors.regions = '지역을 1개 이상 선택해주세요';
      if (!formData.location.trim()) newErrors.location = '매장 위치를 입력해주세요';
      if (formData.location.length > 300) newErrors.location = '매장 위치는 최대 300자까지 입력 가능합니다';
      if (!formData.phone_number.trim()) newErrors.phone_number = '연락처를 입력해주세요';
      if (formData.phone_number.length > 20) newErrors.phone_number = '연락처는 최대 20자까지 입력 가능합니다';
      const validCodes = discountCodes.filter(c => c.trim());
      if (validCodes.length === 0) newErrors.discount_codes = '할인코드를 1개 이상 입력해주세요';
      const targetCount = parseInt(formData.target_participants);
      if (validCodes.length < targetCount) newErrors.discount_codes = `할인코드 개수가 목표 인원(${targetCount}명)보다 적습니다`;
    }

    setErrors(newErrors);
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

      // 1. 이미지 업로드 (압축 적용)
      const actualImages = images.filter(img => img && !img.isEmpty);
      const imageUrls: string[] = [];

      for (const img of actualImages) {
        if (!img.file) continue;

        try {
          // 이미지 압축 (85% 품질, 최대 1200x1200, WebP 변환)
          const compressedBlob = await compressImageInBrowser(img.file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.85,
            format: 'webp'
          });

          const compressedFile = new File(
            [compressedBlob],
            img.file.name.replace(/\.[^/.]+$/, '.webp'),
            { type: 'image/webp' }
          );

          const formData = new FormData();
          formData.append('file', compressedFile);

          const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom/images/upload/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: formData
          });

          if (!uploadResponse.ok) throw new Error('이미지 업로드 실패');

          const uploadData = await uploadResponse.json();
          imageUrls.push(uploadData.url);
        } catch (error) {
          console.error('이미지 처리 실패:', error);
          throw new Error('이미지 처리 중 오류가 발생했습니다');
        }
      }

      // 2. 커스텀 공구 생성
      const validCodes = discountCodes.filter(c => c.trim());

      const requestBody: any = {
        title: formData.title,
        description: formData.description,
        usage_guide: formData.usage_guide || undefined,
        type: formData.type,
        categories: selectedCategories,
        original_price: parseInt(formData.original_price.replace(/,/g, '')),
        discount_rate: parseInt(formData.discount_rate),
        target_participants: parseInt(formData.target_participants),
        max_wait_hours: parseInt(formData.max_wait_hours),
        allow_partial_sale: formData.allow_partial_sale,
        images: imageUrls,
      };

      if (formData.type === 'online') {
        requestBody.online_discount_type = formData.online_discount_type;
        if (formData.online_discount_type === 'link_only' || formData.online_discount_type === 'both') {
          requestBody.discount_url = formData.discount_url;
        }
        if (formData.online_discount_type === 'code_only' || formData.online_discount_type === 'both') {
          requestBody.discount_codes = validCodes;
        }
        if (formData.discount_valid_days) {
          requestBody.discount_valid_days = parseInt(formData.discount_valid_days);
        }
      } else {
        requestBody.region_codes = selectedRegions.map(r => r.city);
        requestBody.location = formData.location;
        requestBody.location_detail = formData.location_detail || undefined;
        requestBody.phone_number = formData.phone_number;
        requestBody.discount_valid_days = parseInt(formData.offline_discount_valid_days);
        requestBody.discount_codes = validCodes;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '등록에 실패했습니다');
      }

      const data = await response.json();
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
        {/* 이미지 업로드 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              상품 이미지 {errors.images && <span className="text-red-600 text-sm ml-2">{errors.images}</span>}
            </CardTitle>
            <p className="text-sm text-slate-500">첫 번째 이미지가 대표 이미지로 설정됩니다 (최대 10장)</p>
          </CardHeader>
          <CardContent>
            <div
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

              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, index) => {
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
                          <Image
                            src={image.url}
                            alt={`이미지 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {image.isMain && (
                            <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                              대표
                            </Badge>
                          )}
                          <div className="absolute top-2 right-2 flex gap-1">
                            {!image.isMain && (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={() => handleSetMainImage(index)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={() => handleImageRemove(index)}
                            >
                              <X className="w-3 h-3" />
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
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="공구 제목을 입력하세요"
                className={errors.title ? 'border-red-300' : ''}
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                <p className="text-sm text-slate-500 ml-auto">{formData.title.length}/200</p>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <Label>상세 설명 *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="공구 상품에 대한 자세한 설명을 입력하세요"
                className={errors.description ? 'border-red-300' : ''}
                rows={6}
                maxLength={5000}
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
                <p className="text-sm text-slate-500 ml-auto">{formData.description.length}/5,000</p>
              </div>
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
              카테고리 {errors.categories && <span className="text-red-600 text-sm ml-2">{errors.categories}</span>}
            </CardTitle>
            <p className="text-sm text-slate-500">최소 1개, 최대 5개까지 선택 가능합니다</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.value}
                  type="button"
                  variant={selectedCategories.includes(cat.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleCategory(cat.value)}
                  className={selectedCategories.includes(cat.value) ? 'bg-blue-600' : ''}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <p className="text-sm text-slate-600 mt-3">
                선택됨: {selectedCategories.length}/5
              </p>
            )}
          </CardContent>
        </Card>

        {/* 가격 정보 */}
        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle>가격 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>정가 *</Label>
                <Input
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
                  type="number"
                  value={formData.discount_rate}
                  onChange={(e) => handleInputChange('discount_rate', e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  className={errors.discount_rate ? 'border-red-300' : ''}
                />
                {errors.discount_rate && <p className="text-sm text-red-600 mt-1">{errors.discount_rate}</p>}
              </div>
            </div>

            {finalPrice > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-1">최종 가격</p>
                <p className="text-2xl font-bold text-blue-600">{finalPrice.toLocaleString()}원</p>
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label>모집 기간 *</Label>
                <Select value={formData.max_wait_hours} onValueChange={(value) => handleInputChange('max_wait_hours', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">1일</SelectItem>
                    <SelectItem value="72">3일</SelectItem>
                    <SelectItem value="168">7일</SelectItem>
                    <SelectItem value="336">14일</SelectItem>
                    <SelectItem value="720">30일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <div>
                  <Label>할인 링크 *</Label>
                  <Input
                    value={formData.discount_url}
                    onChange={(e) => handleInputChange('discount_url', e.target.value)}
                    placeholder="https://example.com/discount"
                    className={errors.discount_url ? 'border-red-300' : ''}
                  />
                  {errors.discount_url && <p className="text-sm text-red-600 mt-1">{errors.discount_url}</p>}
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
                          maxLength={50}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDiscountCode}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      코드 추가
                    </Button>
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
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="서울시 강남구 테헤란로 123"
                    className={errors.location ? 'border-red-300' : ''}
                    maxLength={300}
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
                          maxLength={50}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDiscountCode}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      코드 추가
                    </Button>
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