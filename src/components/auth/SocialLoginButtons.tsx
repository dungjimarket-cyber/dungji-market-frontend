'use client';

import Image from 'next/image';
import { useState, Suspense } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface SocialLoginButtonsContentProps {
  requireTermsAgreement?: boolean;
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
  memberType?: 'buyer' | 'seller';
  buttonText?: string;
  isSignup?: boolean;
}

/**
 * useSearchParams를 사용하는 내부 컴포넌트
 * Next.js 15에서는 useSearchParams를 사용하는 컴포넌트를 분리하고 Suspense로 감싸야 함
 */
function SocialLoginButtonsContent({ requireTermsAgreement, termsAgreed, privacyAgreed, memberType, buttonText, isSignup }: SocialLoginButtonsContentProps) {
  const [loading, setLoading] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  /**
   * 소셜 로그인 처리 함수
   * @param provider - 소셜 로그인 제공자 ('kakao')
   */
  const handleSocialLogin = (provider: string, callbackUrl: string = '/') => {
    
    // 약관 동의 확인 (회원가입 페이지에서만)
    if (requireTermsAgreement && (!termsAgreed || !privacyAgreed)) {
      toast({
        variant: 'destructive',
        title: '약관 동의 필요',
        description: '필수 약관에 동의해주세요.',
      });
      return;
    }
    // 기본 redirectUrl 설정 (로그인 후 돌아갈 경로)
    let redirectUrl = callbackUrl;
    
    if (typeof window !== 'undefined') {
      // 로그인 페이지에서 전달된 callbackUrl 파라미터 추출
      const searchParams = new URLSearchParams(window.location.search);
      const targetCallbackUrl = searchParams.get('callbackUrl');
      
      // URL 파라미터로 전달된 값이 있으면 사용
      if (targetCallbackUrl) {
        redirectUrl = targetCallbackUrl;
      }
      
      // 목적지 URL 저장
      localStorage.setItem('dungji_redirect_url', redirectUrl);
      console.log('소셜 로그인 목적지 URL 저장:', redirectUrl);
    }

    try {
      setLoading(provider);
      
      // 카카오 OAuth 직접 호출 (Django 백엔드를 거치지 않음)
      const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'a197177aee0ddaf6b827a6225aa48653';
      
      // 카카오 개발자 콘솔에 등록된 정확한 리디렉트 URI 사용
      const currentHost = window.location.origin;
      let redirectUri;
      
      if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) {
        // 환경 변수에 설정된 URI 우선 사용
        redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
        console.log('환경변수에서 카카오 리디렉트 URI 사용:', redirectUri);
      } else if (currentHost.includes('dungjimarket.com')) {
        // 프로덕션에서는 도메인을 정확히 사용
        redirectUri = 'https://dungjimarket.com/api/auth/callback/kakao';
        console.log('프로덕션 리디렉트 URI 사용:', redirectUri);
      } else {
        // 개발 환경에서는 localhost 사용
        redirectUri = 'http://localhost:3000/api/auth/callback/kakao';
        console.log('개발 환경 리디렉트 URI 사용:', redirectUri);
      }
      
      // state에 콜백 URL과 memberType(role) 정보를 JSON으로 저장
      const stateData = {
        redirectUrl: redirectUrl,
        role: memberType || 'buyer' // memberType이 없으면 기본값 buyer
      };
      const state = JSON.stringify(stateData);
      
      // 카카오 OAuth URL 직접 생성
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}`;
      
      // 디버그 정보 출력
      console.log(`카카오 OAuth URL: ${kakaoAuthUrl}`);
      console.log(`카카오 클라이언트 ID: ${kakaoClientId}`);
      console.log(`리디렉트 URI: ${redirectUri}`);
      console.log(`State 데이터:`, stateData);
      
      // 카카오 OAuth URL로 직접 리디렉션
      window.location.href = kakaoAuthUrl;
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
      });
      setLoading('');
    }
  };

  // memberType과 isSignup에 따라 버튼 텍스트 결정
  const getButtonText = () => {
    if (isSignup) {
      // 회원가입 페이지
      if (memberType === 'seller') {
        return '카카오로 가입하기(사업자회원)';
      }
      return '카카오로 가입하기(개인회원)';
    } else {
      // 로그인 페이지
      if (memberType === 'seller') {
        return '카카오로 계속하기(사업자회원)';
      }
      return '카카오로 계속하기(개인회원)';
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <button
        onClick={() => handleSocialLogin('kakao')}
        disabled={!!loading}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[#191919] bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FDD800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading === 'kakao' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Image
              src="/kakao.svg"
              alt="Kakao logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span>{buttonText || getButtonText()}</span>
          </>
        )}
      </button>
    </div>
  );
}

interface SocialLoginButtonsProps {
  requireTermsAgreement?: boolean;
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
  memberType?: 'buyer' | 'seller';
  buttonText?: string;
  isSignup?: boolean;
}

/**
 * 소셜 로그인 버튼 컴포넌트
 * JWT 기반 인증을 위해 Django 백엔드의 소셜 로그인 엔드포인트로 연결합니다.
 */
export default function SocialLoginButtons({ requireTermsAgreement, termsAgreed, privacyAgreed, memberType, buttonText, isSignup }: SocialLoginButtonsProps) {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4 w-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>}>
      <SocialLoginButtonsContent 
        requireTermsAgreement={requireTermsAgreement}
        termsAgreed={termsAgreed}
        privacyAgreed={privacyAgreed}
        memberType={memberType}
        buttonText={buttonText}
        isSignup={isSignup}
      />
    </Suspense>
  );
}
