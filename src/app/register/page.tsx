'use client';

import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Upload, Check, X } from 'lucide-react';
import FindAccountModals from '@/components/auth/FindAccountModals';
import Image from 'next/image';

// 지역 데이터 타입
interface Region {
  시도명: string;
  시군구명: string;
}

// Next.js 15에서는 useSearchParams를 사용하는 컴포넌트를 Suspense로 감싼야 함
function RegisterPageContent() {
  const [findModalOpen, setFindModalOpen] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [regions, setRegions] = useState<Region[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  
  const [formData, setFormData] = useState({
    // 공통 필수 필드
    nickname: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'buyer', // 'buyer' or 'seller'
    
    // 선택 필드
    region_province: '',
    region_city: '',
    profile_image: null as File | null,
    
    // 판매자 전용 필드
    business_name: '',
    business_reg_number: '',
    business_address: '',
    is_remote_sales: false,
    business_reg_image: null as File | null,
    
    // 약관 동의
    terms_agreed: false,
    privacy_agreed: false,
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);

  // 지역 데이터 로드
  useEffect(() => {
    fetch('/data/korea_regions.json')
      .then(res => res.json())
      .then(data => {
        setRegions(data);
        // 시도명 중복 제거
        const provinces = [...new Set(data.map((item: Region) => item.시도명))];
        console.log('Loaded provinces:', provinces);
      })
      .catch(err => console.error('Failed to load regions:', err));
  }, []);

  // 시도 선택 시 시군구 필터링
  useEffect(() => {
    if (formData.region_province) {
      const cities = regions
        .filter(r => r.시도명 === formData.region_province)
        .map(r => r.시군구명);
      setFilteredCities([...new Set(cities)]);
    } else {
      setFilteredCities([]);
    }
  }, [formData.region_province, regions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // 닉네임이 변경되면 중복 체크 상태 리셋
      if (name === 'nickname') {
        setNicknameChecked(false);
        setNicknameAvailable(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  // 닉네임 중복 체크
  const checkNickname = async () => {
    if (!formData.nickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-nickname/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: formData.nickname }),
      });

      const data = await response.json();
      setNicknameChecked(true);
      setNicknameAvailable(data.available);
      
      if (!data.available) {
        setError('이미 사용 중인 닉네임입니다.');
      } else {
        setError('');
      }
    } catch (err) {
      setError('닉네임 중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  /**
   * 회원가입 폼 제출 처리 함수
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 유효성 검사
    if (!nicknameChecked || !nicknameAvailable) {
      setError('닉네임 중복 확인을 해주세요.');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    if (!formData.terms_agreed || !formData.privacy_agreed) {
      setError('필수 약관에 동의해주세요.');
      setIsLoading(false);
      return;
    }

    // 판매자인 경우 추가 검증
    if (formData.role === 'seller') {
      if (!formData.business_reg_number || !formData.business_address) {
        setError('판매자는 사업자등록번호와 사업장 주소를 입력해야 합니다.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiUrl = backendUrl.endsWith('/api') 
        ? backendUrl.slice(0, -4)
        : backendUrl;

      // FormData 생성 (파일 업로드를 위해)
      const submitData = new FormData();
      submitData.append('nickname', formData.nickname);
      submitData.append('phone_number', formData.phone.replace(/-/g, ''));
      submitData.append('password', formData.password);
      submitData.append('role', formData.role);
      
      // 선택 필드
      if (formData.region_province && formData.region_city) {
        submitData.append('region', `${formData.region_province} ${formData.region_city}`);
      }
      
      if (formData.profile_image) {
        submitData.append('profile_image', formData.profile_image);
      }
      
      // 판매자 전용 필드
      if (formData.role === 'seller') {
        submitData.append('business_name', formData.business_name || formData.nickname);
        submitData.append('business_reg_number', formData.business_reg_number);
        submitData.append('business_address', formData.business_address);
        submitData.append('is_remote_sales_enabled', formData.is_remote_sales.toString());
        
        if (formData.business_reg_image) {
          submitData.append('business_reg_image', formData.business_reg_image);
        }
      }
      
      // 회원가입 API 호출
      const response = await fetch(`${apiUrl}/api/auth/register/`, {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('회원가입 오류:', errorData);
        throw new Error(errorData.error || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      console.log('회원가입 응답:', data);

      // 회원가입 성공 후 JWT 기반 로그인 진행
      // 닉네임을 username으로 사용
      const loginSuccess = await login(formData.nickname, formData.password);
      
      if (loginSuccess) {
        router.push('/');
      } else {
        throw new Error('자동 로그인에 실패했습니다. 로그인 페이지로 이동합니다.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const provinces = [...new Set(regions.map(r => r.시도명))];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            둥지마켓 회원가입
          </h2>

          {/* 회원 유형 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회원 유형
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'buyer' }))}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.role === 'buyer' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">일반회원</div>
                <div className="text-sm text-gray-500 mt-1">상품 구매 전용</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: 'seller' }))}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  formData.role === 'seller' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">판매회원</div>
                <div className="text-sm text-gray-500 mt-1">상품 판매 가능</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm p-3 rounded bg-red-50">{error}</div>
            )}

            {/* 공통 필수 필드 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
              
              {/* 닉네임 */}
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.role === 'seller' ? '닉네임 또는 상호명' : '닉네임'} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    required
                    className="flex-1 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={formData.role === 'seller' ? '상호명을 입력하세요' : '닉네임을 입력하세요'}
                    value={formData.nickname}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={checkNickname}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    중복확인
                  </button>
                </div>
                {nicknameChecked && (
                  <p className={`text-sm mt-1 ${nicknameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {nicknameAvailable ? '✓ 사용 가능한 닉네임입니다.' : '✗ 이미 사용 중인 닉네임입니다.'}
                  </p>
                )}
              </div>

              {/* 휴대폰 번호 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  휴대폰 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength={13}
                />
                <p className="text-xs text-gray-500 mt-1">본인 인증 및 낙찰 알림 수신용</p>
              </div>

              {/* 비밀번호 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* 활동 지역 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.role === 'seller' ? '사업장 주소지' : '주요 활동지역'} 
                  {formData.role === 'seller' && <span className="text-red-500"> *</span>}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    name="region_province"
                    className="appearance-none rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.region_province}
                    onChange={handleChange}
                    required={formData.role === 'seller'}
                  >
                    <option value="">시/도 선택</option>
                    {provinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                  <select
                    name="region_city"
                    className="appearance-none rounded-md px-3 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.region_city}
                    onChange={handleChange}
                    disabled={!formData.region_province}
                    required={formData.role === 'seller'}
                  >
                    <option value="">시/군/구 선택</option>
                    {filteredCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">예: 경기도 하남시, 서울시 강남구</p>
              </div>

              {/* 프로필 이미지 (선택) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로필 이미지 또는 브랜드 로고
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'profile_image')}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">선택하지 않으면 기본 캐릭터가 자동 부여됩니다</p>
              </div>
            </div>

            {/* 판매자 전용 필드 */}
            {formData.role === 'seller' && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium text-gray-900">사업자 정보</h3>
                
                {/* 사업자등록번호 */}
                <div>
                  <label htmlFor="business_reg_number" className="block text-sm font-medium text-gray-700 mb-1">
                    사업자등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="business_reg_number"
                    name="business_reg_number"
                    type="text"
                    required={formData.role === 'seller'}
                    className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000-00-00000"
                    value={formData.business_reg_number}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">사업자 확인용, 거래 사고 방지를 위한 최소한의 인증절차</p>
                </div>

                {/* 상세 주소 */}
                <div>
                  <label htmlFor="business_address" className="block text-sm font-medium text-gray-700 mb-1">
                    상세 주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="business_address"
                    name="business_address"
                    type="text"
                    required={formData.role === 'seller'}
                    className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="상세 주소를 입력하세요"
                    value={formData.business_address}
                    onChange={handleChange}
                  />
                </div>

                {/* 전국 비대면 거래 */}
                <div className="flex items-start">
                  <input
                    id="is_remote_sales"
                    name="is_remote_sales"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    checked={formData.is_remote_sales}
                    onChange={handleChange}
                  />
                  <label htmlFor="is_remote_sales" className="ml-2">
                    <span className="text-sm font-medium text-gray-700">전국 비대면 거래 인증 영업소</span>
                    <p className="text-xs text-gray-500">체크 시 별도 인증 절차를 통해 비대면 판매자 권한이 부여됩니다.</p>
                  </label>
                </div>

                {/* 사업자등록증 업로드 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자등록증 업로드
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'business_reg_image')}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ※ JPG/PNG 형식의 파일만 업로드 가능 (최대 2MB)<br/>
                    ※ 인증된 판매자는 전국 단위 공구 입찰이 가능합니다.
                  </p>
                </div>
              </div>
            )}

            {/* 약관 동의 */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-lg font-medium text-gray-900">약관 동의</h3>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="terms_agreed"
                    name="terms_agreed"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.terms_agreed}
                    onChange={handleChange}
                  />
                  <label htmlFor="terms_agreed" className="ml-2 text-sm text-gray-700">
                    <span className="text-red-500">*</span> 이용약관에 동의합니다
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="privacy_agreed"
                    name="privacy_agreed"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={formData.privacy_agreed}
                    onChange={handleChange}
                  />
                  <label htmlFor="privacy_agreed" className="ml-2 text-sm text-gray-700">
                    <span className="text-red-500">*</span> 개인정보 수집 및 이용에 동의합니다
                  </label>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 처리중...
                  </>
                ) : (
                  '회원가입'
                )}
              </button>
            </div>

            {/* 로그인 링크 */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                이미 회원이신가요?{' '}
                <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  로그인하기
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Suspense를 사용하여 컴포넌트 래핑
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>}>
      <RegisterPageContent />
    </Suspense>
  );
}