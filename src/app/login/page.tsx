'use client';

import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FindAccountModals from '@/components/auth/FindAccountModals';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

/**
 * 로그인 페이지 스켈레톤 컴포넌트
 */
function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-6 rounded-lg border p-8 shadow-md">
        <div className="space-y-2">
          <div className="h-6 w-1/2 animate-pulse rounded-md bg-gray-200"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-gray-200"></div>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200"></div>
          <div className="h-10 w-full animate-pulse rounded-md bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 로그인 폼 컴포넌트
 */
function LoginForm() {
  const [findModalOpen, setFindModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  /**
   * 로그인 양식 제출 처리 함수
   * @param e 이벤트 객체
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    console.log('로그인 시도:', { email, password: '***' });
    
    try {
      // 사용자 입력 유효성 검사
      if (!email || !email.includes('@')) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: '유효한 이메일 주소를 입력해주세요.'
        });
        setLoading(false);
        return;
      }
      
      if (!password || password.length < 6) {
        toast({
          variant: 'destructive',
          title: '입력 오류',
          description: '비밀번호는 6자 이상이어야 합니다.'
        });
        setLoading(false);
        return;
      }
      
      // AuthContext의 login 함수 호출
      const success = await login(email, password);
      
      if (success) {
        // 로그인 성공 처리
        toast({
          title: '로그인 성공',
          description: '환영합니다!'
        });
        
        // 리디렉션 처리 - Next.js Router 사용
        router.push(callbackUrl);
      } else {
        // 로그인 실패 처리
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: '이메일 또는 비밀번호가 일치하지 않습니다.'
        });
      }
    } catch (err) {
      console.error('handleSubmit 오류:', err);
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: '로그인 요청 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            둥지마켓에 오신 것을 환영합니다
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            소셜 로그인으로 간편하게 시작하세요
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <SocialLoginButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                또는 이메일로 로그인
              </span>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">이메일</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                disabled={loading}
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
            
            {/* 아이디/비밀번호 찾기 링크 */}
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setFindModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                아이디/비밀번호 찾기
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* 아이디/비밀번호 찾기 모달 */}
      <FindAccountModals open={findModalOpen} onOpenChange={setFindModalOpen} />
    </div>
  );
}
