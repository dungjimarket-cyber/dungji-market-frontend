'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Check, Building2, User, MapPin, Phone, Mail, FileText, Image as ImageIcon } from 'lucide-react';
import { fetchCategories } from '@/lib/api/localBusiness';
import { getRegions, Region } from '@/lib/api/regionService';
import { registerExpert, ExpertProfileCreate } from '@/lib/api/expertService';
import { LocalBusinessCategory } from '@/types/localBusiness';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';

function ExpertRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { toast } = useToast();

  // URL 파라미터에서 카테고리 ID 가져오기
  const categoryIdParam = searchParams.get('category');

  const [categories, setCategories] = useState<LocalBusinessCategory[]>([]);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: 카테고리 선택, 2: 정보 입력

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

  // 시/군/구 목록 로드 (시/도 선택 시)
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

  // 카테고리 ID가 있으면 바로 2단계로
  useEffect(() => {
    if (categoryIdParam && formData.category_id) {
      setStep(2);
    }
  }, [categoryIdParam, formData.category_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategorySelect = (categoryId: number) => {
    setFormData(prev => ({ ...prev, category_id: categoryId }));
    setStep(2);
  };

  const handleAddRegion = () => {
    if (!formData.selectedCity) {
      toast({
        title: '지역 선택',
        description: '시/군/구를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.region_codes.includes(formData.selectedCity)) {
      toast({
        title: '중복 지역',
        description: '이미 추가된 지역입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.region_codes.length >= 5) {
      toast({
        title: '지역 제한',
        description: '최대 5개 지역까지 선택 가능합니다.',
        variant: 'destructive',
      });
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
    // 시/도 + 시/군/구 이름 찾기
    for (const province of provinces) {
      if (province.code === code) {
        return province.full_name;
      }
    }
    // cities에서 찾기
    const city = cities.find(c => c.code === code);
    if (city) {
      return city.full_name;
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
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
        tagline: formData.tagline || undefined,
        introduction: formData.introduction || undefined,
      };

      const result = await registerExpert(submitData, accessToken);

      if (result.success) {
        toast({
          title: '전문가 등록 완료',
          description: result.message,
        });
        router.push('/expert/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.error('전문가 등록 오류:', err);
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

  if (!isAuthenticated) {
    return null;
  }

  const selectedCategory = categories.find(c => c.id === formData.category_id);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => step === 2 ? setStep(1) : router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm">뒤로가기</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900">전문가 등록</h1>
          <p className="text-gray-600 mt-1">
            전문가로 등록하여 상담 요청을 받아보세요
          </p>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">업종 선택</span>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">정보 입력</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {/* 스텝 1: 카테고리 선택 */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">어떤 분야의 전문가이신가요?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`p-4 border-2 rounded-xl text-center transition-all hover:shadow-md ${
                      formData.category_id === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <div className="font-medium text-gray-900 text-sm">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 스텝 2: 정보 입력 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 선택된 카테고리 표시 */}
              {selectedCategory && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCategory.icon}</span>
                    <div>
                      <div className="font-medium text-blue-900">{selectedCategory.name}</div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        변경하기
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  기본 정보
                </h3>

                {/* 대표자명 */}
                <div>
                  <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700 mb-1">
                    대표자명 / 닉네임 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representative_name"
                    name="representative_name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    사업자입니다 (사업자등록번호가 있습니다)
                  </label>
                </div>

                {/* 사업자 정보 */}
                {formData.is_business && (
                  <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                    <div>
                      <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-1">
                        상호명
                      </label>
                      <input
                        id="business_name"
                        name="business_name"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="사업자등록증상 상호명"
                        value={formData.business_name}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="business_number" className="block text-sm font-medium text-gray-700 mb-1">
                        사업자등록번호
                      </label>
                      <input
                        id="business_number"
                        name="business_number"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="000-00-00000"
                        value={formData.business_number}
                        onChange={handleBusinessNumberChange}
                        maxLength={12}
                      />
                    </div>
                  </div>
                )}

                {/* 자격증/면허 번호 (선택) */}
                <div>
                  <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1">
                    자격증/면허 번호 <span className="text-gray-500">(선택)</span>
                  </label>
                  <input
                    id="license_number"
                    name="license_number"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="관련 자격증이 있다면 번호를 입력하세요"
                    value={formData.license_number}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 영업 지역 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  영업 가능 지역 <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-600">최대 5개 지역까지 선택 가능합니다.</p>

                <div className="flex gap-2">
                  <select
                    name="selectedProvince"
                    value={formData.selectedProvince}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">시/도 선택</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>

                  <select
                    name="selectedCity"
                    value={formData.selectedCity}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.selectedProvince}
                  >
                    <option value="">시/군/구 선택</option>
                    {cities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddRegion}
                    disabled={!formData.selectedCity}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    추가
                  </button>
                </div>

                {/* 선택된 지역 목록 */}
                {formData.region_codes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.region_codes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {getRegionName(code)}
                        <button
                          type="button"
                          onClick={() => handleRemoveRegion(code)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 연락처 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  연락처
                </h3>

                <div>
                  <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-0000-0000"
                    value={formData.contact_phone}
                    onChange={handlePhoneChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">고객과 연결 시 공개됩니다.</p>
                </div>

                <div>
                  <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-gray-500">(선택)</span>
                  </label>
                  <input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="example@email.com"
                    value={formData.contact_email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 소개 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  소개
                </h3>

                <div>
                  <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-1">
                    한 줄 소개 <span className="text-gray-500">(선택)</span>
                  </label>
                  <input
                    id="tagline"
                    name="tagline"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: 10년 경력의 인테리어 전문가"
                    value={formData.tagline}
                    onChange={handleChange}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="introduction" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 소개 <span className="text-gray-500">(선택)</span>
                  </label>
                  <textarea
                    id="introduction"
                    name="introduction"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="경력, 전문 분야, 서비스 특징 등을 자유롭게 작성해주세요."
                    value={formData.introduction}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 안내 사항 */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">안내 사항</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• 전문가 등록 후 바로 상담 요청을 받을 수 있습니다.</li>
                  <li>• 연락처는 고객과 연결된 후에만 공개됩니다.</li>
                  <li>• 허위 정보 등록 시 서비스 이용이 제한될 수 있습니다.</li>
                </ul>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          )}
        </div>
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
