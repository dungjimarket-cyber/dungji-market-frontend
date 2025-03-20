'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function SocialLoginButtons() {
  const [loading, setLoading] = useState<string>('');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    try {
      setLoading(provider);
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
        });
      } else if (!result?.ok) {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.',
        });
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
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
