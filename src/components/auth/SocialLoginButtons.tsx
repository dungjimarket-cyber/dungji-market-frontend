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
}

/**
 * useSearchParams를 사용하는 내부 컴포넌트
 * Next.js 15에서는 useSearchParams를 사용하는 컴포넌트를 분리하고 Suspense로 감싸야 함
 */
function SocialLoginButtonsContent({ requireTermsAgreement, termsAgreed, privacyAgreed }: SocialLoginButtonsContentProps) {
  const [loading, setLoading] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  /**
   * 소셜 로그인 처리 함수
   * @param provider - 소셜 로그인 제공자 ('kakao')
   */
  const handleSocialLogin = (provider: string, callbackUrl: string = '/') => {
    // 로그인 페이지에서 카카오 로그인 클릭 시 회원가입 페이지로 리다이렉트
    if (!requireTermsAgreement) {
      router.push('/register');
      return;
    }
    
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
      
      // Django 백엔드의 소셜 로그인 URL로 리디렉션
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      
      // 클라이언트가 제어하는 리디렉트 URI 생성 (가동환경에 맞게 자동 설정)
      const callbackPath = '/api/auth/callback/kakao';
      
      // 카카오 개발자 콘솔에 등록된 정확한 리디렉트 URI 사용
      // 중요: 개발자 콘솔에 등록된 URI와 정확히 일치해야 함
      const currentHost = window.location.origin;
      let redirectUri;
      
      if (process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI) {
        // 환경 변수에 설정된 URI 우선 사용 (recommended for consistency)
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
      
      // 소셜 로그인 URL 구성 (백엔드의 새 엔드포인트에 맞게 수정)
      const socialLoginUrl = `${backendUrl}/auth/social/${provider}/?next=${encodeURIComponent(window.location.origin + '/auth/social-callback?callbackUrl=' + encodeURIComponent(redirectUrl))}&redirect_uri=${encodeURIComponent(redirectUri)}`;
      
      // 디버그 정보 출력
      console.log(`소셜 로그인 URL: ${socialLoginUrl}`);
      console.log(`소셜 로그인 제공자: ${provider}`);
      console.log(`콜백 URL: ${redirectUrl}`);
      console.log(`API URL: ${backendUrl}`);
      console.log(`리디렉트 URI: ${redirectUri}`);
      console.log(`전체 리디렉션 URL: ${socialLoginUrl}`);
      
      // 소셜 로그인 URL로 리디렉션
      window.location.href = socialLoginUrl;
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

  return (
    <div className="flex flex-col gap-4 w-full">
      <button
        onClick={() => handleSocialLogin('kakao')}
        disabled={!!loading}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[#191919] bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FDD800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'kakao' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image
            src="/kakao.svg"
            alt="Kakao logo"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        )}
        카카오로 계속하기
      </button>
    </div>
  );
}

interface SocialLoginButtonsProps {
  requireTermsAgreement?: boolean;
  termsAgreed?: boolean;
  privacyAgreed?: boolean;
}

/**
 * 소셜 로그인 버튼 컴포넌트
 * JWT 기반 인증을 위해 Django 백엔드의 소셜 로그인 엔드포인트로 연결합니다.
 */
export default function SocialLoginButtons({ requireTermsAgreement, termsAgreed, privacyAgreed }: SocialLoginButtonsProps) {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4 w-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>}>
      <SocialLoginButtonsContent 
        requireTermsAgreement={requireTermsAgreement}
        termsAgreed={termsAgreed}
        privacyAgreed={privacyAgreed}
      />
    </Suspense>
  );
}
