'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FindAccountModals from '@/components/auth/FindAccountModals';
import Link from 'next/link';

function SignInForm() {
  const [findModalOpen, setFindModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [sellerReferralCode, setSellerReferralCode] = useState('');
  const [showSellerReferralInput, setShowSellerReferralInput] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'buyer' | 'seller'>('buyer');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-2 sm:py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 뒤로가기 버튼 */}
        <div>
          <Link href="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            뒤로가기
          </Link>
        </div>

        <div>
          <h2 className="mt-3 sm:mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            둥지마켓 이용을 위해 로그인해주세요
          </p>
        </div>

        {/* 탭 선택 UI */}
        <div className="flex rounded-lg bg-gray-200 p-1.5">
          <button
            onClick={() => setSelectedTab('buyer')}
            className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-md font-bold text-lg transition-all ${
              selectedTab === 'buyer'
                ? 'bg-white text-blue-700 shadow-md'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <span className="text-2xl">🛒</span>
            <span className="text-lg">개인회원</span>
          </button>
          <button
            onClick={() => setSelectedTab('seller')}
            className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-md font-bold text-lg transition-all ${
              selectedTab === 'seller'
                ? 'bg-white text-amber-600 shadow-md'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <span className="text-2xl">💼</span>
            <span className="text-lg">사업자회원</span>
          </button>
        </div>

        {/* 카카오 로그인 섹션 */}
        <div className="mt-4">
          {/* 구매회원 카카오 로그인 */}
          {selectedTab === 'buyer' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-center mb-3">
                <p className="text-sm font-medium text-gray-700">
                  공동구매 개설·참여
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  공구견적받기 / 중고거래 이용
                </p>
              </div>
              <button
              onClick={() => {
                setKakaoLoading(true);
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
              disabled={kakaoLoading}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm text-[#191919] bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FDD800] transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {kakaoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium text-sm">로그인 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="#3C1E1E" viewBox="0 0 24 24">
                    <path d="M12 3c-5.52 0-10 3.36-10 7.5 0 2.65 1.84 4.98 4.61 6.31-.2.72-.73 2.62-.76 2.78-.04.2.07.35.24.35.14 0 .29-.09.47-.26l2.94-2.51c.78.13 1.62.2 2.5.2 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
                  </svg>
                  <span className="font-medium text-sm">카카오로 계속하기(개인회원)</span>
                </>
              )}
            </button>
          </div>
          )}

          {/* 판매회원 카카오 로그인 */}
          {selectedTab === 'seller' && (
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <div className="text-center mb-3">
                <p className="text-xs text-gray-500 mt-1">
                  통신·렌탈 판매 활동 / 중고거래 이용
                </p>
              </div>
              <button
              onClick={() => {
                setKakaoLoading(true);
                const kakaoClientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || 'a197177aee0ddaf6b827a6225aa48653';
                const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/kakao';
                
                // state에 role 정보 포함
                const stateData = {
                  redirectUrl: callbackUrl,
                  role: 'seller'
                };
                const state = JSON.stringify(stateData);
                
                console.log('판매회원 카카오 로그인 state:', stateData);
                
                const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${encodeURIComponent(state)}`;
                window.location.href = kakaoAuthUrl;
              }}
              disabled={kakaoLoading}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm text-[#191919] bg-[#FEE500] border border-[#FEE500] rounded-lg hover:bg-[#FDD800] transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {kakaoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium text-sm">로그인 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="#3C1E1E" viewBox="0 0 24 24">
                    <path d="M12 3c-5.52 0-10 3.36-10 7.5 0 2.65 1.84 4.98 4.61 6.31-.2.72-.73 2.62-.76 2.78-.04.2.07.35.24.35.14 0 .29-.09.47-.26l2.94-2.51c.78.13 1.62.2 2.5.2 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
                  </svg>
                  <span className="font-medium text-sm">카카오로 계속하기(사업자회원)</span>
                </>
              )}
            </button>
          </div>
          )}
        </div>

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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                아이디
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errorCode === 'invalid_username' || errorCode === 'invalid_credentials' 
                    ? 'border-red-500' 
                    : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="아이디"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                  errorCode === 'invalid_password' || errorCode === 'invalid_credentials'
                    ? 'border-red-500'
                    : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* 오류 메시지 표시 */}
          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {errorMessage}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFindModalOpen(true)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              아이디/비밀번호 찾기
            </button>

            <Link href="/register" className="text-sm text-indigo-600 hover:text-indigo-500">
              회원가입
            </Link>
          </div>
        </form>
      </div>

      {/* 아이디/비밀번호 찾기 모달 */}
      <FindAccountModals open={findModalOpen} onOpenChange={setFindModalOpen} />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}