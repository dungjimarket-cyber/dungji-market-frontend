'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { SERVER_DOWN_EVENT, SERVER_UP_EVENT } from '@/lib/api/axiosSetup';

export default function MaintenanceBanner() {
  const [isServerDown, setIsServerDown] = useState(false);

  useEffect(() => {
    // 서버 다운 이벤트 리스너
    const handleServerDown = () => {
      console.warn('🔴 [MaintenanceBanner] 서버 다운 이벤트 감지');
      setIsServerDown(true);

      // 서버 다운 감지 후 복구 체크 시작
      startHealthCheck();
    };

    // 서버 복구 체크
    let healthCheckInterval: NodeJS.Timeout | null = null;

    const startHealthCheck = () => {
      // 이미 체크 중이면 중복 방지
      if (healthCheckInterval) return;

      console.info('🔍 [MaintenanceBanner] 복구 체크 시작 (1분 간격)');

      healthCheckInterval = setInterval(async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health/`, {
            method: 'GET',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.info('🟢 [MaintenanceBanner] 서버 복구 확인');
            setIsServerDown(false);
            stopHealthCheck();
          }
        } catch (error) {
          // 여전히 다운 상태
          console.warn('🔴 [MaintenanceBanner] 서버 여전히 다운');
        }
      }, 60000); // 1분 간격
    };

    const stopHealthCheck = () => {
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
        healthCheckInterval = null;
        console.info('⏹️ [MaintenanceBanner] 복구 체크 중단');
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener(SERVER_DOWN_EVENT, handleServerDown);

    return () => {
      window.removeEventListener(SERVER_DOWN_EVENT, handleServerDown);
      stopHealthCheck();
    };
  }, []);

  // 서버 정상이면 숨김
  if (!isServerDown) return null;

  return (
    // 전체 화면 오버레이 배너
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">서버 점검 중</h2>
        </div>

        <div className="space-y-3">
          <p className="text-gray-700">
            일시적인 서버 오류가 발생했습니다.
          </p>
          <p className="text-sm text-gray-500">
            잠시 후 다시 시도해주세요. 시스템이 자동으로 복구 중입니다.
          </p>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              💡 문제가 지속될 경우 페이지를 새로고침해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
