/**
 * 중고폰 수정 페이지
 * /used/[id]/edit
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, Plus, X, Camera, AlertCircle, MapPin, 
  DollarSign, Package, Smartphone, Info, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UsedPhone, CONDITION_GRADES, BATTERY_STATUS_LABELS, BATTERY_STATUS_DESCRIPTIONS } from '@/types/used';
import MultiRegionDropdown from '@/components/address/MultiRegionDropdown';

// 수정 가능/불가능 필드 정의
const EDITABLE_AFTER_OFFERS = ['price', 'meeting_place'];
const LOCKED_FIELDS_MESSAGE = '견적이 제안된 이후에는 수정할 수 없습니다.';

export default async function UsedPhoneEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UsedPhoneEditClient phoneId={id} />;
}

function UsedPhoneEditClient({ phoneId }: { phoneId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState<UsedPhone | null>(null);
  const [hasOffers, setHasOffers] = useState(false);
  const [isModified, setIsModified] = useState(false);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    model: '',
    storage: '',
    color: '',
    condition_grade: 'A',
    battery_status: '80_89',
    price: '',
    min_offer_price: '',
    condition_description: '',
    description: '', // 현재 사용 안함
    meeting_place: '',
    has_box: false,
    has_charger: false,
    has_earphones: false,
  });
  
  const [images, setImages] = useState<Array<{ file?: File; preview: string; id?: number }>>([]);
  const [selectedRegions, setSelectedRegions] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 기존 상품 정보 로드
  useEffect(() => {
    // user 상태가 로드된 후에만 실행 (undefined는 초기 상태)
    if (user !== undefined) {
      fetchPhoneDetail();
    }
  }, [phoneId, user]);

  const fetchPhoneDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/`
        : `${baseUrl}/api/used/phones/${phoneId}/`;
      
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
          router.push('/used');
          return;
        }
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();

      // 권한 체크 - user가 null이 아닌 경우에만 체크
      if (user && data.seller?.id !== user.id) {
        toast({
          title: '수정 권한이 없습니다',
          description: '본인이 등록한 상품만 수정할 수 있습니다.',
          variant: 'destructive',
        });
        router.push(`/used/${phoneId}`);
        return;
      }

      // user가 없는 경우 (로그인하지 않은 경우)
      if (!user) {
        toast({
          title: '로그인이 필요합니다',
          description: '상품을 수정하려면 로그인이 필요합니다.',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }
      
      setPhone(data);
      setHasOffers(data.offer_count > 0);
      
      // 폼 데이터 설정
      setFormData({
        model: data.model || '',
        storage: data.storage || '',
        color: data.color || '',
        condition_grade: data.condition_grade || 'A',
        battery_status: data.battery_status || '80_89',
        price: data.price?.toString() || '',
        min_offer_price: data.min_offer_price?.toString() || '',
        condition_description: data.condition_description || '',
        description: data.description || '',
        meeting_place: data.meeting_place || '',
        has_box: data.has_box || false,
        has_charger: data.has_charger || false,
        has_earphones: data.has_earphones || false,
      });
      
      // 이미지 설정
      if (data.images && data.images.length > 0) {
        setImages(data.images.map((img: any) => ({
          id: img.id,
          preview: img.imageUrl
        })));
      }
      
      // 지역 설정
      if (data.regions && data.regions.length > 0) {
        // regions 데이터를 MultiRegionDropdown 형식에 맞게 변환
        const formattedRegions = data.regions.map((region: any) => ({
          id: region.id,
          province: region.full_name?.split(' ')[0] || region.name?.split(' ')[0] || '',
          city: region.full_name?.split(' ')[1] || region.name?.split(' ')[1] || '',
          full_name: region.full_name || region.name,
          name: region.name
        }));
        setSelectedRegions(formattedRegions);
      }
      
    } catch (error) {
      console.error('Failed to fetch phone:', error);
      toast({
        title: '오류',
        description: '상품 정보를 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 필드 수정 가능 여부 체크
  const isFieldEditable = (fieldName: string) => {
    if (!hasOffers) return true;
    return EDITABLE_AFTER_OFFERS.includes(fieldName);
  };

  // 입력 값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // 수정 불가능한 필드는 변경 막기
    if (!isFieldEditable(name)) {
      toast({
        title: '수정 불가',
        description: LOCKED_FIELDS_MESSAGE,
        variant: 'destructive',
      });
      return;
    }
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setIsModified(true);
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // 가격 포맷팅
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    return parseInt(numbers).toLocaleString();
  };

  // 천원 단위로 맞추기
  const roundToThousand = (value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return '0';
    return Math.round(num / 1000) * 1000;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'price' | 'min_offer_price') => {
    if (!isFieldEditable(field)) {
      toast({
        title: '수정 불가',
        description: LOCKED_FIELDS_MESSAGE,
        variant: 'destructive',
      });
      return;
    }

    const value = e.target.value.replace(/[^\d]/g, '');

    // 최대 금액 제한 (990만원)
    if (parseInt(value) > 9900000) {
      toast({
        title: '금액 제한',
        description: '최대 금액은 990만원입니다.',
        variant: 'destructive',
      });
      return;
    }

    // 최소 제안가가 즉시 판매가보다 높을 때 경고
    if (field === 'min_offer_price' && formData.price && parseInt(value) >= parseInt(formData.price)) {
      toast({
        title: '가격 오류',
        description: '최소 제안가는 즉시 판매가보다 낮아야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    setIsModified(true);
  };

  const handlePriceBlur = (field: 'price' | 'min_offer_price') => {
    // 포커스 아웃 시 천원 단위로 자동 조정
    const value = formData[field];
    if (value) {
      const rounded = roundToThousand(value);
      setFormData(prev => ({ ...prev, [field]: rounded.toString() }));
    }
  };

  // 이미지 처리
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isFieldEditable('images')) {
      toast({
        title: '수정 불가',
        description: LOCKED_FIELDS_MESSAGE,
        variant: 'destructive',
      });
      return;
    }
    
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - images.length;

    if (files.length > remainingSlots) {
      toast({
        title: '이미지 제한',
        description: `최대 5장까지만 등록 가능합니다. (${remainingSlots}장 추가 가능)`,
        variant: 'destructive',
      });
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setImages(prev => [...prev, ...newImages]);
    setIsModified(true);
  };

  const removeImage = (index: number) => {
    if (!isFieldEditable('images')) {
      toast({
        title: '수정 불가',
        description: LOCKED_FIELDS_MESSAGE,
        variant: 'destructive',
      });
      return;
    }
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setIsModified(true);
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이미 처리 중이면 중복 실행 방지
    if (submitting) {
      return;
    }

    if (!isModified) {
      toast({
        title: '변경사항 없음',
        description: '수정된 내용이 없습니다.',
      });
      return;
    }
    
    // 유효성 검사
    const newErrors: Record<string, string> = {};
    
    if (!formData.model.trim()) newErrors.model = '모델명을 입력해주세요';
    if (!formData.storage) newErrors.storage = '저장공간을 선택해주세요';
    if (!formData.price) newErrors.price = '즉시 판매가를 입력해주세요';
    if (!formData.min_offer_price) newErrors.min_offer_price = '최소 제안가를 입력해주세요';
    if (!formData.condition_description.trim()) newErrors.condition_description = '제품 상태 및 설명을 입력해주세요';
    if (selectedRegions.length === 0) newErrors.region = '거래 가능 지역을 선택해주세요';
    if (images.length === 0) newErrors.images = '상품 이미지를 등록해주세요';
    
    // 가격 검증
    if (parseInt(formData.price) > 9900000) {
      newErrors.price = '최대 판매 금액은 990만원입니다';
    }
    if (parseInt(formData.min_offer_price) > 9900000) {
      newErrors.min_offer_price = '최대 제안 금액은 990만원입니다';
    }
    if (parseInt(formData.min_offer_price) >= parseInt(formData.price)) {
      newErrors.min_offer_price = '최소 제안가는 즉시 판매가보다 낮아야 합니다';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      toast({
        title: '입력 확인',
        description: newErrors[firstErrorField],
        variant: 'destructive',
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dungjimarket.com';
      const apiUrl = baseUrl.includes('api.dungjimarket.com')
        ? `${baseUrl}/used/phones/${phoneId}/`
        : `${baseUrl}/api/used/phones/${phoneId}/`;
      
      const submitData = new FormData();

      // 수정 가능한 필드만 전송 - 값이 있을 때만 전송
      if (isFieldEditable('model') && formData.model) {
        submitData.append('model', formData.model);
      }
      if (isFieldEditable('storage') && formData.storage) {
        submitData.append('storage', formData.storage);
      }
      if (isFieldEditable('color') && formData.color) {
        submitData.append('color', formData.color);
      }
      if (isFieldEditable('condition_grade') && formData.condition_grade) {
        submitData.append('condition_grade', formData.condition_grade);
      }
      if (isFieldEditable('battery_status') && formData.battery_status) {
        submitData.append('battery_status', formData.battery_status);
      }
      if (isFieldEditable('price') && formData.price) {
        submitData.append('price', formData.price);
      }
      if (isFieldEditable('min_offer_price') && formData.min_offer_price) {
        submitData.append('min_offer_price', formData.min_offer_price);
      }
      if (isFieldEditable('condition_description') && formData.condition_description) {
        submitData.append('condition_description', formData.condition_description);
      }
      if (isFieldEditable('description') && formData.description) {
        submitData.append('description', formData.description);
      }
      if (isFieldEditable('meeting_place') && formData.meeting_place) {
        submitData.append('meeting_place', formData.meeting_place);
      }

      if (isFieldEditable('has_box')) submitData.append('has_box', (formData.has_box || false).toString());
      if (isFieldEditable('has_charger')) submitData.append('has_charger', (formData.has_charger || false).toString());
      if (isFieldEditable('has_earphones')) submitData.append('has_earphones', (formData.has_earphones || false).toString());
      
      // 지역 정보
      if (isFieldEditable('regions')) {
        selectedRegions.forEach((region, index) => {
          if (region?.id) {
            submitData.append(`regions[${index}]`, region.id.toString());
          }
        });
      }
      
      // 새로운 이미지만 전송
      if (isFieldEditable('images')) {
        images.forEach((image, index) => {
          if (image.file) {
            submitData.append('new_images', image.file);
          }
        });
        
        // 기존 이미지 ID 전송 (삭제되지 않은 것들)
        const existingImageIds = images
          .filter(img => img.id)
          .map(img => img.id);
        submitData.append('existing_images', JSON.stringify(existingImageIds));
      }

      // 디버깅용 FormData 내용 출력
      console.log('=== FormData 전송 내용 ===');
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}: ${value}`);
      }
      console.log('========================');

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update error details:', errorData);
        throw new Error(errorData.message || errorData.detail || JSON.stringify(errorData) || 'Failed to update');
      }
      
      toast({
        title: '수정 완료',
        description: hasOffers ? '상품이 수정되었습니다. (수정됨 표시)' : '상품이 수정되었습니다.',
      });

      // 상세 페이지로 이동 (submitting 상태 유지하여 버튼 비활성화 유지)
      router.push(`/used/${phoneId}`);

    } catch (error) {
      console.error('Failed to update phone:', error);
      toast({
        title: '수정 실패',
        description: '상품 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });

      // 오류 발생 시에만 submitting 해제
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <h1 className="text-lg font-semibold">중고폰 수정</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 견적 제안 후 수정 제한 안내 */}
      {hasOffers && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">수정 제한 안내</p>
                <p className="text-sm text-amber-700 mt-1">
                  견적이 제안된 상품입니다. 즉시 판매가와 거래 요청사항만 수정 가능합니다.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  수정 시 구매자에게 "수정됨" 표시가 나타납니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="container mx-auto px-4 py-6 max-w-3xl">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1">
                모델명 <span className="text-red-500">*</span>
                {!isFieldEditable('model') && <Lock className="w-3 h-3 text-gray-400" />}
              </Label>
              <Input
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="예: iPhone 15 Pro Max"
                disabled={!isFieldEditable('model')}
                className={errors.model ? 'border-red-500' : ''}
              />
              {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
              <p className="text-xs text-gray-500 mt-1">{formData.model.length}/50자</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  저장공간 <span className="text-red-500">*</span>
                  {!isFieldEditable('storage') && <Lock className="w-3 h-3 text-gray-400" />}
                </Label>
                <select
                  name="storage"
                  value={formData.storage}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('storage')}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.storage ? 'border-red-500' : 'border-gray-300'
                  } ${!isFieldEditable('storage') ? 'bg-gray-100' : ''}`}
                >
                  <option value="">선택</option>
                  <option value="64">64GB</option>
                  <option value="128">128GB</option>
                  <option value="256">256GB</option>
                  <option value="512">512GB</option>
                  <option value="1024">1TB</option>
                  <option value="other">직접 입력</option>
                </select>
                {errors.storage && <p className="text-xs text-red-500 mt-1">{errors.storage}</p>}
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  색상
                  {!isFieldEditable('color') && <Lock className="w-3 h-3 text-gray-400" />}
                </Label>
                <Input
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="예: 블랙 티타늄"
                  disabled={!isFieldEditable('color')}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.color.length}/30자</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-1">
                  상태 등급 <span className="text-red-500">*</span>
                  {!isFieldEditable('condition_grade') && <Lock className="w-3 h-3 text-gray-400" />}
                </Label>
                <select
                  name="condition_grade"
                  value={formData.condition_grade}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('condition_grade')}
                  className={`w-full px-3 py-2 border rounded-md ${
                    !isFieldEditable('condition_grade') ? 'bg-gray-100' : ''
                  }`}
                >
                  {Object.entries(CONDITION_GRADES).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  <div><span className="font-medium">S급:</span> 사용감 거의 없음, 미세 기스 이하</div>
                  <div><span className="font-medium">A급:</span> 생활기스 있으나 깨끗한 상태</div>
                  <div><span className="font-medium">B급:</span> 사용감 있음, 모서리 찍힘 등</div>
                  <div><span className="font-medium">C급:</span> 사용감 많음, 기능 정상</div>
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  배터리 상태 <span className="text-red-500">*</span>
                  {!isFieldEditable('battery_status') && <Lock className="w-3 h-3 text-gray-400" />}
                </Label>
                <select
                  name="battery_status"
                  value={formData.battery_status}
                  onChange={handleInputChange}
                  disabled={!isFieldEditable('battery_status')}
                  className={`w-full px-3 py-2 border rounded-md ${
                    !isFieldEditable('battery_status') ? 'bg-gray-100' : ''
                  }`}
                >
                  {Object.entries(BATTERY_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
          </div>
        </div>

        {/* 이미지 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            상품 이미지 <span className="text-red-500">*</span>
            {!isFieldEditable('images') && <Lock className="w-3 h-3 text-gray-400" />}
          </h2>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={image.preview}
                  alt={`상품 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {isFieldEditable('images') && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            {images.length < 5 && isFieldEditable('images') && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-600">{images.length}/5</span>
              </button>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
          
          {errors.images && <p className="text-xs text-red-500 mt-2">{errors.images}</p>}
        </div>

        {/* 가격 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">가격 정보</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                즉시 판매가 <span className="text-red-500">*</span>
                {isFieldEditable('price') ? (
                  <span className="text-xs text-green-600 font-normal">수정 가능</span>
                ) : (
                  <Lock className="w-3 h-3 text-gray-400" />
                )}
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={formatCurrency(formData.price)}
                  onChange={(e) => handlePriceChange(e, 'price')}
                  onBlur={() => handlePriceBlur('price')}
                  placeholder="0"
                  disabled={!isFieldEditable('price')}
                  className={`pr-12 ${errors.price ? 'border-red-500' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              <p className="text-xs text-gray-500 mt-1">가격은 천원 단위로 입력 가능합니다</p>
              <p className="text-xs text-gray-500">구매자가 이 금액으로 구매 시 즉시 거래 진행</p>
            </div>

            <div>
              <Label className="flex items-center gap-1">
                최소 제안가 <span className="text-red-500">*</span>
                {!isFieldEditable('min_offer_price') && <Lock className="w-3 h-3 text-gray-400" />}
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={formatCurrency(formData.min_offer_price)}
                  onChange={(e) => handlePriceChange(e, 'min_offer_price')}
                  onBlur={() => handlePriceBlur('min_offer_price')}
                  placeholder="0"
                  disabled={!isFieldEditable('min_offer_price')}
                  className={`pr-12 ${errors.min_offer_price ? 'border-red-500' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
              </div>
              {errors.min_offer_price && <p className="text-xs text-red-500 mt-1">{errors.min_offer_price}</p>}
              <p className="text-xs text-gray-500 mt-1">가격은 천원 단위로 입력 가능합니다 (즉시 판매가보다 낮게)</p>
              <p className="text-xs text-gray-500">구매자가 제안할 수 있는 최소 금액입니다</p>
            </div>

            {/* 가격 정보 표시 */}
            {formData.price && formData.min_offer_price && (
              <div className="bg-gray-50 p-3 rounded-lg mt-4">
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
        </div>

        {/* 구성품 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            구성품
            {!isFieldEditable('has_box') && <Lock className="w-3 h-3 text-gray-400" />}
          </h2>
          
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="has_box"
                checked={formData.has_box}
                onChange={handleInputChange}
                disabled={!isFieldEditable('has_box')}
                className="rounded"
              />
              <span>박스</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="has_charger"
                checked={formData.has_charger}
                onChange={handleInputChange}
                disabled={!isFieldEditable('has_charger')}
                className="rounded"
              />
              <span>충전기</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="has_earphones"
                checked={formData.has_earphones}
                onChange={handleInputChange}
                disabled={!isFieldEditable('has_earphones')}
                className="rounded"
              />
              <span>이어폰</span>
            </label>
          </div>
        </div>

        {/* 상태 및 설명 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            상태 및 설명 <span className="text-red-500">*</span>
            {!isFieldEditable('condition_description') && (
              <span className="text-xs text-gray-500 font-normal flex items-center gap-1">
                <Lock className="w-3 h-3" />
                견적 제안 후 수정 불가
              </span>
            )}
          </h2>
          
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                name="condition_description"
                value={formData.condition_description}
                onChange={(e) => {
                  if (isFieldEditable('condition_description') && e.target.value.length <= 2000) {
                    handleInputChange(e);
                  }
                }}
                placeholder="제품의 상태를 자세히 설명해주세요\n예: 기스, 찍힘, 배터리 성능, 기능 이상 유무 등\n구매자가 제품 상태를 정확히 파악할 수 있도록 작성해주세요"
                rows={6}
                disabled={!isFieldEditable('condition_description')}
                className={`min-h-[150px] resize-y ${
                  !isFieldEditable('condition_description') ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${errors.condition_description ? 'border-red-500' : ''}`}
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
            {errors.condition_description && <p className="text-xs text-red-500">{errors.condition_description}</p>}
          </div>
        </div>

        {/* 거래 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">거래 정보</h2>
          
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-1">
                거래 가능 지역 <span className="text-red-500">*</span>
                {!isFieldEditable('regions') && <Lock className="w-3 h-3 text-gray-400" />}
              </Label>
              {isFieldEditable('regions') ? (
                <MultiRegionDropdown
                  selectedRegions={selectedRegions.map(r => ({
                    province: r.province || r.sido || '',
                    city: r.city || r.sigungu || ''
                  }))}
                  onSelectionChange={(regions) => {
                    setSelectedRegions(regions.map((r: any) => ({
                      ...r,
                      id: r.id,
                      full_name: `${r.province} ${r.city}`.trim(),
                      name: r.city || r.province
                    })));
                    setIsModified(true);
                  }}
                  maxSelections={3}
                />
              ) : (
                <div className="p-3 bg-gray-100 rounded-md">
                  {selectedRegions.map((region, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      {region.full_name || region.name}
                    </div>
                  ))}
                </div>
              )}
              {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                거래 요청사항
                {isFieldEditable('meeting_place') && (
                  <span className="text-xs text-green-600 font-normal">
                    수정 가능
                  </span>
                )}
              </Label>
              <Textarea
                name="meeting_place"
                value={formData.meeting_place}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    handleInputChange(e);
                  }
                }}
                placeholder="거래 시 요청사항이나 선호하는 거래 방식을 입력해주세요.&#10;예: 직거래 선호, 택배 가능, 특정 지하철역 등"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-end">
                <p className="text-xs text-gray-500">{formData.meeting_place.length}/500자</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 - 모바일 최적화 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-[100]">
          <div className="p-4 pb-6">
            <div className="container mx-auto max-w-3xl flex gap-3">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 h-12 text-base font-medium"
              >
                취소
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !isModified}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-medium disabled:opacity-50"
              >
                {submitting ? '수정 중...' : '수정 완료'}
              </Button>
            </div>
          </div>
        </div>

        {/* 하단 여백 */}
        <div className="h-32"></div>
      </form>
    </div>
  );
}