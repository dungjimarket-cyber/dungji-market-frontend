/**
 * 전자제품/가전 등록 페이지
 * /used-electronics/create
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUsedPhoneProfileCheck } from '@/hooks/useUsedPhoneProfileCheck';
import UsedPhoneProfileCheckModal from '@/components/common/UsedPhoneProfileCheckModal';
import electronicsApi from '@/lib/api/electronics';
import { searchRegionsByName } from '@/lib/api/regionService';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';
import { ELECTRONICS_SUBCATEGORIES, CONDITION_GRADES, PURCHASE_PERIODS } from '@/types/electronics';
import type { ElectronicsFormData } from '@/types/electronics';
import Image from 'next/image';
import { compressImageInBrowser } from '@/lib/api/used/browser-image-utils';

// 이미지 미리보기 타입
interface ImagePreview {
  file: File | null;
  url: string;
  isMain: boolean;
  isEmpty?: boolean;
}

// 선택된 지역 타입 (MultiRegionDropdown과 호환되도록 수정)
interface SelectedRegion {
  province: string;
  city: string;
}

export default function ElectronicsCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isProfileComplete, checkProfile, showProfileModal, setShowProfileModal, missingFields } = useUsedPhoneProfileCheck();

  // Refs for scroll on error
  const subcategoryRef = useRef<HTMLButtonElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const modelRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const minOfferPriceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const meetingPlaceRef = useRef<HTMLTextAreaElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 폼 데이터
  const [formData, setFormData] = useState<ElectronicsFormData>({
    subcategory: 'laptop',
    brand: '',
    model_name: '',
    purchase_period: '',
    usage_period: '',
    is_unused: false,
    condition_grade: 'B',
    condition_description: '',
    has_box: false,
    has_charger: false,
    other_accessories: '',
    has_warranty_card: false,
    price: '',
    accept_offers: true,  // 항상 true로 고정
    min_offer_price: '',
    description: '',
    regions: [],
    meeting_place: '',
  });

  // 미개봉 체크 전 사용기간 백업 (체크 해제 시 복구용)
  const [prevUsagePeriod, setPrevUsagePeriod] = useState<string>('');

  // 이미지 상태 (1-10장)
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>(
    Array(10).fill(null).map((_, idx) => ({
      file: null,
      url: '',
      isMain: idx === 0,
      isEmpty: true,
    }))
  );

  // 지역 선택
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>([]);

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canRegister, setCanRegister] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // 프로필 체크
  useEffect(() => {
    checkProfile();
  }, []);

  // 등록 제한 체크
  useEffect(() => {
    const checkLimit = async () => {
      if (!user) return;

      try {
        const response = await electronicsApi.checkRegistrationLimit();
        setCanRegister(response.can_register);

        if (!response.can_register) {
          toast({
            title: '등록 제한',
            description: `최대 ${response.max_count}개까지만 등록 가능합니다. (현재 ${response.current_count}개)`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to check limit:', error);
      }
    };

    checkLimit();
  }, [user, toast]);

  // 입력 핸들러
  // 천원 단위로 맞추기
  const roundToThousand = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return '';
    const rounded = Math.round(num / 1000) * 1000;
    return rounded.toString();
  };

  // 가격 포맷팅 (콤마 추가)
  const formatPrice = (value: string) => {
    const num = value.replace(/[^0-9]/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString();
  };

  // 가격 언포맷팅 (콤마 제거)
  const unformatPrice = (value: string) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 빈 슬롯 제거하고 앞으로 당기는 함수
  const compactImages = (imageArray: typeof imagePreviews) => {
    return imageArray.filter(img => img && !img.isEmpty);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | File[], targetIndex?: number) => {
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

      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '이미지 크기 초과',
          description: `${file.name} 파일이 10MB를 초과합니다.`,
          variant: 'destructive',
        });

        // 해당 슬롯 클리어
        if (targetIndex !== undefined) {
          setImagePreviews(prev => {
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

        // input 필드 초기화
        if (!Array.isArray(e) && e.target) {
          e.target.value = '';
        }

        return;
      }
    }

    setImagePreviews(prev => {
      const updated = [...prev];

      // 특정 슬롯에 개별 업로드인 경우
      if (targetIndex !== undefined && files.length === 1) {
        const file = files[0];
        // 기존 이미지가 있으면 URL 정리
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

      // 다중 업로드인 경우 - 현재 채워진 이미지 오른쪽부터 채우기
      const actualImages = updated.filter(img => img && !img.isEmpty);
      const lastFilledIndex = actualImages.length > 0 ?
        updated.findLastIndex(img => img && !img.isEmpty) : -1;

      // 총 이미지 개수 체크
      if (actualImages.length + files.length > 10) {
        toast({
          title: '이미지 개수 초과',
          description: '최대 10장까지 업로드 가능합니다.',
          variant: 'destructive',
        });
        return prev;
      }

      let insertIndex = lastFilledIndex + 1;

      files.forEach((file, index) => {
        if (insertIndex < 10) {
          // 기존 이미지가 있으면 URL 정리
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
  }, [toast]);

  // 이미지 삭제 (빈 슬롯 유지)
  const handleImageRemove = useCallback((index: number) => {
    setImagePreviews(prev => {
      const updated = [...prev];
      const imageToRemove = updated[index];

      // 기존 이미지 URL 정리
      if (imageToRemove && imageToRemove.url) {
        URL.revokeObjectURL(imageToRemove.url);
      }

      // 첫 번째 슬롯(대표 이미지) 삭제 방지
      if (index === 0) {
        // 첫 번째 슬롯은 빈 슬롯으로 만들고 isMain 유지
        updated[index] = {
          file: null,
          url: '',
          isMain: true,
          isEmpty: true
        };
      } else {
        // 다른 슬롯은 빈 슬롯으로만 변경
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
  const handleSetMainImage = (index: number) => {
    const newPreviews = imagePreviews.map((preview, idx) => ({
      ...preview,
      isMain: idx === index,
    }));
    setImagePreviews(newPreviews);
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let firstErrorRef: React.RefObject<any> | null = null;

    // 카테고리
    if (!formData.subcategory) {
      newErrors.subcategory = '카테고리를 선택해주세요';
      if (!firstErrorRef) firstErrorRef = subcategoryRef;
    }

    // 브랜드
    if (!formData.brand || formData.brand.length < 1) {
      newErrors.brand = '브랜드를 입력해주세요';
      if (!firstErrorRef) firstErrorRef = brandRef;
    } else if (formData.brand.length > 50) {
      newErrors.brand = '브랜드는 50자 이내로 입력해주세요';
      if (!firstErrorRef) firstErrorRef = brandRef;
    }

    // 모델명
    if (!formData.model_name || formData.model_name.length < 2) {
      newErrors.model_name = '모델명을 2자 이상 입력해주세요';
      if (!firstErrorRef) firstErrorRef = modelRef;
    } else if (formData.model_name.length > 100) {
      newErrors.model_name = '모델명은 100자 이내로 입력해주세요';
      if (!firstErrorRef) firstErrorRef = modelRef;
    }

    // 가격
    if (!formData.price) {
      newErrors.price = '즉시 판매가를 입력해주세요';
      if (!firstErrorRef) firstErrorRef = priceRef;
    } else {
      const price = parseInt(formData.price);
      if (price < 1000) {
        newErrors.price = '최소 가격은 1,000원입니다';
        if (!firstErrorRef) firstErrorRef = priceRef;
      } else if (price % 1000 !== 0) {
        newErrors.price = '가격은 천원 단위로 입력해주세요';
        if (!firstErrorRef) firstErrorRef = priceRef;
      } else if (price > 9900000) {
        newErrors.price = '최대 판매 금액은 990만원입니다';
        if (!firstErrorRef) firstErrorRef = priceRef;
      }
    }

    // 최소 제안가 (필수)
    if (!formData.min_offer_price) {
      newErrors.min_offer_price = '최소 제안가를 입력해주세요';
      if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
    } else {
      const minPrice = parseInt(formData.min_offer_price);
      if (minPrice < 1000) {
        newErrors.min_offer_price = '최소 가격은 1,000원입니다';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      } else if (minPrice % 1000 !== 0) {
        newErrors.min_offer_price = '가격은 천원 단위로 입력해주세요';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      } else if (minPrice > 9900000) {
        newErrors.min_offer_price = '최대 제안 금액은 990만원입니다';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      } else if (formData.price && minPrice >= parseInt(formData.price)) {
        newErrors.min_offer_price = '최소 제안가는 즉시 판매가보다 낮아야 합니다';
        if (!firstErrorRef) firstErrorRef = minOfferPriceRef;
      }
    }

    // 상품 설명
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = '상품 설명을 10자 이상 입력해주세요';
      if (!firstErrorRef) firstErrorRef = descriptionRef;
    } else if (formData.description.length > 2000) {
      newErrors.description = '상품 설명은 2000자 이내로 입력해주세요';
      if (!firstErrorRef) firstErrorRef = descriptionRef;
    }

    // 거래 지역
    if (selectedRegions.length === 0) {
      newErrors.regions = '거래 지역을 최소 1개 선택해주세요';
    } else if (selectedRegions.length > 3) {
      newErrors.regions = '거래 지역은 최대 3개까지 선택 가능합니다';
    }

    // 거래 요청사항
    if (!formData.meeting_place || !formData.meeting_place.trim()) {
      newErrors.meeting_place = '거래시 요청사항을 입력해주세요';
      if (!firstErrorRef) firstErrorRef = meetingPlaceRef;
    } else if (formData.meeting_place.length > 200) {
      newErrors.meeting_place = '거래 요청사항은 200자 이내로 입력해주세요';
      if (!firstErrorRef) firstErrorRef = meetingPlaceRef;
    }

    // 이미지 (최소 1장)
    const hasImage = imagePreviews.some(preview => !preview.isEmpty);
    if (!hasImage) {
      newErrors.images = '상품 사진을 최소 1장 이상 등록해주세요';
      if (!firstErrorRef) firstErrorRef = imageContainerRef;
    }

    setErrors(newErrors);

    // 첫 번째 에러 필드로 스크롤
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return Object.keys(newErrors).length === 0;
  };

  // 드래그앤드롭 이벤트 핸들러
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      // 첫 번째 빈 슬롯 찾기
      const firstEmptyIndex = imagePreviews.findIndex(preview => preview.isEmpty);

      if (firstEmptyIndex !== -1) {
        // 첫 번째 이미지 파일만 처리
        handleImageUpload(imageFiles.slice(0, 1), firstEmptyIndex);
      } else {
        toast({
          title: '이미지 슬롯이 가득 찼습니다',
          variant: 'destructive',
        });
      }
    }
  };

  // 폼 제출
  const handleSubmit = async () => {
    // 프로필 체크
    if (!isProfileComplete) {
      setShowProfileModal(true);
      return;
    }

    // 등록 제한 체크
    if (!canRegister) {
      toast({
        title: '등록 제한',
        description: '최대 등록 가능 개수를 초과했습니다.',
        variant: 'destructive',
      });
      return;
    }

    // 유효성 검사
    if (!validateForm()) {
      toast({
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 이미지 파일 수집
      const imageFiles = imagePreviews
        .filter(preview => !preview.isEmpty && preview.file)
        .sort((a, b) => (a.isMain ? -1 : b.isMain ? 1 : 0))
        .map(preview => preview.file!);

      // 이미지 압축
      let compressedImages: File[] = [];
      if (imageFiles.length > 0) {
        toast({
          title: '이미지 압축 중',
          description: `${imageFiles.length}개의 이미지를 압축하고 있습니다.`,
        });

        for (const imageFile of imageFiles) {
          try {
            const compressedBlob = await compressImageInBrowser(imageFile, {
              maxWidth: 1200,
              maxHeight: 1200,
              quality: 0.85,
              format: 'webp'
            });

            const compressedFile = new File(
              [compressedBlob],
              `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`,
              { type: 'image/webp' }
            );

            compressedImages.push(compressedFile);
          } catch (error) {
            console.error('Failed to compress image:', error);
            // 압축 실패 시 원본 이미지 사용
            compressedImages.push(imageFile);
          }
        }
      }

      // 데이터 준비
      // 지역 처리 - 휴대폰과 동일한 방식 사용
      let regionIds: number[] = [];
      if (selectedRegions.length > 0) {
        // 지역명으로 실제 지역 코드 찾기
        for (const region of selectedRegions) {
          try {
            const searchName = region.city || region.province;
            const regions = await searchRegionsByName(searchName);

            if (regions && regions.length > 0) {
              // 가장 정확한 매칭 찾기
              const exactMatch = regions.find(r =>
                r.full_name.includes(region.province) &&
                r.full_name.includes(region.city)
              ) || regions[0];

              regionIds.push(Number(exactMatch.code));
              console.log('Region found:', exactMatch.code, exactMatch.full_name);
            }
          } catch (error) {
            console.error('Failed to find region:', error);
            // 실패시 기본값 사용
            regionIds.push(11); // 서울특별시
          }
        }
      }

      // 지역 ID가 없으면 기본값 추가
      if (regionIds.length === 0) {
        regionIds = [11]; // 서울특별시
      }

      const submitData: ElectronicsFormData = {
        ...formData,
        regions: regionIds,
        images: compressedImages,
      };

      // API 호출
      const response = await electronicsApi.createElectronics(submitData);

      toast({
        title: '등록 완료',
        description: '상품이 성공적으로 등록되었습니다.',
      });

      router.push(`/used-electronics/${response.id}`);
    } catch (error: any) {
      console.error('Failed to create electronics:', error);

      if (error.response?.data) {
        const errorData = error.response.data;
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        toast({
          title: '등록 실패',
          description: errorMessages || '상품 등록에 실패했습니다.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '등록 실패',
          description: '상품 등록에 실패했습니다. 다시 시도해주세요.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">전자제품/가전 등록</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="bg-white rounded-lg p-4 space-y-6">

          {/* 이미지 업로드 */}
          <div
            ref={imageContainerRef}
            className={`relative ${isDragging ? 'ring-2 ring-primary ring-opacity-50 bg-blue-50' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}>
            <Label className="text-base font-semibold mb-2 block">
              상품 사진 <span className="text-red-500">*</span>
              <span className="text-sm font-normal text-gray-500 ml-2">
                (최소 1장, 최대 10장)
              </span>
            </Label>

            {/* 드래그 앤 드롭 안내 */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-lg z-10">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-primary font-semibold">여기에 이미지를 놓으세요</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  {preview.isEmpty ? (
                    <label className="block w-full h-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, index)}
                        disabled={loading}
                      />
                      <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary transition-colors">
                        <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">{index === 0 ? '대표' : `${index + 1}`}</span>
                      </div>
                    </label>
                  ) : (
                    <>
                      <Image
                        src={preview.url}
                        alt={`상품 이미지 ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      {preview.isMain && (
                        <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                          대표
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {!preview.isMain && index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetMainImage(index)}
                          className="absolute bottom-1 left-1 text-xs bg-white/90 px-2 py-0.5 rounded hover:bg-white"
                          disabled={loading}
                        >
                          대표설정
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {errors.images && (
              <p className="text-sm text-red-500 mt-1">{errors.images}</p>
            )}
          </div>

          {/* 카테고리 선택 */}
          <div>
            <Label htmlFor="subcategory">카테고리 <span className="text-red-500">*</span></Label>
            <Select
              value={formData.subcategory}
              onValueChange={(value) => handleInputChange('subcategory', value)}
              disabled={loading}
            >
              <SelectTrigger ref={subcategoryRef} className={errors.subcategory ? 'border-red-300' : ''}>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ELECTRONICS_SUBCATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subcategory && (
              <p className="text-sm text-red-500 mt-1">{errors.subcategory}</p>
            )}
          </div>

          {/* 제품 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">브랜드 <span className="text-red-500">*</span></Label>
              <Input
                ref={brandRef}
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="예: 삼성, LG, 애플"
                maxLength={50}
                className={errors.brand ? 'border-red-300' : ''}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.brand.length}/50</p>
              {errors.brand && (
                <p className="text-sm text-red-500 mt-1">{errors.brand}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model_name">모델명 <span className="text-red-500">*</span></Label>
              <Input
                ref={modelRef}
                id="model_name"
                value={formData.model_name}
                onChange={(e) => handleInputChange('model_name', e.target.value)}
                placeholder="예: 갤럭시북 프로, 맥북 에어"
                maxLength={100}
                className={errors.model_name ? 'border-red-300' : ''}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.model_name.length}/100</p>
              {errors.model_name && (
                <p className="text-sm text-red-500 mt-1">{errors.model_name}</p>
              )}
            </div>
          </div>

          {/* 상태 정보 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase_period">구매 시기</Label>
              <Input
                id="purchase_period"
                type="text"
                value={formData.purchase_period || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 50) {
                    handleInputChange('purchase_period', e.target.value);
                  }
                }}
                placeholder="예: 2024년 3월, 작년 여름, 6개월 전, 모름"
                maxLength={50}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                대략적인 구매 시기를 자유롭게 입력 (선택사항)
              </p>
            </div>

            <div>
              <Label htmlFor="usage_period">사용 기간</Label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_unopened"
                      checked={formData.usage_period === '미개봉'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // 미개봉 체크 시
                          setPrevUsagePeriod(formData.usage_period || '');
                          handleInputChange('usage_period', '미개봉');
                          handleInputChange('is_unused', true);
                          handleInputChange('condition_grade', 'S');
                        } else {
                          // 체크 해제 시
                          handleInputChange('usage_period', prevUsagePeriod);
                          handleInputChange('is_unused', false);
                          handleInputChange('condition_grade', 'B');
                        }
                      }}
                      disabled={loading}
                    />
                    <Label htmlFor="is_unopened" className="font-normal cursor-pointer text-sm">
                      미개봉
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_unused"
                      checked={formData.usage_period === '미사용'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // 미사용 체크 시
                          setPrevUsagePeriod(formData.usage_period || '');
                          handleInputChange('usage_period', '미사용');
                          handleInputChange('is_unused', true);
                          handleInputChange('condition_grade', 'A');
                        } else {
                          // 체크 해제 시
                          handleInputChange('usage_period', prevUsagePeriod);
                          handleInputChange('is_unused', false);
                          handleInputChange('condition_grade', 'B');
                        }
                      }}
                      disabled={loading}
                    />
                    <Label htmlFor="is_unused" className="font-normal cursor-pointer text-sm">
                      미사용 (개봉 후)
                    </Label>
                  </div>
                </div>
                <Input
                  id="usage_period"
                  type="text"
                  value={formData.usage_period || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 50) {
                      handleInputChange('usage_period', e.target.value);
                      // 직접 입력 시 체크박스들 해제
                      if (e.target.value !== '미개봉' && e.target.value !== '미사용') {
                        handleInputChange('is_unused', false);
                      }
                    }
                  }}
                  placeholder="예: 6개월 사용, 1년 사용, 거의 안씀"
                  maxLength={50}
                  disabled={loading || formData.usage_period === '미개봉' || formData.usage_period === '미사용'}
                  className={(formData.usage_period === '미개봉' || formData.usage_period === '미사용') ? 'bg-gray-100' : ''}
                />
                <p className="text-xs text-gray-500">
                  실제 사용한 기간을 입력해주세요 (선택사항)
                </p>
              </div>
            </div>

            <div>
              <Label>상태 등급 <span className="text-red-500">*</span></Label>
              <Select
                value={formData.condition_grade}
                onValueChange={(value) => handleInputChange('condition_grade', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONDITION_GRADES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 상태 설명 */}
          <div>
            <Label htmlFor="condition_description">상태 설명</Label>
            <Textarea
              id="condition_description"
              value={formData.condition_description || ''}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  handleInputChange('condition_description', e.target.value);
                }
              }}
              placeholder="하자사항이나 수리이력을 입력해주세요 (선택)"
              rows={3}
              maxLength={500}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.condition_description?.length || 0}/500자
            </p>
          </div>

          {/* 구성품 */}
          <div>
            <Label className="mb-3 block">구성품</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_box"
                  checked={formData.has_box}
                  onCheckedChange={(checked) => handleInputChange('has_box', checked)}
                  disabled={loading}
                />
                <Label htmlFor="has_box" className="font-normal cursor-pointer">박스</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_charger"
                  checked={formData.has_charger}
                  onCheckedChange={(checked) => handleInputChange('has_charger', checked)}
                  disabled={loading}
                />
                <Label htmlFor="has_charger" className="font-normal cursor-pointer">충전기/전원선</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_warranty_card"
                  checked={formData.has_warranty_card}
                  onCheckedChange={(checked) => handleInputChange('has_warranty_card', checked)}
                  disabled={loading}
                />
                <Label htmlFor="has_warranty_card" className="font-normal cursor-pointer">보증서</Label>
              </div>
            </div>

            <div className="mt-3">
              <Input
                value={formData.other_accessories || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    handleInputChange('other_accessories', e.target.value);
                  }
                }}
                placeholder="기타 구성품 (예: 리모컨, 케이블, 케이스)"
                maxLength={200}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.other_accessories?.length || 0}/200자
              </p>
            </div>
          </div>

          {/* 가격 정보 */}
          <div>
            <Label htmlFor="price">즉시 판매가 <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                ref={priceRef}
                id="price"
                type="text"
                value={formatPrice(formData.price)}
                onChange={(e) => {
                  const unformatted = unformatPrice(e.target.value);
                  handleInputChange('price', unformatted);
                }}
                onBlur={(e) => {
                  // 포커스 아웃 시 천원 단위로 자동 조정
                  const unformatted = unformatPrice(e.target.value);
                  if (unformatted) {
                    const rounded = roundToThousand(unformatted);
                    handleInputChange('price', rounded);
                  }
                }}
                placeholder="판매 희망 가격"
                className={errors.price ? 'border-red-300' : ''}
                disabled={loading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
            </div>
            {errors.price && (
              <p className="text-sm text-red-500 mt-1">{errors.price}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              가격은 천원 단위로 입력 가능합니다
            </p>

            {/* 가격 제안은 항상 받음 (토글 제거) */}
            <p className="text-xs text-gray-500 mt-2">
              구매자가 가격을 제안할 수 있습니다. 즉시 구매도 가능합니다.
            </p>

            {/* 최소 제안가 (필수) */}
            <div className="mt-4">
              <Label htmlFor="min_offer_price">최소 제안가 <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    ref={minOfferPriceRef}
                    id="min_offer_price"
                    type="text"
                    value={formatPrice(formData.min_offer_price || '')}
                    onChange={(e) => {
                      const unformatted = unformatPrice(e.target.value);
                      handleInputChange('min_offer_price', unformatted);
                    }}
                    onBlur={(e) => {
                      // 포커스 아웃 시 천원 단위로 자동 조정
                      const unformatted = unformatPrice(e.target.value);
                      if (unformatted) {
                        const rounded = roundToThousand(unformatted);
                        handleInputChange('min_offer_price', rounded);
                      }
                    }}
                    placeholder="최소 제안 가격"
                    className={errors.min_offer_price ? 'border-red-300' : ''}
                    disabled={loading}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                </div>
                {errors.min_offer_price && (
                  <p className="text-sm text-red-500 mt-1">{errors.min_offer_price}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  가격은 천원 단위로 입력 가능합니다 (판매가보다 낮게)
                </p>
            </div>
          </div>

          {/* 상품 설명 */}
          <div>
            <Label htmlFor="description">상품 설명 <span className="text-red-500">*</span></Label>
            <Textarea
              ref={descriptionRef}
              id="description"
              value={formData.description}
              onChange={(e) => {
                if (e.target.value.length <= 2000) {
                  handleInputChange('description', e.target.value);
                }
              }}
              placeholder="상품에 대해 자세히 설명해주세요 (상태, 구매시기, 사용감, 특징 등)"
              rows={6}
              maxLength={2000}
              className={errors.description ? 'border-red-300' : ''}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">최소 10자 이상 입력해주세요</p>
              <p className="text-xs text-gray-500">{formData.description.length}/2000자</p>
            </div>
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* 거래 지역 */}
          <div>
            <Label>거래 희망 지역 <span className="text-red-500">*</span> (최대 3곳)</Label>
            <MultiRegionDropdown
              selectedRegions={selectedRegions}
              onSelectionChange={setSelectedRegions}
              maxSelections={3}
            />
            {errors.regions && (
              <p className="text-sm text-red-500 mt-1">{errors.regions}</p>
            )}
          </div>

          {/* 거래 요청사항 */}
          <div>
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
              disabled={loading}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">구체적인 거래 장소나 시간대를 입력해주세요</p>
              <p className="text-xs text-gray-500">{formData.meeting_place.length}/200자</p>
            </div>
            {errors.meeting_place && (
              <p className="text-sm text-red-500 mt-1">{errors.meeting_place}</p>
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs sm:text-sm text-yellow-800">
              <span className="font-medium">⚠️ 주의사항</span><br/>
              • 가격 제안이 들어온 후에는 일부 정보만 수정 가능합니다<br className="sm:hidden"/>
              <span className="hidden sm:inline"> </span>(가격, 제안가, 거래요청사항, 상품설명)<br/>
              • 거래는 직거래만 가능합니다 (택배거래 불가)<br/>
              • 허위 매물 등록 시 이용이 제한될 수 있습니다
            </p>
          </div>

          {/* 등록 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !canRegister}
            className="w-full"
            size="lg"
          >
            {loading ? '등록 중...' : '등록하기'}
          </Button>
        </div>
      </div>

      {/* 프로필 체크 모달 */}
      <UsedPhoneProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
      />
    </div>
  );
}