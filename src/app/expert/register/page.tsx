'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Briefcase, User, MapPin, Phone, FileText, Image as ImageIcon } from 'lucide-react';
import { fetchCategories } from '@/lib/api/localBusiness';
import { getRegions, Region } from '@/lib/api/regionService';
import { registerExpert, ExpertProfileCreate, uploadExpertProfileImage } from '@/lib/api/expertService';
import { LocalBusinessCategory } from '@/types/localBusiness';
import { useToast } from '@/components/ui/use-toast';

function ExpertRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { toast } = useToast();

  const categoryIdParam = searchParams.get('category');

  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');

  const [formData, setFormData] = useState<{
    category_id: number | null;
    representative_name: string;
    is_business: boolean;
    business_name: string;
    business_number: string;
    license_number: string;
    region_codes: string[];
    contact_phone: string;
    contact_email: string;
    tagline: string;
    introduction: string;
    selectedProvince: string;
    selectedCity: string;
  }>({
    category_id: categoryIdParam ? parseInt(categoryIdParam) : null,
    representative_name: '',
    is_business: false,
    business_name: '',
    business_number: '',
    license_number: '',
    region_codes: [],
    contact_phone: '',
    contact_email: '',
    tagline: '',
    introduction: '',
    selectedProvince: '',
    selectedCity: '',
  });

  // 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error('카테고리 로드 오류:', err);
      } finally {
        setIsFetchingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // 시/도 목록 로드
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getRegions({ level: 0 });
        setProvinces(data);
      } catch (err) {
        console.error('시/도 로드 오류:', err);
      }
    };
    loadProvinces();
  }, []);

  // 시/군/구 목록 로드
  useEffect(() => {
    const loadCities = async () => {
      if (!formData.selectedProvince) {
        setCities([]);
        return;
      }
      try {
        const data = await getRegions({ parent_code: formData.selectedProvince });
        setCities(data);
      } catch (err) {
        console.error('시/군/구 로드 오류:', err);
      }
    };
    loadCities();
  }, [formData.selectedProvince]);

  // 인증되지 않은 사용자 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/expert/register');
    }
  }, [authLoading, isAuthenticated, router]);

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact_phone: user.phone_number || '',
        contact_email: user.email || '',
        representative_name: user.nickname || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddRegion = () => {
    if (!formData.selectedCity) {
      toast({ title: '지역 선택', description: '시/군/구를 선택해주세요.', variant: 'destructive' });
      return;
    }
    if (formData.region_codes.includes(formData.selectedCity)) {
      toast({ title: '중복 지역', description: '이미 추가된 지역입니다.', variant: 'destructive' });
      return;
    }
    if (formData.region_codes.length >= 5) {
      toast({ title: '지역 제한', description: '최대 5개 지역까지 선택 가능합니다.', variant: 'destructive' });
      return;
    }
    setFormData(prev => ({
      ...prev,
      region_codes: [...prev.region_codes, prev.selectedCity],
      selectedProvince: '',
      selectedCity: '',
    }));
  };

  const handleRemoveRegion = (code: string) => {
    setFormData(prev => ({
      ...prev,
      region_codes: prev.region_codes.filter(c => c !== code),
    }));
  };

  const getRegionName = (code: string) => {
    for (const province of provinces) {
      if (province.code === code) return province.full_name;
    }
    const city = cities.find(c => c.code === code);
    if (city) return city.full_name;
    return code;
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, contact_phone: formatted }));
  };

  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessNumber(e.target.value);
    setFormData(prev => ({ ...prev, business_number: formatted }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '파일 크기 초과', description: '이미지는 5MB 이하여야 합니다.', variant: 'destructive' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: '지원하지 않는 형식', description: 'JPG, PNG, GIF, WEBP 형식만 지원됩니다.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setProfileImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    if (!accessToken) {
      toast({ title: '로그인 필요', description: '로그인 후 이미지를 업로드할 수 있습니다.', variant: 'destructive' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const result = await uploadExpertProfileImage(file, accessToken);
      if (result.success && result.image_url) {
        setProfileImageUrl(result.image_url);
        toast({ title: '업로드 완료', description: '프로필 이미지가 업로드되었습니다.' });
      } else {
        setProfileImagePreview(null);
        toast({ title: '업로드 실패', description: result.message, variant: 'destructive' });
      }
    } catch (err) {
      setProfileImagePreview(null);
      toast({ title: '업로드 실패', description: '이미지 업로드 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProfileImagePreview(null);
    setProfileImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.category_id) {
      setError('업종을 선택해주세요.');
      return;
    }
    if (!formData.representative_name) {
      setError('대표자명(또는 닉네임)을 입력해주세요.');
      return;
    }
    if (formData.region_codes.length === 0) {
      setError('영업 가능 지역을 최소 1개 이상 선택해주세요.');
      return;
    }
    if (!formData.contact_phone) {
      setError('연락처를 입력해주세요.');
      return;
    }
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const submitData: ExpertProfileCreate = {
        category_id: formData.category_id,
        representative_name: formData.representative_name,
        is_business: formData.is_business,
        business_name: formData.is_business ? formData.business_name : undefined,
        business_number: formData.is_business ? formData.business_number.replace(/-/g, '') : undefined,
        license_number: formData.license_number || undefined,
        region_codes: formData.region_codes,
        contact_phone: formData.contact_phone.replace(/-/g, ''),
        contact_email: formData.contact_email || undefined,
        profile_image: profileImageUrl || undefined,
        tagline: formData.tagline || undefined,
        introduction: formData.introduction || undefined,
      };

      const result = await registerExpert(submitData, accessToken);

      if (result.success) {
        toast({ title: '전문가 등록 완료', description: result.message });
        router.push('/expert/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || '전문가 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isFetchingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm">뒤로가기</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">전문가 회원가입</h1>
              <p className="text-sm text-gray-500">둥지마켓 전문가로 등록하세요</p>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 업종 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전문 분야 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category_id: category.id }))}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${
                    formData.category_id === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <div className="font-medium text-gray-900 text-xs">{category.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 프로필 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              프로필 이미지 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                {profileImagePreview ? (
                  <>
                    <img src={profileImagePreview} alt="프로필" className="w-full h-full object-cover" />
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <label className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
                  {isUploadingImage ? '업로드 중...' : '선택'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
                {profileImagePreview && (
                  <button type="button" onClick={handleRemoveImage} className="ml-2 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
                    삭제
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">JPG, PNG / 최대 5MB</p>
              </div>
            </div>
          </div>

          {/* 대표자명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대표자명 / 닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              name="representative_name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="고객에게 표시될 이름"
              value={formData.representative_name}
              onChange={handleChange}
            />
          </div>

          {/* 사업자 여부 */}
          <div className="flex items-center">
            <input
              id="is_business"
              name="is_business"
              type="checkbox"
              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              checked={formData.is_business}
              onChange={handleChange}
            />
            <label htmlFor="is_business" className="ml-2 text-sm text-gray-700">
              사업자입니다
            </label>
          </div>

          {/* 사업자 정보 */}
          {formData.is_business && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상호명</label>
                <input
                  name="business_name"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="사업자등록증상 상호명"
                  value={formData.business_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사업자등록번호</label>
                <input
                  name="business_number"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="000-00-00000"
                  value={formData.business_number}
                  onChange={handleBusinessNumberChange}
                  maxLength={12}
                />
              </div>
            </div>
          )}

          {/* 영업 지역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              영업 가능 지역 <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(최대 5개)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <select
                name="selectedProvince"
                value={formData.selectedProvince}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">시/도</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>{province.name}</option>
                ))}
              </select>
              <select
                name="selectedCity"
                value={formData.selectedCity}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={!formData.selectedProvince}
              >
                <option value="">시/군/구</option>
                {cities.map((city) => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddRegion}
                disabled={!formData.selectedCity}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                추가
              </button>
            </div>
            {formData.region_codes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.region_codes.map((code) => (
                  <span key={code} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {getRegionName(code)}
                    <button type="button" onClick={() => handleRemoveRegion(code)} className="text-blue-600 hover:text-blue-800">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              name="contact_phone"
              type="tel"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="010-0000-0000"
              value={formData.contact_phone}
              onChange={handlePhoneChange}
            />
            <p className="text-xs text-gray-500 mt-1">고객과 연결 시 공개됩니다</p>
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              name="contact_email"
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="example@email.com"
              value={formData.contact_email}
              onChange={handleChange}
            />
          </div>

          {/* 한 줄 소개 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              한 줄 소개 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              name="tagline"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="예: 10년 경력의 인테리어 전문가"
              value={formData.tagline}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          {/* 상세 소개 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상세 소개 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea
              name="introduction"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
              placeholder="경력, 전문 분야 등"
              value={formData.introduction}
              onChange={handleChange}
            />
          </div>

          {/* 안내 */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
            <p>• 등록 후 바로 상담 요청을 받을 수 있습니다</p>
            <p>• 연락처는 고객과 연결된 후에만 공개됩니다</p>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                등록 중...
              </>
            ) : (
              '전문가 등록하기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ExpertRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ExpertRegisterContent />
    </Suspense>
  );
}
