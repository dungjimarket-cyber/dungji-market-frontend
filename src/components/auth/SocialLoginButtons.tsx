'use client';

import Image from 'next/image';
import { useState, Suspense } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * useSearchParams를 사용하는 내부 컴포넌트
 * Next.js 15에서는 useSearchParams를 사용하는 컴포넌트를 분리하고 Suspense로 감싸야 함
 */
function SocialLoginButtonsContent() {
  const [loading, setLoading] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  /**
   * 소셜 로그인 처리 함수
   * @param provider - 소셜 로그인 제공자 ('google' 또는 'kakao')
   */
  const handleSocialLogin = (provider: 'google' | 'kakao') => {
    try {
      setLoading(provider);
      
      // Django 백엔드의 소셜 로그인 URL로 리디렉션
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 백엔드 URL에서 'api/'가 이미 포함되어 있으니 제거
      const apiUrl = backendUrl.endsWith('/api') 
        ? backendUrl.slice(0, -4) // '/api'를 제거
        : backendUrl;
      
      // 소셜 로그인 URL 구성 (백엔드의 새 엔드포인트에 맞게 수정)
      const socialLoginUrl = `${apiUrl}/api/auth/social/${provider}/?next=${encodeURIComponent(window.location.origin + '/auth/social-callback?callbackUrl=' + encodeURIComponent(callbackUrl))}`;
      console.log(`소셜 로그인 URL: ${socialLoginUrl}`);
      console.log(`소셜 로그인 제공자: ${provider}`);
      console.log(`콜백 URL: ${callbackUrl}`);
      console.log(`API URL: ${apiUrl}`);
      
      // 디버그 정보 추가
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
        onClick={() => handleSocialLogin('google')}
        disabled={!!loading}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === 'google' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Image
            src="/google.svg"
            alt="Google logo"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        )}
        Google로 계속하기
      </button>

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

/**
 * 소셜 로그인 버튼 컴포넌트
 * JWT 기반 인증을 위해 Django 백엔드의 소셜 로그인 엔드포인트로 연결합니다.
 */
export default function SocialLoginButtons() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-4 w-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>}>
      <SocialLoginButtonsContent />
    </Suspense>
  );
}
