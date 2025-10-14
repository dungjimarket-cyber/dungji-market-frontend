'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ExternalLink, AlertCircle } from 'lucide-react';

/**
 * 외부 링크 리다이렉트 페이지 컨텐츠
 * 네이버 봇 차단 우회를 위한 중간 페이지
 */
function RedirectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      setError('유효하지 않은 링크입니다.');
      return;
    }

    // URL 유효성 검사
    try {
      const urlObj = new URL(targetUrl);
      // http, https만 허용
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        setError('유효하지 않은 링크입니다.');
        return;
      }
      setUrl(targetUrl);
    } catch (e) {
      setError('유효하지 않은 링크입니다.');
      return;
    }
  }, [searchParams]);

  useEffect(() => {
    if (!url) return;

    // 카운트다운
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    // 카운트다운 종료 후 이동
    if (countdown === 0) {
      window.location.href = url;
    }
  }, [countdown, url]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mb-6">
            <ExternalLink className="w-16 h-16 text-blue-600 mx-auto animate-bounce" />
          </div>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            외부 사이트로 이동 중
          </h1>

          {/* 카운트다운 */}
          <div className="mb-6">
            <div className="text-5xl font-bold text-blue-600 mb-2">
              {countdown}
            </div>
            <p className="text-gray-600">초 후 자동으로 이동합니다</p>
          </div>

          {/* 목적지 URL */}
          {url && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">이동할 주소</p>
              <p className="text-sm text-gray-700 break-all">{url}</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                if (url) window.location.href = url;
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              바로 이동
            </button>
          </div>

          {/* 안내 메시지 */}
          <p className="text-xs text-gray-500 mt-4">
            외부 사이트로 연결됩니다. 링크의 안전성을 확인해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 리다이렉트 페이지 (Suspense boundary로 감싸기)
 */
export default function RedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <RedirectContent />
    </Suspense>
  );
}
