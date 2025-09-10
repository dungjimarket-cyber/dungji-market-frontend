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
import RegionDropdownWithCode from '@/components/address/RegionDropdownWithCode';
import { MapPin } from 'lucide-react';

// 이미지 미리보기 타입
interface ImagePreview {
  file: File;
  url: string;
  isMain: boolean;
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
  
  // 지역 선택 관련 상태
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCityCode, setSelectedCityCode] = useState('');
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    storage: '',
    color: '',
    price: '',
    minOfferPrice: '',
    acceptOffers: false,
    conditionGrade: '',
    conditionDescription: '',
    batteryStatus: '',
    hasBox: false,
    hasCharger: false,
    hasEarphones: false,
    description: '',
    region: '',  // Region ID
    meetingPlace: '',
  });

  // 페이지 진입 시 프로필 체크 (중고폰용)
  useEffect(() => {
    if (isAuthenticated) {
      checkProfile();
    }
  }, [isAuthenticated, checkProfile]);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
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
      isMain: images.length === 0 && index === 0,
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [images, toast]);

  // 이미지 삭제
  const handleImageRemove = useCallback((index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // 대표 이미지가 삭제되면 첫 번째 이미지를 대표로
      if (prev[index].isMain && updated.length > 0) {
        updated[0].isMain = true;
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

  // 폼 입력 핸들러
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 지역 선택 핸들러
  const handleRegionSelect = useCallback((province: string, city: string, cityCode: string) => {
    setSelectedProvince(province);
    setSelectedCity(city);
    setSelectedCityCode(cityCode);
    handleInputChange('region', cityCode);
  }, []);

  // 내 지역 설정 핸들러
  const handleSetMyRegion = useCallback(() => {
    if (user?.address_region) {
      // address_region 형식: "서울특별시 강남구" 
      const parts = user.address_region.split(' ');
      if (parts.length >= 2) {
        const province = parts[0];
        const city = parts.slice(1).join(' ');
        
        setSelectedProvince(province);
        setSelectedCity(city);
        // cityCode는 RegionDropdownWithCode 컴포넌트가 내부적으로 처리
      }
    }
  }, [user]);

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

    // 프로필 완성도 체크 (중고폰용)
    const profileComplete = await checkProfile();
    if (!profileComplete) {
      setShowProfileModal(true);
      return;
    }

    // 유효성 검사
    if (images.length === 0) {
      toast({
        title: '이미지 필요',
        description: '최소 1장 이상의 이미지를 등록해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.brand || !formData.model || !formData.price) {
      toast({
        title: '필수 정보 입력',
        description: '브랜드, 모델명, 가격은 필수입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.region) {
      toast({
        title: '거래 지역 선택',
        description: '거래 지역을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // FormData 생성
      const uploadData = new FormData();
      
      // 이미지 추가
      images.forEach((img, index) => {
        uploadData.append('images', img.file);
        if (img.isMain) {
          uploadData.append('mainImageIndex', index.toString());
        }
      });

      // 폼 데이터 추가
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) {
          uploadData.append(key, value.toString());
        }
      });

      // 디버깅용 FormData 내용 출력
      console.log('전송할 FormData:');
      for (let [key, value] of uploadData.entries()) {
        console.log(key, value);
      }

      // API 호출
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const response = await fetch(`${apiUrl}/used/phones/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 에러 응답:', errorData);
        throw new Error(errorData.detail || errorData.error || JSON.stringify(errorData) || '등록 실패');
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
      toast({
        title: '등록 실패',
        description: '상품 등록 중 오류가 발생했습니다.',
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
                
                if (image) {
                  return (
                    <div key={index} className="relative aspect-square group">
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
                        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded font-medium">
                          대표
                        </div>
                      )}
                      
                      {/* 액션 버튼들 */}
                      <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageRemove(index);
                          }}
                          className="bg-red-500/90 backdrop-blur text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  // 빈 슬롯
                  return (
                    <label
                      key={index}
                      className={`aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        index === images.length
                          ? 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-blue-50'
                          : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      {index === images.length ? (
                        <>
                          <Camera className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">{index + 1}/5</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={loading || images.length >= 5}
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
              * 첫 번째 이미지가 대표 이미지로 설정됩니다.
              * 최대 5장까지 등록 가능합니다.
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
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  required
                />
              </div>

              {/* 용량 */}
              <div>
                <Label htmlFor="storage">용량</Label>
                <Select 
                  value={formData.storage} 
                  onValueChange={(value) => handleInputChange('storage', value)}
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
                  </SelectContent>
                </Select>
              </div>

              {/* 색상 */}
              <div>
                <Label htmlFor="color">색상</Label>
                <Input
                  id="color"
                  placeholder="예: 스페이스 블랙"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 가격 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">가격 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 판매 가격 */}
              <div>
                <Label htmlFor="price">판매 가격 <span className="text-red-500">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">원 단위로 입력</p>
              </div>

              {/* 최소 제안 가격 */}
              <div>
                <Label htmlFor="minOfferPrice">최소 제안 가격</Label>
                <Input
                  id="minOfferPrice"
                  type="number"
                  placeholder="0"
                  value={formData.minOfferPrice}
                  onChange={(e) => handleInputChange('minOfferPrice', e.target.value)}
                  disabled={!formData.acceptOffers}
                />
                <p className="text-sm text-gray-500 mt-1">제안 받을 최소 금액</p>
              </div>
            </div>

            {/* 가격 제안 허용 */}
            <div className="flex items-center justify-between py-3 border-t">
              <div>
                <Label htmlFor="acceptOffers" className="text-base">가격 제안 받기</Label>
                <p className="text-sm text-gray-500">구매자가 가격을 제안할 수 있습니다</p>
              </div>
              <Switch
                id="acceptOffers"
                checked={formData.acceptOffers}
                onCheckedChange={(checked) => handleInputChange('acceptOffers', checked)}
              />
            </div>
          </div>

          {/* 상태 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">상태 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 상태 등급 */}
              <div>
                <Label htmlFor="conditionGrade">상태 등급</Label>
                <Select 
                  value={formData.conditionGrade} 
                  onValueChange={(value) => handleInputChange('conditionGrade', value)}
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
              </div>

              {/* 배터리 상태 */}
              <div>
                <Label htmlFor="batteryStatus">배터리 상태</Label>
                <Select 
                  value={formData.batteryStatus} 
                  onValueChange={(value) => handleInputChange('batteryStatus', value)}
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
              </div>
            </div>

            {/* 구성품 */}
            <div>
              <Label className="mb-3 block">구성품</Label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasBox}
                    onChange={(e) => handleInputChange('hasBox', e.target.checked)}
                    className="rounded"
                  />
                  <span>박스</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasCharger}
                    onChange={(e) => handleInputChange('hasCharger', e.target.checked)}
                    className="rounded"
                  />
                  <span>충전기</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasEarphones}
                    onChange={(e) => handleInputChange('hasEarphones', e.target.checked)}
                    className="rounded"
                  />
                  <span>이어폰</span>
                </label>
              </div>
            </div>

            {/* 상태 설명 */}
            <div>
              <Label htmlFor="conditionDescription">상태 설명</Label>
              <Textarea
                id="conditionDescription"
                placeholder="기스, 찍힘 등 상태를 자세히 설명해주세요"
                value={formData.conditionDescription}
                onChange={(e) => handleInputChange('conditionDescription', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* 거래 정보 */}
          <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-4">거래 정보</h2>
            
            {/* 거래 지역 선택 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>거래 지역 <span className="text-red-500">*</span></Label>
                {user?.address_region && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSetMyRegion}
                    className="flex items-center gap-1 text-xs"
                  >
                    <MapPin className="w-3 h-3" />
                    내 지역 ({user.address_region})
                  </Button>
                )}
              </div>
              
              <RegionDropdownWithCode
                selectedProvince={selectedProvince}
                selectedCity={selectedCity}
                selectedCityCode={selectedCityCode}
                onSelect={handleRegionSelect}
                required={true}
              />
              
              {selectedProvince && selectedCity && (
                <p className="text-sm text-gray-600">
                  선택된 지역: {selectedProvince} {selectedCity}
                </p>
              )}
            </div>
            
            {/* 거래 희망 장소 */}
            <div>
              <Label htmlFor="meetingPlace">거래 희망 장소</Label>
              <Input
                id="meetingPlace"
                placeholder="예: 강남역 2번 출구"
                value={formData.meetingPlace}
                onChange={(e) => handleInputChange('meetingPlace', e.target.value)}
              />
            </div>

            {/* 상품 설명 */}
            <div>
              <Label htmlFor="description">상품 설명</Label>
              <Textarea
                id="description"
                placeholder="상품에 대한 추가 설명을 작성해주세요"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
              />
            </div>
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
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? '등록 중...' : '등록하기'}
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
    </div>
  );
}