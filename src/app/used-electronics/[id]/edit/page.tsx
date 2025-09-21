/**
 * 전자제품/가전 수정 페이지
 * /used-electronics/[id]/edit
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Upload, X, AlertCircle, Plus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import electronicsApi from '@/lib/api/electronics';
import type { UsedElectronics, ElectronicsFormData } from '@/types/electronics';
import {
  ELECTRONICS_SUBCATEGORIES,
  CONDITION_GRADES,
  PURCHASE_PERIODS
} from '@/types/electronics';
import Image from 'next/image';
import axios from 'axios';

export default async function UsedElectronicsEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsedElectronicsEditClient electronicsId={id} />;
}

function UsedElectronicsEditClient({ electronicsId }: { electronicsId: string }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [electronics, setElectronics] = useState<UsedElectronics | null>(null);

  const [formData, setFormData] = useState<ElectronicsFormData>({
    subcategory: 'laptop',
    brand: '',
    model_name: '',
    purchase_period: '6months',
    condition_grade: 'B',
    condition_description: '',
    has_box: false,
    has_charger: true,
    has_manual: false,
    other_accessories: '',
    has_receipt: false,
    has_warranty_card: false,
    price: 0,
    accept_offers: false,
    min_offer_price: undefined,
    description: '',
    regions: [],
    meeting_place: '',
    images: []
  });

  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRegions, setSelectedRegions] = useState<number[]>([]);
  const [availableRegions, setAvailableRegions] = useState<any[]>([]);

  // 상품 정보 조회
  useEffect(() => {
    fetchElectronicsDetail();
    fetchRegions();
  }, [electronicsId]);

  const fetchElectronicsDetail = async () => {
    try {
      setLoading(true);
      const data = await electronicsApi.getElectronicsDetail(Number(electronicsId));

      // 권한 체크
      if (!data.is_mine) {
        toast.error('수정 권한이 없습니다.');
        router.push(`/used-electronics/${electronicsId}`);
        return;
      }

      setElectronics(data);

      // 폼 데이터 설정
      setFormData({
        subcategory: data.subcategory as any,
        brand: data.brand,
        model_name: data.model_name,
        purchase_period: data.purchase_period as any,
        condition_grade: data.condition_grade as any,
        condition_description: data.condition_description || '',
        has_box: data.has_box,
        has_charger: data.has_charger,
        has_manual: data.has_manual,
        other_accessories: data.other_accessories || '',
        has_receipt: data.has_receipt || false,
        has_warranty_card: data.has_warranty_card || false,
        price: data.price,
        accept_offers: data.accept_offers,
        min_offer_price: data.min_offer_price || undefined,
        description: data.description,
        regions: data.regions?.map(r => r.id) || [],
        meeting_place: data.meeting_place,
        images: []
      });

      // 기존 이미지 설정
      setExistingImages(data.images || []);

      // 지역 설정
      setSelectedRegions(data.regions?.map(r => r.id) || []);
    } catch (error) {
      console.error('Failed to fetch electronics:', error);
      toast.error('상품 정보를 불러오는데 실패했습니다.');
      router.push('/used-electronics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
      setAvailableRegions(response.data);
    } catch (error) {
      console.error('Failed to fetch regions:', error);
    }
  };

  // 이미지 삭제
  const handleRemoveExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  // 새 이미지 추가
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const totalImages = existingImages.length - deletedImageIds.length + newImages.length + files.length;

    if (totalImages > 10) {
      toast.error('이미지는 최대 10개까지 등록 가능합니다.');
      return;
    }

    const validFiles: File[] = [];
    const previews: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}은 10MB를 초과합니다.`);
        return;
      }

      validFiles.push(file);
      previews.push(URL.createObjectURL(file));
    });

    setNewImages(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...previews]);
  };

  // 새 이미지 제거
  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 지역 선택
  const handleRegionToggle = (regionId: number) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionId)) {
        return prev.filter(id => id !== regionId);
      }
      if (prev.length >= 3) {
        toast.error('거래 지역은 최대 3개까지 선택 가능합니다.');
        return prev;
      }
      return [...prev, regionId];
    });
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand || formData.brand.length > 50) {
      newErrors.brand = '브랜드를 50자 이내로 입력해주세요';
    }

    if (!formData.model_name || formData.model_name.length > 100) {
      newErrors.model_name = '모델명을 100자 이내로 입력해주세요';
    }

    if (!formData.price || formData.price < 1000) {
      newErrors.price = '가격은 1,000원 이상이어야 합니다';
    }

    if (formData.accept_offers && formData.min_offer_price && formData.min_offer_price >= formData.price) {
      newErrors.min_offer_price = '최소 제안가는 판매가보다 낮아야 합니다';
    }

    if (!formData.description || formData.description.length < 10) {
      newErrors.description = '상품 설명을 10자 이상 입력해주세요';
    } else if (formData.description.length > 2000) {
      newErrors.description = '상품 설명은 2000자 이내로 입력해주세요';
    }

    if (formData.meeting_place.length > 200) {
      newErrors.meeting_place = '거래 시 요청사항은 200자 이내로 입력해주세요';
    }

    if (selectedRegions.length === 0) {
      newErrors.regions = '거래 지역을 1개 이상 선택해주세요';
    }

    const totalImages = existingImages.length - deletedImageIds.length + newImages.length;
    if (totalImages === 0) {
      newErrors.images = '이미지를 1개 이상 등록해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const updateData: any = {
        ...formData,
        regions: selectedRegions,
        deleted_image_ids: deletedImageIds,
        images: newImages
      };

      await electronicsApi.updateElectronics(Number(electronicsId), updateData);

      toast.success('상품이 수정되었습니다.');
      router.push(`/used-electronics/${electronicsId}`);
    } catch (error: any) {
      console.error('Failed to update electronics:', error);
      toast.error(error.response?.data?.message || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
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
        <Link href="/used-electronics">
          <Button>목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 -ml-2">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold">상품 수정</h1>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          {/* 이미지 업로드 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Label className="mb-2 block">
                상품 이미지 <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-1">
                  ({existingImages.length - deletedImageIds.length + newImages.length}/10)
                </span>
              </Label>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {/* 기존 이미지 */}
                {existingImages
                  .filter(img => !deletedImageIds.includes(img.id))
                  .map((image) => (
                    <div key={image.id} className="relative flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden border">
                        <Image
                          src={image.imageUrl || '/images/no-image.png'}
                          alt="상품 이미지"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(image.id)}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                {/* 새 이미지 미리보기 */}
                {imagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border">
                      <Image
                        src={preview}
                        alt="상품 이미지"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(index)}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* 추가 버튼 */}
                {existingImages.length - deletedImageIds.length + newImages.length < 10 && (
                  <label className="flex-shrink-0">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                      <Camera className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">추가</span>
                    </div>
                  </label>
                )}
              </div>

              {errors.images && (
                <p className="text-red-500 text-sm mt-1">{errors.images}</p>
              )}
            </CardContent>
          </Card>

          {/* 기본 정보 */}
          <Card className="mb-4">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="subcategory">
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData({ ...formData, subcategory: value as any })}
                >
                  <SelectTrigger className="mt-1">
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
              </div>

              <div>
                <Label htmlFor="brand">
                  브랜드 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="예: 삼성, LG, 애플"
                  maxLength={50}
                  className="mt-1"
                />
                {errors.brand && (
                  <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
                )}
              </div>

              <div>
                <Label htmlFor="model_name">
                  모델명 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="예: 갤럭시북3 프로, 맥북 프로 14"
                  maxLength={100}
                  className="mt-1"
                />
                {errors.model_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.model_name}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 상태 정보 */}
          <Card className="mb-4">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>구매 시기 <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.purchase_period}
                    onValueChange={(value) => setFormData({ ...formData, purchase_period: value as any })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PURCHASE_PERIODS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>상태 등급 <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.condition_grade}
                    onValueChange={(value) => setFormData({ ...formData, condition_grade: value as any })}
                  >
                    <SelectTrigger className="mt-1">
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

              <div>
                <Label htmlFor="condition_description">상태 설명</Label>
                <Textarea
                  id="condition_description"
                  value={formData.condition_description}
                  onChange={(e) => setFormData({ ...formData, condition_description: e.target.value })}
                  placeholder="제품의 현재 상태를 자세히 설명해주세요 (스크래치, 찍힘 등)"
                  rows={3}
                  maxLength={500}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {formData.condition_description?.length || 0}/500
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 구성품 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Label className="mb-3 block">구성품</Label>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_box"
                    checked={formData.has_box}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_box: checked as boolean })
                    }
                  />
                  <Label htmlFor="has_box" className="font-normal">
                    박스
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_charger"
                    checked={formData.has_charger}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_charger: checked as boolean })
                    }
                  />
                  <Label htmlFor="has_charger" className="font-normal">
                    충전기/어댑터
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_manual"
                    checked={formData.has_manual}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_manual: checked as boolean })
                    }
                  />
                  <Label htmlFor="has_manual" className="font-normal">
                    설명서
                  </Label>
                </div>

                <div>
                  <Label htmlFor="other_accessories">기타 구성품</Label>
                  <Input
                    id="other_accessories"
                    value={formData.other_accessories}
                    onChange={(e) => setFormData({ ...formData, other_accessories: e.target.value })}
                    placeholder="예: 키보드, 마우스, 케이스"
                    maxLength={200}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formData.other_accessories?.length || 0}/200
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Label className="mb-3 block">추가 정보</Label>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_receipt"
                    checked={formData.has_receipt}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_receipt: checked as boolean })
                    }
                  />
                  <Label htmlFor="has_receipt" className="font-normal">
                    영수증 보유
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_warranty_card"
                    checked={formData.has_warranty_card}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, has_warranty_card: checked as boolean })
                    }
                  />
                  <Label htmlFor="has_warranty_card" className="font-normal">
                    보증서 보유
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 가격 정보 */}
          <Card className="mb-4">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="price">
                  판매 가격 <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    className="pr-8"
                    min={1000}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    원
                  </span>
                </div>
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accept_offers"
                    checked={formData.accept_offers}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, accept_offers: checked as boolean })
                    }
                  />
                  <Label htmlFor="accept_offers" className="font-normal">
                    가격 제안 받기
                  </Label>
                </div>

                {formData.accept_offers && (
                  <div>
                    <Label htmlFor="min_offer_price">최소 제안 가격</Label>
                    <div className="relative mt-1">
                      <Input
                        id="min_offer_price"
                        type="number"
                        value={formData.min_offer_price || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_offer_price: e.target.value ? parseInt(e.target.value) : undefined
                          })
                        }
                        placeholder="최소 제안 가격을 입력하세요"
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        원
                      </span>
                    </div>
                    {errors.min_offer_price && (
                      <p className="text-red-500 text-sm mt-1">{errors.min_offer_price}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 상품 설명 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Label htmlFor="description">
                상품 설명 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="상품에 대해 자세히 설명해주세요"
                rows={6}
                minLength={10}
                maxLength={2000}
                className="mt-1"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                ) : (
                  <p className="text-xs text-gray-500">최소 10자 이상 입력해주세요</p>
                )}
                <p className="text-xs text-gray-500">
                  {formData.description.length}/2000
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 거래 지역 */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <Label className="mb-2 block">
                거래 희망 지역 <span className="text-red-500">*</span>
                <span className="text-sm text-gray-500 ml-1">(최대 3개)</span>
              </Label>

              <div className="space-y-2">
                {availableRegions.map((region) => (
                  <div key={region.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region.id}`}
                      checked={selectedRegions.includes(region.id)}
                      onCheckedChange={() => handleRegionToggle(region.id)}
                    />
                    <Label htmlFor={`region-${region.id}`} className="font-normal cursor-pointer">
                      {region.name}
                    </Label>
                  </div>
                ))}
              </div>

              {errors.regions && (
                <p className="text-red-500 text-sm mt-1">{errors.regions}</p>
              )}
            </CardContent>
          </Card>

          {/* 거래 시 요청사항 */}
          <Card className="mb-20">
            <CardContent className="p-4">
              <Label htmlFor="meeting_place">거래 시 요청사항</Label>
              <Textarea
                id="meeting_place"
                value={formData.meeting_place}
                onChange={(e) => setFormData({ ...formData, meeting_place: e.target.value })}
                placeholder="예: 강남역 2번 출구, 저녁 7시 이후 가능"
                rows={3}
                maxLength={200}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.meeting_place.length}/200
              </p>
            </CardContent>
          </Card>

          {/* 하단 버튼 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
            <div className="container mx-auto max-w-2xl flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={submitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? '수정 중...' : '수정 완료'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}