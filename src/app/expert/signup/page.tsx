'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import Link from 'next/link';

function ExpertSignupContent() {
  const router = useRouter();
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const allAgreed = termsAgreed && privacyAgreed;

  const handleAgreeAll = () => {
    const newValue = !allAgreed;
    setTermsAgreed(newValue);
    setPrivacyAgreed(newValue);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm">뒤로가기</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">전문가 회원가입</h1>
              <p className="text-sm text-gray-500">둥지마켓 전문가로 활동하세요</p>
            </div>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* 안내 문구 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-2">전문가 회원이란?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>고객의 상담 요청을 받고 답변할 수 있습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>전문 분야(업종)와 활동 지역을 설정할 수 있습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>고객과 연결되면 상담을 진행할 수 있습니다</span>
              </li>
            </ul>
          </div>

          {/* 약관 동의 */}
          <div className="mb-6 space-y-3">
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={handleAgreeAll}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium text-gray-900">전체 동의하기</span>
            </label>

            <div className="pl-2 space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  [필수] 서비스 이용약관 동의
                </span>
                <Link href="/terms" className="text-xs text-blue-600 hover:underline ml-auto">
                  보기
                </Link>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreed}
                  onChange={(e) => setPrivacyAgreed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  [필수] 개인정보 처리방침 동의
                </span>
                <Link href="/privacy" className="text-xs text-blue-600 hover:underline ml-auto">
                  보기
                </Link>
              </label>
            </div>
          </div>

          {/* 카카오 가입 버튼 */}
          <SocialLoginButtons
            requireTermsAgreement={true}
            termsAgreed={termsAgreed}
            privacyAgreed={privacyAgreed}
            memberType="expert"
            isSignup={true}
          />

          {/* 안내 */}
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
            <p className="font-medium mb-1">가입 후 필수 설정</p>
            <p>가입 완료 후 <strong>전문 분야(업종)</strong>와 <strong>연락처</strong>를 입력해야 상담 매칭이 시작됩니다.</p>
          </div>

          {/* 기존 회원 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpertSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ExpertSignupContent />
    </Suspense>
  );
}
