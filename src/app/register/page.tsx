'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { scrollToInputField } from '@/hooks/useMobileKeyboard';
import { Loader2, Mail } from 'lucide-react';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import RegionDropdown from '@/components/address/RegionDropdown';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import { useToast } from '@/components/ui/use-toast';
import { WelcomeModal } from '@/components/auth/WelcomeModal';
import { verifyBusinessNumberForRegistration, type BusinessVerificationRegistrationResult } from '@/lib/api/businessVerification';
import { trackSignupConversion } from '@/lib/gtag';
import { fetchCategories } from '@/lib/api/localBusiness';
import { LocalBusinessCategory } from '@/types/localBusiness';

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
  
  // URL 파라미터에서 memberType 가져오기
  const memberTypeParam = searchParams.get('memberType') as 'buyer' | 'seller' | 'expert' | null;
  const [memberType, setMemberType] = useState<'buyer' | 'seller' | 'expert' | null>(memberTypeParam);
  const [signupType, setSignupType] = useState<SignupType | null>(socialProvider ? 'social' : null);
  
  // 이메일 도메인 추출
  const extractEmailDomain = (email: string) => {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[1] || '';
  };
  
  const initialEmailDomain = socialEmail ? extractEmailDomain(socialEmail) : '';
  const isCommonDomain = ['naver.com', 'gmail.com', 'daum.net', 'nate.com', 'kakao.com', 'hanmail.net', 'hotmail.com'].includes(initialEmailDomain);
  
  const [formData, setFormData] = useState({
    // 공통 필수 필드
    username: '', // 아이디
    email: socialEmail || '', // 이메일
    emailDomain: isCommonDomain ? initialEmailDomain : (initialEmailDomain ? 'direct' : ''), // 이메일 도메인 (선택된 경우)
    customEmailDomain: isCommonDomain ? '' : initialEmailDomain, // 직접 입력 도메인
    nickname: '',
    phone: '',
    phoneVerified: false,
    password: '',
    confirmPassword: '',
    role: memberTypeParam || 'buyer', // 'buyer' or 'seller' or 'expert'

    // 선택 필드
    region_province: '',
    region_city: '',

    // 판매자 전용 필드
    business_name: '',
    business_reg_number: '',
    representative_name: '',
    seller_category: '',
    is_remote_sales: false,
    business_reg_image: null as File | null,
    referral_code: '', // 추천인 코드

    // 전문가 전용 필드
    expert_category_id: null as number | null, // 전문가 업종 ID
    expert_is_business: false, // 전문가 사업자 여부
    
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
  const [usernameChecked, setUsernameChecked] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  // const [phoneVerified] = useState(false); // 휴대폰 인증 기능 임시 비활성화
  // const [verificationCode] = useState(''); // 휴대폰 인증 기능 임시 비활성화
  // const [showVerificationInput] = useState(false); // 휴대폰 인증 기능 임시 비활성화
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [businessVerified, setBusinessVerified] = useState(false);
  const [businessVerificationResult, setBusinessVerificationResult] = useState<BusinessVerificationRegistrationResult | null>(null);
  const [businessVerificationLoading, setBusinessVerificationLoading] = useState(false);
  const [kakaoInfo, setKakaoInfo] = useState<any>(null);
  const [referralCodeChecked, setReferralCodeChecked] = useState(false);
  const [referralCodeValid, setReferralCodeValid] = useState(false);
  const [referralCodeChecking, setReferralCodeChecking] = useState(false);
  const [referrerName, setReferrerName] = useState('');

  // 전문가 업종 카테고리
  const [expertCategories, setExpertCategories] = useState<LocalBusinessCategory[]>([]);

  // 전문가 업종 선택 확인 모달
  const [showCategoryConfirmModal, setShowCategoryConfirmModal] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null);

  // 전문가 업종 카테고리 로드 (원본 카테고리 10개)
  useEffect(() => {
    const loadExpertCategories = async () => {
      try {
        // raw=true로 통합 없이 원본 카테고리 10개 가져오기
        const data = await fetchCategories(true);
        setExpertCategories(data);
      } catch (err) {
        console.error('전문가 업종 카테고리 로드 오류:', err);
      }
    };
    loadExpertCategories();
  }, []);

  // 카카오 정보 읽기
  useEffect(() => {
    const isFromKakao = searchParams.get('from') === 'kakao';
    const urlReferralCode = searchParams.get('referral_code'); // URL에서 추천인 코드 읽기
    
    if (isFromKakao) {
      // 쿠키에서 카카오 정보 읽기
      const cookies = document.cookie.split(';');
      const kakaoTempCookie = cookies.find(c => c.trim().startsWith('kakao_temp_info='));
      
      if (kakaoTempCookie) {
        try {
          const kakaoData = JSON.parse(decodeURIComponent(kakaoTempCookie.split('=')[1]));
          setKakaoInfo(kakaoData);
          setSignupType('social');
          
          // 이메일 정보 설정
          if (kakaoData.email && !kakaoData.email.includes('@kakao.user')) {
            const domain = extractEmailDomain(kakaoData.email);
            const isCommonDomain = ['naver.com', 'gmail.com', 'daum.net', 'nate.com', 'kakao.com', 'hanmail.net', 'hotmail.com'].includes(domain);
            
            setFormData(prev => ({
              ...prev,
              email: kakaoData.email.split('@')[0] || '',
              emailDomain: isCommonDomain ? domain : (domain ? 'direct' : ''),
              customEmailDomain: isCommonDomain ? '' : domain,
              social_provider: 'kakao',
              social_id: kakaoData.sns_id,
              // 추천인 코드 설정 (URL 파라미터 우선, 없으면 쿠키에서)
              referral_code: urlReferralCode || kakaoData.referral_code || prev.referral_code
            }));
            
            console.log('🎟️ [회원가입] 카카오 가입 추천인 코드 복원:', {
              from_url: urlReferralCode,
              from_cookie: kakaoData.referral_code,
              final: urlReferralCode || kakaoData.referral_code || ''
            });
          }
          
          // 쿠키 삭제
          document.cookie = 'kakao_temp_info=; path=/; max-age=0';
        } catch (error) {
          console.error('카카오 정보 파싱 오류:', error);
        }
      }
    }
  }, [searchParams]);

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
      // 아이디가 변경되면 중복 체크 상태 리셋
      if (name === 'username') {
        setUsernameChecked(false);
        setUsernameAvailable(false);
      }
      // 이메일이 변경되면 중복 체크 상태 리셋
      if (name === 'email') {
        setEmailChecked(false);
        setEmailAvailable(false);
      }
      
      // 사업자등록번호가 변경되면 검증 상태 리셋
      if (name === 'business_reg_number') {
        setBusinessVerified(false);
        setBusinessVerificationResult(null);
      }
      
      // 추천인 코드가 변경되면 검증 상태 리셋
      if (name === 'referral_code') {
        setReferralCodeChecked(false);
        setReferralCodeValid(false);
        setReferrerName('');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, business_reg_image: file }));
  };

  // 아이디 중복 체크
  const checkUsername = async () => {
    if (!formData.username) {
      setError('아이디를 입력해주세요.');
      return;
    }

    // 아이디 형식 검증 (영문, 숫자, _, - 만 허용, 4-20자)
    const usernameRegex = /^[a-zA-Z0-9_-]{4,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('아이디는 4-20자의 영문, 숫자, _, -만 사용할 수 있습니다.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-username/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: formData.username }),
      });

      const data = await response.json();
      setUsernameChecked(true);
      setUsernameAvailable(data.available);
      
      if (!data.available) {
        setError('이미 사용 중인 아이디입니다.');
      } else {
        setError('');
      }
    } catch (err) {
      setError('아이디 중복 확인 중 오류가 발생했습니다.');
    }
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
    setError(''); // 이전 에러 메시지 초기화
    
    if (!formData.nickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    // 닉네임 길이 체크 (2-15자, 당근마켓 기준)
    if (formData.nickname.length < 2 || formData.nickname.length > 15) {
      setNicknameChecked(true);
      setNicknameAvailable(false);
      return;
    }

    // 공백 체크
    if (formData.nickname.includes(' ')) {
      setNicknameChecked(true);
      setNicknameAvailable(false);
      return;
    }
    
    // 특수문자 및 이모티콘 체크 (당근마켓 기준: 한글, 영문, 숫자만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9]+$/;
    if (!nicknameRegex.test(formData.nickname)) {
      setNicknameChecked(true);
      setNicknameAvailable(false);
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
        // 모바일 친화적인 스크롤 및 포커스
        scrollToInputField(nicknameRef.current);
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

  // PhoneVerification 컴포넌트 사용으로 불필요
  // const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const formatted = formatPhoneNumber(e.target.value);
  //   setFormData(prev => ({ ...prev, phone: formatted }));
  // };
  
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
    
    // 사업자등록번호가 변경되면 검증 상태 리셋
    setBusinessVerified(false);
    setBusinessVerificationResult(null);
  };

  // 사업자등록번호 검증
  const verifyBusinessNumber = async () => {
    if (!formData.business_reg_number) {
      setError('사업자등록번호를 입력해주세요.');
      return;
    }

    setBusinessVerificationLoading(true);
    setError('');

    try {
      const result = await verifyBusinessNumberForRegistration(
        formData.business_reg_number,
        formData.username
      );

      setBusinessVerificationResult(result);

      if (result.verified && result.valid) {
        setBusinessVerified(true);
        setError('');
      } else {
        setBusinessVerified(false);
        // 중복 체크 에러인 경우 특별 처리
        if (result.is_duplicate) {
          setError('⚠️ ' + (result.message || '이미 등록된 사업자등록번호입니다. 동일한 사업자번호로는 하나의 계정만 생성할 수 있습니다.'));
        } else {
          setError(result.message || result.error || '사업자등록번호 검증에 실패했습니다.');
        }
      }
    } catch (err: any) {
      console.error('사업자등록번호 검증 오류:', err);
      setBusinessVerified(false);
      setBusinessVerificationResult(null);
      setError('사업자등록번호 검증 중 오류가 발생했습니다.');
    } finally {
      setBusinessVerificationLoading(false);
    }
  };

  // 추천인 코드 검증
  const checkReferralCode = async () => {
    if (!formData.referral_code) {
      setError('추천인 코드를 입력해주세요.');
      return;
    }

    setReferralCodeChecking(true);
    setError('');

    try {
      // 추천인 코드 유효성 검증 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-referral-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referral_code: formData.referral_code }),
      });

      const data = await response.json();
      
      if (response.ok && data.valid) {
        setReferralCodeChecked(true);
        setReferralCodeValid(true);
        setReferrerName(data.referrer_name || '');
        setError('');
      } else {
        setReferralCodeChecked(true);
        setReferralCodeValid(false);
        setReferrerName('');
        setError(data.error || '유효하지 않은 추천인 코드입니다.');
      }
    } catch (err) {
      console.error('추천인 코드 검증 오류:', err);
      setReferralCodeChecked(true);
      setReferralCodeValid(false);
      setError('추천인 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setReferralCodeChecking(false);
    }
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
      const phoneSection = document.querySelector('[data-phone-verification]') as HTMLElement;
      scrollToInputField(phoneSection);
      return;
    }

    if (!formData.phoneVerified) {
      setError('휴대폰 인증을 완료해주세요.');
      setIsLoading(false);
      const phoneSection = document.querySelector('[data-phone-verification]') as HTMLElement;
      scrollToInputField(phoneSection);
      return;
    }

    // 유효성 검사
    if (!nicknameChecked || !nicknameAvailable) {
      setError('닉네임 중복 확인을 해주세요.');
      setIsLoading(false);
      scrollToInputField(nicknameRef.current);
      return;
    }

    // 이메일 로그인인 경우 아이디와 이메일 중복 확인 필요
    if (signupType === 'email') {
      if (!usernameChecked || !usernameAvailable) {
        setError('아이디 중복 확인을 해주세요.');
        setIsLoading(false);
        const usernameSection = document.getElementById('username-section');
        scrollToInputField(usernameSection);
        return;
      }
      
      // 이메일이 입력된 경우에만 중복 확인 필요
      if (formData.email && formData.email.includes('@')) {
        if (!emailChecked || !emailAvailable) {
          setError('이메일 중복 확인을 해주세요.');
          setIsLoading(false);
          const emailSection = document.getElementById('email-section');
          scrollToInputField(emailSection);
          return;
        }
      }
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
      
      if (!formData.representative_name) {
        setError('대표자명을 입력해주세요.');
        setIsLoading(false);
        const representativeNameInput = document.getElementById('representative_name');
        scrollToInputField(representativeNameInput);
        return;
      }
      
      if (!businessVerified) {
        setError('사업자등록번호 유효성 검사를 완료해주세요.');
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

    // 전문가인 경우 추가 검증
    if (formData.role === 'expert') {
      if (!formData.expert_category_id) {
        setError('전문 분야를 선택해주세요.');
        setIsLoading(false);
        return;
      }

      // 전문가도 활동지역 필수
      if (!formData.region_province || !formData.region_city) {
        setError('활동 지역을 선택해주세요.');
        setIsLoading(false);
        const regionSection = document.querySelector('[data-region-dropdown]');
        scrollToInputField(regionSection as HTMLElement);
        return;
      }
    }

    try {
      // 카카오 가입인 경우 특별 처리
      if (kakaoInfo && formData.social_provider === 'kakao') {
        // 카카오 SNS 로그인 API 호출
        const kakaoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sns-login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sns_id: kakaoInfo.sns_id,
            sns_type: 'kakao',
            email: kakaoInfo.email,
            name: formData.nickname || kakaoInfo.name,
            profile_image: kakaoInfo.profile_image,
            role: formData.role, // buyer or seller
          }),
        });

        if (!kakaoResponse.ok) {
          const errorData = await kakaoResponse.json();
          throw new Error(errorData.error || errorData.detail || '카카오 회원가입에 실패했습니다.');
        }

        const kakaoData = await kakaoResponse.json();
        
        // JWT 토큰 저장
        if (kakaoData.jwt?.access) {
          localStorage.setItem('accessToken', kakaoData.jwt.access);
          if (kakaoData.jwt.refresh) {
            localStorage.setItem('refreshToken', kakaoData.jwt.refresh);
          }
          
          // 추가 정보 업데이트 (전화번호, 지역 등)
          if (formData.phone || formData.region_city) {
            const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${kakaoData.jwt.access}`,
              },
              body: JSON.stringify({
                phone_number: formData.phone,
                address_region_id: formData.region_city || formData.region_province,
              }),
            });
            
            if (!updateResponse.ok) {
              console.error('프로필 업데이트 실패');
            }
          }
          
          // 판매자인 경우 추가 정보 업데이트
          if (formData.role === 'seller' && formData.business_reg_number) {
            const sellerUpdateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile/`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${kakaoData.jwt.access}`,
              },
              body: JSON.stringify({
                business_reg_number: formData.business_reg_number,
                representative_name: formData.representative_name,
              }),
            });

            if (!sellerUpdateResponse.ok) {
              console.error('판매자 정보 업데이트 실패');
            }
          }

          // 전문가인 경우 전문가 프로필 생성
          if (formData.role === 'expert' && formData.expert_category_id) {
            const expertCreateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expert/register/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${kakaoData.jwt.access}`,
              },
              body: JSON.stringify({
                category_id: formData.expert_category_id,
                representative_name: formData.nickname,
                is_business: formData.expert_is_business,
                business_number: formData.expert_is_business ? formData.business_reg_number?.replace(/-/g, '') : undefined,
                region_codes: formData.region_city ? [formData.region_city] : [],
                contact_phone: formData.phone?.replace(/-/g, ''),
              }),
            });

            if (!expertCreateResponse.ok) {
              console.error('전문가 프로필 생성 실패');
            }
          }

          // 환영 모달 표시
          setShowWelcomeModal(true);
        }
        
        return;
      }
      
      // 기존 회원가입 처리 (이메일 가입)
      const submitData = new FormData();
      
      // 공통 필드
      submitData.append('nickname', formData.nickname);
      submitData.append('phone_number', formData.phone.replace(/-/g, ''));
      submitData.append('role', formData.role);
      submitData.append('marketing_agreed', formData.marketing_agreed.toString());
      
      // 추천인 코드 (판매자만, 아이디 가입시에만) - 유효성 검증 API 완료 후 활성화 예정
      // if (formData.referral_code && formData.role === 'seller' && signupType === 'email') {
      //   // 추천인 코드가 입력되었지만 검증되지 않은 경우
      //   if (!referralCodeChecked) {
      //     setError('추천인 코드 확인을 해주세요.');
      //     setIsLoading(false);
      //     const referralSection = document.getElementById('referral_code');
      //     scrollToInputField(referralSection);
      //     return;
      //   }
      //   // 추천인 코드가 유효하지 않은 경우
      //   if (!referralCodeValid) {
      //     setError('유효한 추천인 코드를 입력해주세요.');
      //     setIsLoading(false);
      //     const referralSection = document.getElementById('referral_code');
      //     scrollToInputField(referralSection);
      //     return;
      //   }
      //   submitData.append('referral_code', formData.referral_code);
      // }
      
      // 임시로 추천인 코드를 검증 없이 전달 (선택사항이므로)
      if (formData.referral_code && formData.role === 'seller' && signupType === 'email') {
        submitData.append('referral_code', formData.referral_code);
      }
      
      // 이메일 로그인인 경우
      if (signupType === 'email') {
        submitData.append('username', formData.username); // 아이디
        // 이메일이 완전한 형태로 입력된 경우에만 전송 (@를 포함하는 경우)
        if (formData.email && formData.email.includes('@')) {
          submitData.append('email', formData.email);
        }
        submitData.append('password', formData.password);
      } else {
        // 소셜 로그인인 경우
        submitData.append('social_provider', formData.social_provider);
        submitData.append('social_id', formData.social_id);
        if (formData.email) {
          submitData.append('email', formData.email);
        }
      }
      
      // 선택 필드 - address_region_id 처리 (일반회원도 지역 선택 시 저장됨)
      // 세팅페이지와 동일한 방식: 이름으로 API에서 지역 코드 검색
      if (formData.region_province && formData.region_city) {
        try {
          const regionsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/regions/?limit=1000`);
          const regionsJson = await regionsResponse.json();
          const regionsData = regionsJson?.results || regionsJson;

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
            console.log('지역 정보 저장됨:', {
              code: cityRegion.code,
              province: formData.region_province,
              city: formData.region_city
            });
          } else {
            console.warn('지역을 찾을 수 없음:', { province: formData.region_province, city: formData.region_city });
          }
        } catch (error) {
          console.error('지역 정보 검색 오류:', error);
        }
      }
      
      // 판매자 전용 필드
      if (formData.role === 'seller') {
        submitData.append('business_name', formData.business_name || formData.nickname);
        submitData.append('business_reg_number', formData.business_reg_number);
        submitData.append('representative_name', formData.representative_name);
        submitData.append('seller_category', formData.seller_category);
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

      // 전문가 전용 필드
      if (formData.role === 'expert') {
        if (formData.expert_category_id) {
          submitData.append('expert_category_id', formData.expert_category_id.toString());
        }
        submitData.append('expert_is_business', formData.expert_is_business.toString());
        if (formData.expert_is_business && formData.business_reg_number) {
          submitData.append('business_reg_number', formData.business_reg_number);
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

      const userData = await response.json();
      
      // Google Ads 전환 이벤트 트리거
      trackSignupConversion(userData.id || formData.username);
      
      // 회원가입 성공 후 처리
      if (signupType === 'email') {
        // 이메일 로그인인 경우 자동 로그인
        const loginResult = await login(formData.username, formData.password);
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
          {/* 카카오 로그인에서 온 경우 안내 메시지 */}
          {kakaoInfo && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800">카카오 계정 연동 회원가입</h3>
                  <p className="mt-1 text-xs text-yellow-700">
                    카카오 계정으로 간편하게 가입하실 수 있습니다. 회원 유형을 선택하고 추가 정보를 입력해주세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 회원 유형 선택 (소셜 로그인이 아닌 경우에만 표시) */}
          {!socialProvider && !memberType && (
            <div className="mb-6">
              {/* 로고와 텍스트 */}
              <div className="flex flex-col items-center gap-2 mb-8">
                <Image
                  src="/logos/dungji_logo.jpg"
                  alt="둥지마켓"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg"
                />
                <h2 className="text-xl font-bold text-gray-900">
                  둥지마켓
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6">
                {/* 개인회원 & 사업자회원 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMemberType('buyer');
                      setFormData(prev => ({ ...prev, role: 'buyer' }));
                    }}
                    className="group relative p-5 sm:p-6 border-2 rounded-2xl text-center transition-all hover:shadow-lg border-gray-200 hover:border-blue-400 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="font-bold text-sm sm:text-base mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                      일반회원
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 space-y-1 leading-tight">
                      <div>공동구매 개설·참여</div>
                      <div>상담신청·중고거래</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMemberType('seller');
                      setFormData(prev => ({ ...prev, role: 'seller' }));
                    }}
                    className="group relative p-5 sm:p-6 border-2 rounded-2xl text-center transition-all hover:shadow-lg border-gray-200 hover:border-orange-400 bg-gradient-to-br from-white to-gray-50"
                  >
                    <div className="font-bold text-sm sm:text-base mb-2 text-sky-500 group-hover:text-sky-600 transition-colors">
                      일반사업자
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 space-y-1 leading-tight">
                      <div>온·오프라인 도소매 판매업</div>
                    </div>
                  </button>
                </div>

                {/* 전문가회원 */}
                <button
                  type="button"
                  onClick={() => {
                    setMemberType('expert');
                    setFormData(prev => ({ ...prev, role: 'expert' }));
                  }}
                  className="w-full p-4 sm:p-5 border-2 rounded-2xl border-gray-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-400 hover:shadow-lg transition-all text-left"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base text-blue-700">전문가 회원</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">고객과 상담이 필요한 서비스 전문가</div>
                    </div>
                  </div>

                  {/* 10개 업종 나열 */}
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">💼</div>
                      <div className="text-[9px] text-gray-700 font-medium">회계사</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">💼</div>
                      <div className="text-[9px] text-gray-700 font-medium">세무사</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">📋</div>
                      <div className="text-[9px] text-gray-700 font-medium">법무사</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">⚖️</div>
                      <div className="text-[9px] text-gray-700 font-medium">변호사</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">🏠</div>
                      <div className="text-[9px] text-gray-700 font-medium">공인중개사</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">🛠️</div>
                      <div className="text-[9px] text-gray-700 font-medium">인테리어</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">📱</div>
                      <div className="text-[9px] text-gray-700 font-medium">휴대폰</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">🔧</div>
                      <div className="text-[9px] text-gray-700 font-medium">자동차정비</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">🧹</div>
                      <div className="text-[9px] text-gray-700 font-medium">청소</div>
                    </div>
                    <div className="text-center py-1.5 bg-white rounded-lg border border-gray-200">
                      <div className="text-base">🚚</div>
                      <div className="text-[9px] text-gray-700 font-medium">이사</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-blue-600 text-center font-medium">
                    클릭하여 전문가 회원가입 →
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 회원가입 방식 선택 (일반회원과 판매회원) */}
          {!socialProvider && memberType && signupType === null && (
            <div className="space-y-6">
              {/* 뒤로가기 버튼 */}
              <button
                onClick={() => setMemberType(null)}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">뒤로가기</span>
              </button>
              
              {/* 제목 */}
              <h2 className="text-2xl font-bold text-gray-900 text-center">둥지마켓 회원가입</h2>
              
              {/* 회원가입 방식 선택 카드 - 모바일에서도 가로 정렬 */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 카카오톡 간편가입 카드 - 왼쪽 */}
                <button
                  type="button"
                  onClick={() => setSignupType('social')}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 text-center transition-all hover:border-yellow-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                  {/* 아이콘 컨테이너 */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl bg-[#FEE500] flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="#3C1E1E" viewBox="0 0 24 24">
                      <path d="M12 3c-5.52 0-10 3.36-10 7.5 0 2.65 1.84 4.98 4.61 6.31-.2.72-.73 2.62-.76 2.78-.04.2.07.35.24.35.14 0 .29-.09.47-.26l2.94-2.51c.78.13 1.62.2 2.5.2 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
                    </svg>
                  </div>
                  
                  {/* 카드 제목 */}
                  <div className="font-bold text-base sm:text-lg text-gray-900 mb-2 leading-tight">
                    카카오톡<br/>
                    간편가입
                  </div>
                  
                  {/* 카드 설명 */}
                  <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    3초 만에 간편하게<br/>
                    가입
                  </div>
                </button>
                
                {/* 아이디/비밀번호 가입 카드 - 오른쪽 */}
                <button
                  type="button"
                  onClick={() => setSignupType('email')}
                  className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 text-center transition-all hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                  {/* 아이콘 컨테이너 */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  
                  {/* 카드 제목 */}
                  <div className="font-bold text-base sm:text-lg text-gray-900 mb-2 leading-tight">
                    아이디/비밀번호<br/>
                    회원가입
                  </div>
                  
                  {/* 카드 설명 */}
                  <div className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    아이디와 비밀번호로<br/>
                    가입
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 소셜 로그인 버튼 (소셜 가입 선택 시) */}
          {signupType === 'social' && !socialProvider && (
            <div className="mb-6">
              {/* 카카오톡 간편가입 약관 동의 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  (주)둥지마켓 약관 동의 {memberType === 'seller' && <span className="text-blue-600">(판매회원)</span>}
                </h3>
                
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
                      <span className="text-red-500">*</span> (필수) <a href={memberType === 'seller' ? "/terms/seller" : "/terms/general"} target="_blank" className="underline text-blue-600 hover:text-blue-800">{memberType === 'seller' ? '판매회원 이용약관' : '이용약관'}</a>에 동의합니다
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
                
                {/* 판매회원 카카오 가입 안내 및 추천인 코드 */}
                {memberType === 'seller' && (
                  <>
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <span>📋</span>
                        <span>판매회원 가입 안내</span>
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-2">
                        <li className="flex items-start">
                          <span className="inline-block mt-0.5 mr-2">•</span>
                          <span>카카오톡으로 간편하게 가입하신 후, 마이페이지에서 추가 정보를 입력해주세요</span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block mt-0.5 mr-2">•</span>
                          <span>견적 제안을 위해서는 사업자등록번호 인증 등이 완료되어야 합니다</span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block mt-0.5 mr-2">•</span>
                          <span>닉네임은 카카오톡 프로필명으로 자동 설정됩니다</span>
                        </li>
                      </ul>
                    </div>
                    
                  </>
                )}
              </div>
              
              <SocialLoginButtons 
                requireTermsAgreement={true}
                termsAgreed={formData.terms_agreed}
                privacyAgreed={formData.privacy_agreed}
                memberType={memberType || undefined}
                isSignup={true}
              />
            </div>
          )}

          {/* 회원가입 폼 (이메일 가입 또는 소셜 정보가 있는 경우) */}
          {((memberType && signupType === 'email') || socialProvider) && (
            <>
              {/* 뒤로가기 버튼 (판매회원인 경우) */}
              {memberType === 'seller' && !socialProvider && (
                <button
                  onClick={() => {
                    setMemberType(null);
                    setSignupType('email');
                  }}
                  className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  뒤로가기
                </button>
              )}
              
              {/* 카카오톡 로그인 버튼 (소셜 가입 선택 시) */}
              {signupType === 'social' && (
                <button
                  type="button"
                  onClick={() => {
                    // role과 추천인 코드 정보를 포함한 카카오 로그인 시작
                    console.log('🚀 [회원가입] 카카오 로그인 버튼 클릭');
                    console.log('📝 [회원가입] 현재 추천인 코드:', formData.referral_code);
                    console.log('👤 [회원가입] 회원 타입:', memberType);
                    
                    const stateData = { 
                      role: memberType, 
                      referral_code: formData.referral_code || '', 
                      callbackUrl: '/register' 
                    };
                    
                    const stateString = JSON.stringify(stateData);
                    console.log('📦 [회원가입] state 데이터:', stateData);
                    console.log('🔤 [회원가입] state JSON 문자열:', stateString);
                    console.log('🔐 [회원가입] state 인코딩:', encodeURIComponent(stateString));
                    
                    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'a197177aee0ddaf6b827a6225aa48653'}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/kakao')}&response_type=code&state=${encodeURIComponent(stateString)}`;
                    console.log('🔗 [회원가입] 최종 카카오 URL:', kakaoAuthUrl);
                    window.location.href = kakaoAuthUrl;
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium rounded-lg transition-colors"
                >
                  <Image
                    src="/images/kakao-logo.png"
                    alt="Kakao"
                    width={20}
                    height={20}
                  />
                  카카오톡으로 시작하기
                </button>
              )}

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
                  
                  {/* 아이디 (이메일 로그인인 경우만) */}
                  {signupType === 'email' && (
                    <>
                      <div id="username-section">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                          아이디 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="flex-1 min-w-0 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="영문, 숫자 4-20자"
                            value={formData.username}
                            onChange={handleChange}
                          />
                          <button
                            type="button"
                            onClick={checkUsername}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
                          >
                            중복확인
                          </button>
                        </div>
                        {usernameChecked && (
                          <p className={`text-sm mt-1 ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {usernameAvailable ? '✓ 사용 가능한 아이디입니다.' : '✗ 이미 사용 중인 아이디입니다.'}
                          </p>
                        )}
                      </div>

                      <div id="email-section">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          이메일 <span className="text-gray-500">(선택)</span>
                        </label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              id="email"
                              name="email"
                              type="text"
                              className="w-28 sm:flex-1 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="이메일 입력"
                              value={formData.email.split('@')[0] || ''}
                              onChange={(e) => {
                                const emailPrefix = e.target.value;
                                let fullEmail = emailPrefix;
                                if (formData.emailDomain === 'direct' && formData.customEmailDomain) {
                                  fullEmail = emailPrefix + '@' + formData.customEmailDomain;
                                } else if (formData.emailDomain && formData.emailDomain !== 'direct') {
                                  fullEmail = emailPrefix + '@' + formData.emailDomain;
                                }
                                setFormData(prev => ({ ...prev, email: fullEmail }));
                                setEmailChecked(false);
                                setEmailAvailable(false);
                              }}
                            />
                            <span className="flex items-center text-gray-700">@</span>
                            <select
                              id="emailDomain"
                              name="emailDomain"
                              value={formData.emailDomain}
                              onChange={(e) => {
                                const domain = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  emailDomain: domain,
                                  email: domain === 'direct' ? prev.email.split('@')[0] || '' : (prev.email.split('@')[0] || '') + '@' + domain
                                }));
                                setEmailChecked(false);
                                setEmailAvailable(false);
                              }}
                              className="min-w-0 w-24 sm:w-auto appearance-none rounded-md px-2 py-2 border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">선택</option>
                              <option value="naver.com">naver.com</option>
                              <option value="gmail.com">gmail.com</option>
                              <option value="daum.net">daum.net</option>
                              <option value="nate.com">nate.com</option>
                              <option value="kakao.com">kakao.com</option>
                              <option value="hanmail.net">hanmail.net</option>
                              <option value="hotmail.com">hotmail.com</option>
                              <option value="direct">직접입력</option>
                            </select>
                          </div>
                          {formData.emailDomain === 'direct' && (
                            <input
                              id="customEmailDomain"
                              name="customEmailDomain"
                              type="text"
                              placeholder="도메인 입력 (예: company.co.kr)"
                              value={formData.customEmailDomain}
                              onChange={(e) => {
                                const customDomain = e.target.value;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  customEmailDomain: customDomain,
                                  email: (prev.email.split('@')[0] || '') + (customDomain ? '@' + customDomain : '')
                                }));
                                setEmailChecked(false);
                                setEmailAvailable(false);
                              }}
                              className="w-full appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          )}
                          {formData.email && formData.email.includes('@') && (
                            <button
                              type="button"
                              onClick={checkEmail}
                              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                            >
                              중복확인
                            </button>
                          )}
                        </div>
                        {emailChecked && (
                          <p className={`text-sm mt-1 ${emailAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {emailAvailable ? '✓ 사용 가능한 이메일입니다.' : '✗ 이미 사용 중인 이메일입니다.'}
                          </p>
                        )}
                      </div>
                    </>
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
                    <div className="flex gap-2 items-center">
                      <input
                        id="nickname"
                        name="nickname"
                        type="text"
                        required
                        className="flex-1 min-w-0 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={formData.role === 'seller' ? '상호명 (2-15자)' : '닉네임 (2-15자)'}
                        value={formData.nickname}
                        onChange={handleChange}
                        maxLength={15}
                      />
                      <button
                        type="button"
                        onClick={checkNickname}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap flex-shrink-0"
                      >
                        중복확인
                      </button>
                    </div>
                    {nicknameChecked && (
                      <div className={`mt-2 p-2 rounded-md ${nicknameAvailable ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className={`text-sm flex items-center gap-2 ${nicknameAvailable ? 'text-blue-700' : 'text-red-700'}`}>
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
                              <span className="font-medium">
                                {formData.nickname.length < 2 || formData.nickname.length > 15 
                                  ? '닉네임은 2자 이상 15자 이하로 입력해주세요.'
                                  : formData.nickname.includes(' ')
                                  ? '닉네임에 공백을 포함할 수 없습니다.'
                                  : !(/^[가-힣a-zA-Z0-9]+$/.test(formData.nickname))
                                  ? '닉네임은 한글, 영문, 숫자만 사용 가능합니다.'
                                  : '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 휴대폰 번호 인증 */}
                  <div data-phone-verification>
                    <PhoneVerification
                      purpose="signup"
                      onVerified={(phoneNumber) => {
                        setFormData(prev => ({ ...prev, phone: phoneNumber, phoneVerified: true }));
                      }}
                      defaultValue={formData.phone}
                    />
                  </div>

                  {/* 주요 활동지역 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.role === 'seller' ? '사업장 주소 / 영업활동지역' : formData.role === 'expert' ? '활동 지역' : '주요 활동지역'} {(formData.role === 'seller' || formData.role === 'expert') ? <span className="text-red-500">*</span> : '(선택)'}
                    </label>
                    <div data-region-dropdown>
                      <RegionDropdown
                        selectedProvince={formData.region_province}
                        selectedCity={formData.region_city}
                        onSelect={handleRegionSelect}
                        required={formData.role === 'seller' || formData.role === 'expert'}
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
                    
                    {/* 사업자유형 */}
                    <div>
                      <label htmlFor="seller_category" className="block text-sm font-medium text-gray-700 mb-1">
                        사업자유형 <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="seller_category"
                        name="seller_category"
                        required={formData.role === 'seller'}
                        className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.seller_category}
                        onChange={handleChange}
                      >
                        <option value="">사업자 유형을 선택해주세요</option>
                        <option value="individual">개인사업자</option>
                        <option value="corporate">법인사업자</option>
                      </select>
                    </div>
                    
                    {/* 사업자등록번호 */}
                    <div>
                      <label htmlFor="business_reg_number" className="block text-sm font-medium text-gray-700 mb-1">
                        사업자등록번호 <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          id="business_reg_number"
                          name="business_reg_number"
                          type="text"
                          required={formData.role === 'seller'}
                          className="flex-1 min-w-0 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="000-00-00000"
                          value={formData.business_reg_number}
                          onChange={handleBusinessRegNumberChange}
                          maxLength={12}
                        />
                        <button
                          type="button"
                          onClick={verifyBusinessNumber}
                          disabled={businessVerificationLoading}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
                        >
                          {businessVerificationLoading ? '검증중...' : '유효성검사'}
                        </button>
                      </div>
                      {businessVerificationResult && (
                        <div className={`mt-2 p-2 rounded-md ${businessVerified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`text-sm flex items-center gap-2 ${businessVerified ? 'text-green-700' : 'text-red-700'}`}>
                            {businessVerified ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">인증완료: {businessVerificationResult.message}</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">인증실패: {businessVerificationResult.message || businessVerificationResult.error}</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">사업자 등록번호는 판매자 신뢰도 확보 및 거래 안전을 위해 수집됩니다</p>
                    </div>
                    
                    {/* 대표자명 */}
                    <div>
                      <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700 mb-1">
                        사업자등록증상 대표자명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="representative_name"
                        name="representative_name"
                        type="text"
                        required={formData.role === 'seller'}
                        className="appearance-none rounded-md w-full px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="대표자명을 입력하세요"
                        value={formData.representative_name}
                        onChange={handleChange}
                      />
                      <p className="text-xs text-gray-500 mt-1">사업자등록증에 기재된 대표자명과 동일하게 입력해주세요</p>
                    </div>

                    {/* 비대면 판매가능 영업소 인증 (통신/렌탈만) */}
                    {(formData.seller_category === 'telecom' || formData.seller_category === 'rental') && (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {/* 추천인 코드 (통신/렌탈 사업자만) */}
                {formData.role === 'seller' && signupType === 'email' && (formData.seller_category === 'telecom' || formData.seller_category === 'rental') && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label htmlFor="referral_code" className="block text-sm font-medium text-gray-700 mb-1">
                        추천인 코드 <span className="text-gray-500">(선택)</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="referral_code"
                          name="referral_code"
                          type="text"
                          className="flex-1 appearance-none rounded-md px-3 py-2 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="추천인 코드를 입력하세요"
                          value={formData.referral_code}
                          onChange={handleChange}
                        />
                        <button
                          type="button"
                          onClick={checkReferralCode}
                          disabled={referralCodeChecking || !formData.referral_code}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {referralCodeChecking ? '확인중...' : '확인'}
                        </button>
                      </div>
                      {referralCodeChecked && (
                        <div className={`mt-2 p-2 rounded-md ${referralCodeValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`text-sm flex items-center gap-2 ${referralCodeValid ? 'text-green-700' : 'text-red-700'}`}>
                            {referralCodeValid ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>유효한 추천인 코드입니다{referrerName && ` (추천인: ${referrerName})`}</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>유효하지 않은 추천인 코드입니다. 다시 확인해주세요.</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        추천인 코드가 없으시면 가입 후 마이페이지에서도 입력 가능합니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* 전문가 전용 필드 */}
                {formData.role === 'expert' && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium text-gray-900">전문가 정보</h3>

                    {/* 업종 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        전문 분야 <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {expertCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              // 확인 모달 띄우기
                              setPendingCategoryId(category.id);
                              setShowCategoryConfirmModal(true);
                            }}
                            className={`p-2 border-2 rounded-xl text-center transition-all ${
                              formData.expert_category_id === category.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="text-xl mb-0.5">{category.icon}</div>
                            <div className="font-medium text-gray-900 text-[10px]">{category.name}</div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">상담 서비스를 제공할 전문 분야를 선택해주세요</p>
                      <p className="text-xs text-orange-600 mt-1">⚠️ 전문 분야는 가입 후 변경할 수 없습니다. 신중하게 선택해주세요.</p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                      <p>• 전문가 가입 후 해당 업종의 상담 요청을 받을 수 있습니다</p>
                      <p>• 본인 업종 외 다른 업종에 상담 신청도 가능합니다</p>
                    </div>
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
        userRole={formData.role as 'buyer' | 'seller' | 'expert'}
      />

      {/* 전문가 업종 선택 확인 모달 */}
      {showCategoryConfirmModal && pendingCategoryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">
                {expertCategories.find(c => c.id === pendingCategoryId)?.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                전문 분야 확인
              </h3>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 font-medium text-center">
                "{expertCategories.find(c => c.id === pendingCategoryId)?.name}"
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-orange-800">
                ⚠️ <strong>주의:</strong> 전문 분야는 가입 후 변경할 수 없습니다.<br/>
                선택한 분야가 맞는지 다시 한번 확인해주세요.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryConfirmModal(false);
                  setPendingCategoryId(null);
                }}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                다시 선택
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, expert_category_id: pendingCategoryId }));
                  setShowCategoryConfirmModal(false);
                  setPendingCategoryId(null);
                }}
                className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
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