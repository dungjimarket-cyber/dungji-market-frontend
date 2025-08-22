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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        <div>
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            둥지마켓에 오신걸 환영합니다
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            세상없던 중개 플랫폼!
          </p>
        </div>

        {/* 사용자 구분 섹션 */}
        <div className="space-y-4">
          {/* 처음이신가요? 섹션 */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">처음이신가요?</h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    NEW
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  1분만에 가입하고 둥지마켓과 함께하세요~
                </p>
              </div>
            </div>
            
            {/* 회원가입 버튼 */}
            <button
              onClick={() => {
                router.push('/register');
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all duration-200 font-medium shadow-md"
            >
              회원가입 하기
            </button>
          </div>
          
          {/* 회원이신가요? 섹션 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl">👋</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">회원이신가요?</h3>
                <p className="text-sm text-gray-500">
                  이미 둥지마켓 회원이신 분은 로그인하세요!
                </p>
              </div>
            </div>
            
            {/* 로그인 페이지로 이동 버튼 */}
            <button
              onClick={() => {
                router.push('/login/signin');
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              로그인하러 가기
            </button>
          </div>
        </div>

        {/* 둥지마켓 이용안내 */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">🛡️ 둥지마켓 이용안내</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🔒</span>
              <span><strong>일반회원:</strong> 공동구매 참여, 비교견적 받기</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">🏪</span>
              <span><strong>판매회원:</strong> 견적 제안하고 판매 기회 얻기</span>
            </div>
          </div>
        </div>

        {/* 아이디/비밀번호 찾기 링크 */}
        <div className="text-center">
          <button 
            type="button" 
            onClick={() => setFindModalOpen(true)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            아이디/비밀번호를 잊으셨나요?
          </button>
        </div>
      </div>
      
      {/* 아이디/비밀번호 찾기 모달 */}
      <FindAccountModals open={findModalOpen} onOpenChange={setFindModalOpen} />
      
      {/* 모바일 화면에서 키보드로 인한 콘텐츠 가림 방지를 위한 추가 여백 */}
      <div className="h-10 md:hidden"></div>
    </div>
  );
}
