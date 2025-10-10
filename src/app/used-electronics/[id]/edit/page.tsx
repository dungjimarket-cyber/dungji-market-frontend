/**
 * 전자제품/PC 수정 페이지
 * /used/electronics/[id]/edit
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Plus, X, Camera, AlertCircle, MapPin,
  Banknote, Package, Smartphone, Info, Lock, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import RequireAuth from '@/components/auth/RequireAuth';
import { UsedElectronics, ELECTRONICS_SUBCATEGORIES, CONDITION_GRADES } from '@/types/electronics';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';
import { compressImageInBrowser } from '@/lib/api/used/browser-image-utils';
import { searchRegionsByName } from '@/lib/api/regionService';
import electronicsApi from '@/lib/api/electronics';

// 수정 가능/불가능 필드 정의
const EDITABLE_AFTER_OFFERS = ['price', 'meeting_place'];
const LOCKED_FIELDS_MESSAGE = '제안을 받은 이후에는 즉시판매가와 거래요청사항만 수정 가능합니다.';

export default async function UsedElectronicsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAuth>
      <UsedElectronicsEditClient electronicsId={id} />
    </RequireAuth>
  );
}

function UsedElectronicsEditClient({ electronicsId }: { electronicsId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [electronics, setElectronics] = useState<UsedElectronics | null>(null);
  const [hasOffers, setHasOffers] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [imagesModified, setImagesModified] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    subcategory: 'laptop',
    brand: '',
    model_name: '',
    condition_grade: 'A',
    price: '',
    min_offer_price: '',
    description: '',
    meeting_place: '',
    has_box: false,
    has_charger: false,
    has_manual: false,
    other_accessories: '',
    purchase_period: '',
    usage_period: '',
    is_unused: false,
    has_receipt: false,
    has_warranty_card: false,
  });

  const [images, setImages] = useState<Array<{ file?: File; preview: string; id?: number }>>([]);
  const [selectedRegions, setSelectedRegions] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 기존 상품 정보 로드
  useEffect(() => {
    if (user !== undefined) {
      fetchElectronicsDetail();
    }
  }, [electronicsId, user]);

  const fetchElectronicsDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/electronics/${electronicsId}/`
        : `${baseUrl}/api/used/electronics/${electronicsId}/`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: '상품을 찾을 수 없습니다',
            variant: 'destructive',
          });
          router.push('/used-electronics');
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await response.json();

      // 권한 체크
      if (user && data.seller?.id !== user.id) {
        toast({
          title: '수정 권한이 없습니다',
          description: '본인이 등록한 상품만 수정할 수 있습니다.',
          variant: 'destructive',
        });
        router.push(`/used-electronics/${electronicsId}`);
        return;
      }

      setElectronics(data);

      // 활성 제안 수 조회 (취소된 제안 제외)
      try {
        const offersResult = await electronicsApi.getActiveOffersCount(parseInt(electronicsId));
        setHasOffers(offersResult.count > 0);
      } catch (error) {
        console.error('Failed to fetch active offers count:', error);
        // 에러 시 기본값 사용
        setHasOffers(data.offer_count > 0);
      }

      // 폼 데이터 설정
      setFormData({
        subcategory: data.subcategory || 'laptop',
        brand: data.brand || '',
        model_name: data.model_name || '',
        condition_grade: data.condition_grade || 'A',
        price: data.price?.toString() || '',
        min_offer_price: data.min_offer_price?.toString() || '',
        description: data.description || '',
        meeting_place: data.meeting_place || '',
        has_box: data.has_box || false,
        has_charger: data.has_charger || false,
        has_manual: data.has_manual || false,
        other_accessories: data.other_accessories || '',
        purchase_period: data.purchase_period || '',
        usage_period: data.usage_period || '',
        is_unused: data.is_unused || false,
        has_receipt: data.has_receipt || false,
        has_warranty_card: data.has_warranty_card || false,
      });

      // 이미지 설정
      if (data.images && data.images.length > 0) {
        setImages(data.images.map((img: any) => ({
          id: img.id,
          preview: img.imageUrl
        })));
      }

      // 지역 설정
      if (Array.isArray(data.regions) && data.regions.length > 0) {
        const formattedRegions = data.regions.map((region: any) => ({
          id: region.id,
          code: region.code,
          province: region.full_name?.split(' ')[0] || region.name?.split(' ')[0] || '',
          city: region.full_name?.split(' ')[1] || region.name?.split(' ')[1] || '',
          district: region.full_name?.split(' ')[2] || region.name?.split(' ')[2] || '',
          name: region.name,
          full_name: region.full_name || region.name,
        }));
        setSelectedRegions(formattedRegions);
      }

    } catch (error) {
      console.error('Failed to fetch electronics:', error);
      toast({
        title: '상품 정보를 불러오는데 실패했습니다',
        variant: 'destructive',
      });
      router.push('/used-electronics');
    } finally {
      setLoading(false);
    }
  };

  // 입력값 변경 처리
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // 이미지 처리
  const handleImageUpload = useCallback(async (files: FileList) => {
    if (images.length + files.length > 10) {
      toast({
        title: '이미지는 최대 10장까지 업로드 가능합니다',
        variant: 'destructive',
      });
      return;
    }

    const newImages: Array<{ file: File; preview: string }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        continue;
      }

      try {
        const compressedFile = await compressImageInBrowser(file);
        const preview = URL.createObjectURL(compressedFile);
        // Blob을 File로 변환
        const fileFromBlob = new File([compressedFile], file.name, { type: compressedFile.type });
        newImages.push({ file: fileFromBlob, preview });
      } catch (error) {
        console.error('Image compression failed:', error);
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setImagesModified(true);
    setIsModified(true);
  }, [images.length, toast]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const removed = newImages.splice(index, 1)[0];
      if (removed.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      return newImages;
    });
    setImagesModified(true);
    setIsModified(true);
  }, []);

  // 대표 이미지 설정 (배열 순서 변경)
  const handleSetMainImage = useCallback((index: number) => {
    if (isFieldLocked('images')) {
      toast({
        title: '수정 불가',
        description: LOCKED_FIELDS_MESSAGE,
        variant: 'destructive',
      });
      return;
    }

    setImages(prev => {
      const updated = [...prev];
      const [mainImage] = updated.splice(index, 1);
      return [mainImage, ...updated];
    });
    setIsModified(true);
    setImagesModified(true);
  }, [isFieldLocked, toast]);

  // 폼 제출
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';

      const formDataToSend = new FormData();

      // 기본 필드 추가
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // 지역 추가
      selectedRegions.forEach(region => {
        formDataToSend.append('regions', region.code);
      });

      // 이미지 처리 - 이미지가 변경된 경우에만 전송
      if (imagesModified) {
        const actualImages = images.filter(img => img && (img.file || img.preview));
        const existingImages = actualImages.filter(img => img.preview && !img.file);
        const newImages = actualImages.filter(img => img.file);

        // 기존 이미지 ID들 전송 (유지할 이미지)
        existingImages.forEach((image) => {
          if (image.id) {
            formDataToSend.append('existing_image_ids', image.id.toString());
          }
        });

        // 새로 추가된 이미지만 업로드
        if (newImages.length > 0) {
          toast({
            title: '이미지 처리 중...',
            description: `새로운 이미지 ${newImages.length}개를 압축하고 있습니다.`,
          });

          for (const image of newImages) {
            try {
              const compressedBlob = await compressImageInBrowser(image.file!, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.85,
                format: 'webp'
              });

              const compressedFile = new File(
                [compressedBlob],
                `image_${Date.now()}.webp`,
                { type: 'image/webp' }
              );

              formDataToSend.append('new_images', compressedFile);
            } catch (error) {
              console.error('Failed to compress image:', error);
              formDataToSend.append('new_images', image.file!);
            }
          }
        }
      }

      // 디버깅용 FormData 내용 출력
      console.log('=== FormData 전송 내용 ===');
      console.log('이미지 변경 여부:', imagesModified);
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value}`);
      }
      console.log('========================');

      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/electronics/${electronicsId}/`
        : `${baseUrl}/api/used/electronics/${electronicsId}/`;

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '수정에 실패했습니다');
      }

      toast({
        title: '상품이 수정되었습니다',
        description: '변경사항이 저장되었습니다.',
      });

      router.push(`/used-electronics/${electronicsId}`);

    } catch (error: any) {
      console.error('Update failed:', error);
      toast({
        title: '수정에 실패했습니다',
        description: error.message || '다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) newErrors.brand = '브랜드를 입력해주세요';
    if (!formData.model_name.trim()) newErrors.model_name = '모델명을 입력해주세요';
    if (!formData.price) newErrors.price = '가격을 입력해주세요';
    if (!formData.description.trim()) newErrors.description = '상품 설명을 입력해주세요';
    if (selectedRegions.length === 0) newErrors.regions = '거래 지역을 선택해주세요';
    if (images.length === 0) newErrors.images = '이미지를 1장 이상 업로드해주세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFieldLocked = (field: string) => {
    return hasOffers && !EDITABLE_AFTER_OFFERS.includes(field);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!electronics) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">상품을 찾을 수 없습니다.</p>
        <Button onClick={() => router.push('/used-electronics')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()}>
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold">전자제품 수정</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        {hasOffers && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 mb-1">수정 제한 안내</p>
                <p className="text-sm text-amber-700">{LOCKED_FIELDS_MESSAGE}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">기본 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subcategory">카테고리 *</Label>
                <select
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  disabled={isFieldLocked('subcategory')}
                  className="w-full p-2 border rounded-md disabled:bg-gray-100"
                >
                  {Object.entries(ELECTRONICS_SUBCATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {errors.subcategory && <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>}
              </div>

              <div>
                <Label htmlFor="brand">브랜드 *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  disabled={isFieldLocked('brand')}
                  placeholder="예: 삼성, LG, 애플"
                />
                {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="model_name">모델명 *</Label>
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => handleInputChange('model_name', e.target.value)}
                  disabled={isFieldLocked('model_name')}
                  placeholder="정확한 모델명을 입력해주세요"
                />
                {errors.model_name && <p className="text-red-500 text-sm mt-1">{errors.model_name}</p>}
              </div>
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">가격 정보</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">즉시판매가 *</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="0"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <Label htmlFor="min_offer_price">최소 제안가</Label>
                <Input
                  id="min_offer_price"
                  value={formData.min_offer_price}
                  onChange={(e) => handleInputChange('min_offer_price', e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="0"
                  disabled={hasOffers}
                />
                {hasOffers && (
                  <p className="text-amber-600 text-xs mt-1">
                    제안을 받은 후에는 최소 제안가를 수정할 수 없습니다
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 상품 설명 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">상품 설명</h2>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isFieldLocked('description')}
              placeholder="상품의 상태, 특징 등을 자세히 설명해주세요"
              rows={5}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* 이미지 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">상품 이미지</h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                  <Image
                    src={img.preview}
                    alt={`상품 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {!isFieldLocked('images') && (
                    <>
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* 대표 이미지 표시 및 설정 */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        {index === 0 ? (
                          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                            대표
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(index)}
                            className="bg-white text-gray-700 px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600"
                          >
                            대표
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}

              {images.length < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400"
                >
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">추가</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            />
            {errors.images && <p className="text-red-500 text-sm mt-2">{errors.images}</p>}
          </div>

          {/* 거래 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">거래 정보</h2>

            <div className="space-y-4">
              {/* 제안 이후 지역 변경 불가 */}
              {!hasOffers && (
                <div>
                  <Label>거래 가능 지역 *</Label>
                  <MultiRegionDropdown
                    selectedRegions={selectedRegions}
                    onSelectionChange={setSelectedRegions}
                    maxSelections={3}
                  />
                  {errors.regions && <p className="text-red-500 text-sm mt-1">{errors.regions}</p>}
                </div>
              )}
              {hasOffers && (
                <div>
                  <Label>거래 가능 지역</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {selectedRegions.map((region) => (
                        <span
                          key={region.code}
                          className="px-3 py-1.5 bg-white rounded-lg border border-gray-300 text-sm text-gray-700"
                        >
                          {region.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-amber-600 text-xs mt-2">
                      제안을 받은 후에는 거래 지역을 변경할 수 없습니다
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="meeting_place">거래 요청사항</Label>
                <Textarea
                  id="meeting_place"
                  value={formData.meeting_place}
                  onChange={(e) => handleInputChange('meeting_place', e.target.value)}
                  placeholder="만날 장소, 시간대 등 거래 관련 요청사항을 입력하세요"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="mt-8 border-t pt-6">
          <div className="container mx-auto max-w-3xl flex gap-3 px-4">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 h-12 text-base font-medium"
            >
              취소
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || !isModified}
              className="flex-1 h-12 text-base font-medium"
            >
              {submitting ? '저장중...' : '저장'}
            </Button>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="pb-8"></div>
      </div>
    </div>
  );
}