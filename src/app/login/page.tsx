'use client';

import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  /**
   * 오류 메시지 초기화
   */
  const clearError = () => {
    setErrorMessage('');
    setErrorCode('');
  };

  /**
   * 입력 필드 변경 시 오류 메시지 초기화
   */
  useEffect(() => {
    clearError();
  }, [username, password]);

  /**
   * 로그인 양식 제출 처리 함수
   * @param e 이벤트 객체
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    
    console.log('로그인 시도:', { username, password: '***' });
    
    try {
      // 사용자 입력 유효성 검사
      if (!username) {
        setErrorMessage('아이디를 입력해주세요.');
        setErrorCode('invalid_username');
        setLoading(false);
        return;
      }
      
      if (!password || password.length < 6) {
        setErrorMessage('비밀번호는 6자 이상이어야 합니다.');
        setErrorCode('invalid_password');
        setLoading(false);
        return;
      }
      
      // AuthContext의 login 함수 호출
      const result = await login(username, password);
      
      if (result.success) {
        // 로그인 성공 처리
        toast({
          title: '로그인 성공',
          description: '환영합니다!'
        });
        
        // 리디렉션 처리 - Next.js Router 사용
        router.push(callbackUrl);
      } else {
        // 로그인 실패 처리 - 상세 오류 메시지 표시
        setErrorMessage(result.errorMessage || '아이디 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.');
        setErrorCode(result.errorCode || 'unknown');
        
        // 로그인 실패 처리
        let toastTitle = '로그인 실패';
        let toastDescription = result.errorMessage || '아이디 또는 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.';
        
        toast({
          variant: 'destructive',
          title: toastTitle,
          description: toastDescription
        });
      }
    } catch (err) {
      console.error('handleSubmit 오류:', err);
      
      // 오류 메시지 설정
      setErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      setErrorCode('network_error');
      
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            둥지마켓에 오신 것을 환영합니다
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            소셜 로그인으로 간편하게 시작하세요
          </p>
        </div>

        {/* 회원 유형 안내 및 로그인 버튼 */}
        <div className="space-y-4">
          {/* 일반회원 섹션 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🛒</span>
              <div>
                <p className="font-medium text-gray-900">구매가 목적이신가요?</p>
                <p className="text-sm text-gray-500">공동구매 참여하고 비교견적 받기!</p>
              </div>
            </div>
            <button
              onClick={() => {
                const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'a197177aee0ddaf6b827a6225aa48653';
                const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/kakao';
                
                // state에 role 정보 포함
                const stateData = {
                  redirectUrl: callbackUrl,
                  role: 'buyer'
                };
                const state = JSON.stringify(stateData);
                
                const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}`;
                window.location.href = kakaoAuthUrl;
              }}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[#191919] bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FDD800] transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="#3C1E1E" viewBox="0 0 24 24">
                <path d="M12 3c-5.52 0-10 3.36-10 7.5 0 2.65 1.84 4.98 4.61 6.31-.2.72-.73 2.62-.76 2.78-.04.2.07.35.24.35.14 0 .29-.09.47-.26l2.94-2.51c.78.13 1.62.2 2.5.2 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
              <span>일반회원 카카오로 계속하기</span>
            </button>
          </div>
          
          {/* 판매회원 섹션 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">💼</span>
              <div>
                <p className="font-medium text-gray-900">판매가 목적이신가요?</p>
                <p className="text-sm text-gray-500">대량 판매 기회 받기</p>
              </div>
            </div>
            <button
              onClick={() => {
                const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'a197177aee0ddaf6b827a6225aa48653';
                const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/kakao';
                
                // state에 role 정보 포함
                const stateData = {
                  redirectUrl: callbackUrl,
                  role: 'seller'
                };
                const state = JSON.stringify(stateData);
                
                const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}`;
                window.location.href = kakaoAuthUrl;
              }}
              className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[#191919] bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FDD800] transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="#3C1E1E" viewBox="0 0 24 24">
                <path d="M12 3c-5.52 0-10 3.36-10 7.5 0 2.65 1.84 4.98 4.61 6.31-.2.72-.73 2.62-.76 2.78-.04.2.07.35.24.35.14 0 .29-.09.47-.26l2.94-2.51c.78.13 1.62.2 2.5.2 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
              <span>판매회원 카카오로 계속하기</span>
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-5">

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                또는 아이디로 로그인
              </span>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-3">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border ${errorCode === 'invalid_username' || errorCode === 'invalid_credentials' ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="아이디"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-2 border ${errorCode === 'invalid_password' || errorCode === 'invalid_credentials' ? 'border-red-500' : 'border-gray-300'} placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              {/* 오류 메시지 표시 */}
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                      
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                disabled={loading}
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </div>
            
            {/* 아이디/비밀번호 찾기 & 회원가입 링크 */}
            <div className="flex justify-between items-center mt-4 px-1">
              <button 
                type="button" 
                onClick={() => setFindModalOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                아이디/비밀번호 찾기
              </button>
              
              <a 
                href="/register" 
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                회원가입
              </a>
            </div>
          </form>
        </div>
      </div>
      
      {/* 아이디/비밀번호 찾기 모달 */}
      <FindAccountModals open={findModalOpen} onOpenChange={setFindModalOpen} />
      
      {/* 모바일 화면에서 키보드로 인한 콘텐츠 가림 방지를 위한 추가 여백 */}
      <div className="h-10 md:hidden"></div>
    </div>
  );
}
