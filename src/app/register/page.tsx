'use client';

import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import FindAccountModals from '@/components/auth/FindAccountModals';

// Next.js 15에서는 useSearchParams를 사용하는 컴포넌트를 Suspense로 감싼야 함
function RegisterPageContent() {
  const [findModalOpen, setFindModalOpen] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user', // 'user' or 'seller'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * 회원가입 폼 제출 처리 함수
   * 회원가입 후 JWT 기반 로그인 진행
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      // 백엔드 API URL 가져오기
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // 백엔드 URL에서 'api/'가 이미 포함되어 있으니 제거
      const apiUrl = backendUrl.endsWith('/api') 
        ? backendUrl.slice(0, -4) // '/api'를 제거
        : backendUrl;
        
      console.log(`회원가입 요청 URL: ${apiUrl}/api/auth/register/`);
      
      // 회원가입 API 호출 (정확한 경로로 수정)
      const response = await fetch(`${apiUrl}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('회원가입 오류:', errorData);
        throw new Error(errorData.error || '회원가입에 실패했습니다.');
      }

      const data = await response.json();
      console.log('회원가입 응답:', data);

      // 회원가입 성공 후 JWT 기반 로그인 진행
      const loginSuccess = await login(formData.email, formData.password);
      
      if (loginSuccess) {
        // 로그인 성공 시 홈페이지로 이동
        router.push('/');
      } else {
        throw new Error('자동 로그인에 실패했습니다. 로그인 페이지로 이동합니다.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            둥지마켓 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            소셜 계정으로 간편하게 가입하세요
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <SocialLoginButtons />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                또는 이메일로 가입
              </span>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="text-red-500 text-sm p-2 rounded bg-red-50 text-center">{error}</div>
            )}

            <div className="rounded-md shadow-sm space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base"
                  placeholder="이메일 주소를 입력하세요"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base"
                  placeholder="이름을 입력하세요"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">회원 유형</label>
                <select
                  id="role"
                  name="role"
                  required
                  className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-base"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">일반 회원</option>
                  <option value="seller">판매자</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> 처리중...
                  </>
                ) : (
                  '회원가입'
                )}
              </button>
            </div>
            
            {/* 로그인 페이지로 이동 링크 */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                이미 회원이신가요? <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">로그인하기</a>
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setFindModalOpen(true)}
              >
                아이디/비밀번호 찾기
              </button>
            </div>
            <FindAccountModals open={findModalOpen} onOpenChange={setFindModalOpen} />
          </form>
        </div>
      </div>
    </div>
  );
}

// Suspense를 사용하여 컴포넌트 래핑
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
