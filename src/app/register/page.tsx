'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { scrollToInputField } from '@/hooks/useMobileKeyboard';
import { Loader2, Mail } from 'lucide-react';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import RegionDropdown from '@/components/address/RegionDropdown';
// import { sendVerificationCode, verifyCode } from '@/lib/api/phoneVerification';
// import { useToast } from '@/components/ui/use-toast'; // 휴대폰 인증 기능 임시 비활성화
import { WelcomeModal } from '@/components/auth/WelcomeModal';

// 회원가입 타입 정의
type SignupType = 'email' | 'social';

// 회원가입 컨텐츠 컴포넌트
function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  // const { toast } = useToast(); // 휴대폰 인증 기능 임시 비활성화
  const errorRef = useRef<HTMLDivElement>(null);
  const nicknameRef = useRef<HTMLDivElement>(null);
  
  // URL 파라미터로 소셜 로그인 정보 받기
  const socialProvider = searchParams.get('provider');
  const socialEmail = searchParams.get('email');
  const socialId = searchParams.get('socialId');
  
  const [signupType, setSignupType] = useState<SignupType>(socialProvider ? 'social' : 'email');
  const [formData, setFormData] = useState({
    // 공통 필수 필드
    email: socialEmail || '', // 이메일 로그인인 경우 아이디로 사용
    nickname: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'buyer', // 'buyer' or 'seller'
    
    // 선택 필드
    region_province: '',
    region_city: '',
    
    // 판매자 전용 필드
    business_name: '',
    business_reg_number: '',
    is_remote_sales: false,
    business_reg_image: null as File | null,
    
    // 약관 동의
    terms_agreed: false,
    privacy_agreed: false,
    marketing_agreed: false,
    
    // 소셜 로그인 정보
    social_provider: socialProvider || '',
    social_id: socialId || '',
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  // const [phoneVerified] = useState(false); // 휴대폰 인증 기능 임시 비활성화
  // const [verificationCode] = useState(''); // 휴대폰 인증 기능 임시 비활성화
  // const [showVerificationInput] = useState(false); // 휴대폰 인증 기능 임시 비활성화
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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
      // 이메일이 변경되면 중복 체크 상태 리셋
      if (name === 'email') {
        setEmailChecked(false);
        setEmailAvailable(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, business_reg_image: file }));
  };

  // 이메일 중복 체크
  const checkEmail = async () => {
    if (!formData.email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      setEmailChecked(true);
      setEmailAvailable(data.available);
      
      if (!data.available) {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('');
      }
    } catch (err) {
      setError('이메일 중복 확인 중 오류가 발생했습니다.');
    }
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
        // 모바일 친화적인 스크롤 및 포커스
        scrollToInputField(nicknameRef.current);
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
    // 휴대폰 인증 기능 임시 비활성화
  };
  
  // 사업자등록번호 포맷팅
  const formatBusinessRegNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };
  
  const handleBusinessRegNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatBusinessRegNumber(e.target.value);
    setFormData(prev => ({ ...prev, business_reg_number: formatted }));
  };

  // 휴대폰 인증 기능 임시 비활성화 - 사용하지 않는 함수들 주석 처리
  // const requestPhoneVerification = async () => { ... };
  // const verifyPhone = async () => { ... };

  // 지역 선택 핸들러
  const handleRegionSelect = (province: string, city: string) => {
      setFormData(prev => ({
        ...prev,
        region_province: province,
        region_city: city,
      }));
  };

  // 회원가입 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 필수 필드 검사
    if (!formData.nickname) {
      setError('닉네임을 입력해주세요.');
      setIsLoading(false);
      scrollToInputField(nicknameRef.current);
      return;
    }

    if (!formData.phone) {
      setError('휴대폰 번호를 입력해주세요.');
      setIsLoading(false);
      const phoneInput = document.getElementById('phone');
      scrollToInputField(phoneInput);
      return;
    }

    // 유효성 검사
    if (!nicknameChecked || !nicknameAvailable) {
      setError('닉네임 중복 확인을 해주세요.');
      setIsLoading(false);
      scrollToInputField(nicknameRef.current);
      return;
    }

    // 이메일 로그인인 경우 이메일 중복 확인 필요
    if (signupType === 'email' && (!emailChecked || !emailAvailable)) {
      setError('이메일 중복 확인을 해주세요.');
      setIsLoading(false);
      const emailSection = document.getElementById('email-section');
      scrollToInputField(emailSection);
      return;
    }

    // 전화번호 인증 기능 임시 비활성화
    // if (!phoneVerified) {
    //   setError('휴대폰 인증을 완료해주세요.');
    //   setIsLoading(false);
    //   return;
    // }

    // 이메일 로그인인 경우 비밀번호 확인
    if (signupType === 'email') {
      if (formData.password.length < 6) {
        setError('비밀번호는 6자 이상이어야 합니다.');
        setIsLoading(false);
        const passwordInput = document.getElementById('password');
        scrollToInputField(passwordInput);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        setIsLoading(false);
        const confirmPasswordInput = document.getElementById('confirmPassword');
        scrollToInputField(confirmPasswordInput);
        return;
      }
    }

    if (!formData.terms_agreed || !formData.privacy_agreed) {
      setError('필수 약관에 동의해주세요.');
      setIsLoading(false);
      const termsSection = document.getElementById('terms-section');
      scrollToInputField(termsSection);
      return;
    }

    // 판매자인 경우 추가 검증
    if (formData.role === 'seller') {
      if (!formData.business_reg_number) {
        setError('사업자등록번호를 입력해주세요.');
        setIsLoading(false);
        const businessRegInput = document.getElementById('business_reg_number');
        scrollToInputField(businessRegInput);
        return;
      }
      
      // 판매자는 사업장 주소 필수
      if (!formData.region_province || !formData.region_city) {
        setError('사업장 주소를 선택해주세요.');
        setIsLoading(false);
        const regionSection = document.querySelector('[data-region-dropdown]');
        scrollToInputField(regionSection as HTMLElement);
        return;
      }
    }

    try {
      const submitData = new FormData();
      
      // 공통 필드
      submitData.append('nickname', formData.nickname);
      submitData.append('phone_number', formData.phone.replace(/-/g, ''));
      submitData.append('role', formData.role);
      submitData.append('marketing_agreed', formData.marketing_agreed.toString());
      
      // 이메일 로그인인 경우
      if (signupType === 'email') {
        submitData.append('email', formData.email);
        submitData.append('username', formData.email); // 이메일을 username으로 사용
        submitData.append('password', formData.password);
      } else {
        // 소셜 로그인인 경우
        submitData.append('social_provider', formData.social_provider);
        submitData.append('social_id', formData.social_id);
        if (formData.email) {
          submitData.append('email', formData.email);
        }
      }
      
      // 선택 필드 - address_region_id 처리
      if (formData.region_province && formData.region_city) {
        try {
          // 모든 지역 데이터 가져오기
          const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/`);
          const regionsData = await regionsResponse.json();
          
          // 시/군/구 레벨에서 일치하는 지역 찾기
          let cityRegion;
          
          if (formData.region_province === '세종특별자치시') {
            // 세종시는 특별한 처리 필요
            cityRegion = regionsData.find((r: any) => 
              r.level === 1 && 
              r.name === '세종특별자치시' &&
              r.full_name === '세종특별자치시'
            );
          } else {
            // 일반적인 시/도의 경우
            cityRegion = regionsData.find((r: any) => 
              (r.level === 1 || r.level === 2) && 
              r.name === formData.region_city && 
              r.full_name.includes(formData.region_province)
            );
          }
          
          if (cityRegion) {
            submitData.append('address_region_id', cityRegion.code);
          }
        } catch (err) {
          console.error('지역 정보 로드 오류:', err);
          // 지역 정보를 가져올 수 없는 경우 그냥 진행
        }
      }
      
      // 판매자 전용 필드
      if (formData.role === 'seller') {
        submitData.append('business_name', formData.business_name || formData.nickname);
        submitData.append('business_reg_number', formData.business_reg_number);
        submitData.append('is_remote_sales_enabled', formData.is_remote_sales.toString());
        
        // 사업장 주소 추가 - 시/도와 시/군/구를 합쳐서 전송
        if (formData.region_province && formData.region_city) {
          const businessAddress = `${formData.region_province} ${formData.region_city}`;
          submitData.append('business_address', businessAddress);
        }
        
        if (formData.is_remote_sales && formData.business_reg_image) {
          submitData.append('business_reg_image', formData.business_reg_image);
        }
      }
      
      // API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register/`, {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || '회원가입에 실패했습니다.');
      }

      await response.json();
      
      // 회원가입 성공 후 처리
      if (signupType === 'email') {
        // 이메일 로그인인 경우 자동 로그인
        const loginResult = await login(formData.email, formData.password);
        if (loginResult.success) {
          // 환영 모달 표시
          setShowWelcomeModal(true);
        } else {
          router.push('/login?registered=true');
        }
      } else {
        // 소셜 로그인인 경우도 환영 모달 표시
        setShowWelcomeModal(true);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            둥지마켓 회원가입
          </h2>

          {/* 회원가입 방식 선택 (소셜 로그인이 아닌 경우에만 표시) */}
          {!socialProvider && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSignupType('email')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    signupType === 'email' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Mail className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">이메일로 가입</div>
                  <div className="text-sm text-gray-500 mt-1">이메일/비밀번호 사용</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupType('social')}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    signupType === 'social' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="w-6 h-6 mx-auto mb-2 text-2xl">💬</div>
                  <div className="font-semibold">간편 가입</div>
                  <div className="text-sm text-gray-500 mt-1">카카오톡으로 가입</div>
                </button>
              </div>
            </div>
          )}

          {/* 소셜 로그인 버튼 (소셜 가입 선택 시) */}
          {signupType === 'social' && !socialProvider && (
            <div className="mb-6">
              {/* 카카오톡 간편가입 약관 동의 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">(주)둥지마켓 약관 동의</h3>
                
                <div className="space-y-2">
                  {/* 전체 동의 체크박스 */}
                  <div className="flex items-center pb-2 border-b">
                    <input
                      type="checkbox"
                      id="all_agreed_social"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={formData.terms_agreed && formData.privacy_agreed && formData.marketing_agreed}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          terms_agreed: isChecked,
                          privacy_agreed: isChecked,
                          marketing_agreed: isChecked
                        }));
                      }}
                    />
                    <label htmlFor="all_agreed_social" className="ml-2 text-sm font-medium text-gray-900">
                      전체 약관에 동의합니다
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="terms_agreed_social"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={formData.terms_agreed}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms_agreed: e.target.checked }))}
                    />
                    <label htmlFor="terms_agreed_social" className="ml-2 text-sm text-gray-700">
                      <span className="text-red-500">*</span> (필수) <a href="/terms/general" target="_blank" className="underline text-blue-600 hover:text-blue-800">이용약관</a>에 동의합니다
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="privacy_agreed_social"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={formData.privacy_agreed}
                      onChange={(e) => setFormData(prev => ({ ...prev, privacy_agreed: e.target.checked }))}
                    />
                    <label htmlFor="privacy_agreed_social" className="ml-2 text-sm text-gray-700">
                      <span className="text-red-500">*</span> (필수) <a href="/terms/general#privacy" target="_blank" className="underline text-blue-600 hover:text-blue-800">개인정보 수집 및 이용</a>에 동의합니다
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="marketing_agreed_social"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={formData.marketing_agreed}
                      onChange={(e) => setFormData(prev => ({ ...prev, marketing_agreed: e.target.checked }))}
                    />
                    <label htmlFor="marketing_agreed_social" className="ml-2 text-sm text-gray-700">
                      (선택) 마케팅 정보 수신에 동의합니다
                    </label>
                  </div>
                </div>
              </div>
              
              <SocialLoginButtons 
                requireTermsAgreement={true}
                termsAgreed={formData.terms_agreed}
                privacyAgreed={formData.privacy_agreed}
              />
            </div>
          )}

          {/* 회원가입 폼 (이메일 가입 또는 소셜 정보가 있는 경우) */}
          {(signupType === 'email' || socialProvider) && (
            <>
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
                  <div ref={errorRef} className="text-red-500 text-sm p-3 rounded bg-red-50 border border-red-300 flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* 공통 필수 필드 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">기본 정보</h3>
                  
                  {/* 이메일 (이메일 로그인인 경우만) */}
                  {signupType === 'email' && (
                    <div id="email-section">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        아이디(이메일) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          className="flex-1 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          onClick={checkEmail}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          중복확인
                        </button>
                      </div>
                      {emailChecked && (
                        <p className={`text-sm mt-1 ${emailAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {emailAvailable ? '✓ 사용 가능한 이메일입니다.' : '✗ 이미 사용 중인 이메일입니다.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 비밀번호 (이메일 로그인인 경우만) */}
                  {signupType === 'email' && (
                    <>
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
                          placeholder="6자 이상 입력하세요"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>

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
                    </>
                  )}

                  {/* 닉네임 */}
                  <div ref={nicknameRef}>
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
                      <div className={`mt-2 p-2 rounded-md ${nicknameAvailable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`text-sm flex items-center gap-2 ${nicknameAvailable ? 'text-green-700' : 'text-red-700'}`}>
                          {nicknameAvailable ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span>사용 가능한 닉네임입니다.</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.</span>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 휴대폰 번호 - 인증 기능 임시 제거 */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      휴대폰 번호 <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="w-full appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      maxLength={13}
                    />
                    <p className="text-xs text-gray-500 mt-1">본인 인증 및 낙찰 알림 수신용</p>
                  </div>

                  {/* 주요 활동지역 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.role === 'seller' ? '사업장 주소 / 영업활동지역' : '주요 활동지역'} {formData.role === 'seller' ? <span className="text-red-500">*</span> : '(선택)'}
                    </label>
                    <div data-region-dropdown>
                      <RegionDropdown
                        selectedProvince={formData.region_province}
                        selectedCity={formData.region_city}
                        onSelect={(province, city) => handleRegionSelect(province, city)}
                        required={formData.role === 'seller'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      예: 경기도 하남시, 서울시 강남구, 강원도 양양군
                    </p>
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
                        onChange={handleBusinessRegNumberChange}
                        maxLength={12}
                      />
                      <p className="text-xs text-gray-500 mt-1">사업자 확인용, 거래 사고 방지를 위한 최소한의 인증절차</p>
                    </div>

                    {/* 비대면 판매가능 영업소 인증 */}
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
                        <span className="text-sm font-medium text-gray-700">비대면 판매가능 영업소 인증</span>
                        <p className="text-xs text-gray-500">체크 시 별도 인증 절차를 통해 비대면 판매자 권한이 부여됩니다.</p>
                      </label>
                    </div>

                    {/* 사업자등록증 업로드 (비대면 인증 체크시) */}
                    {formData.is_remote_sales && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          사업자등록증 업로드
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          ※ JPG/PNG 형식의 파일만 업로드 가능 (최대 2MB)<br/>
                          ※ 인증절차를 위한 서류 확인이 필요합니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 약관 동의 */}
                <div id="terms-section" className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900">약관 동의</h3>
                  
                  <div className="space-y-2">
                    {/* 전체 동의 체크박스 */}
                    <div className="flex items-center pb-2 border-b">
                      <input
                        id="all_agreed"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.terms_agreed && formData.privacy_agreed && formData.marketing_agreed}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            terms_agreed: isChecked,
                            privacy_agreed: isChecked,
                            marketing_agreed: isChecked
                          }));
                        }}
                      />
                      <label htmlFor="all_agreed" className="ml-2 text-sm font-medium text-gray-900">
                        전체 약관에 동의합니다
                      </label>
                    </div>
                    
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
                        <span className="text-red-500">*</span> (필수) <a href="/terms/general" target="_blank" className="underline text-blue-600 hover:text-blue-800">이용약관</a>에 동의합니다
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
                        <span className="text-red-500">*</span> (필수) <a href="/terms/general#privacy" target="_blank" className="underline text-blue-600 hover:text-blue-800">개인정보 수집 및 이용</a>에 동의합니다
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="marketing_agreed"
                        name="marketing_agreed"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={formData.marketing_agreed}
                        onChange={handleChange}
                      />
                      <label htmlFor="marketing_agreed" className="ml-2 text-sm text-gray-700">
                        (선택) 마케팅 정보 수신에 동의합니다
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
            </>
          )}
        </div>
      </div>
      
      {/* 환영 모달 */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userRole={formData.role as 'buyer' | 'seller'}
      />
    </div>
  );
}

// Suspense를 사용하여 컴포넌트 래핑
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}