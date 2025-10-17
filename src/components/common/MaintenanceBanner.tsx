'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { SERVER_DOWN_EVENT, SERVER_UP_EVENT } from '@/lib/api/axiosSetup';

export default function MaintenanceBanner() {
  const [isServerDown, setIsServerDown] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 서버 다운 이벤트 리스너
    const handleServerDown = () => {
      console.warn('🔴 [MaintenanceBanner] 서버 다운 이벤트 감지');
      setIsServerDown(true);
      setIsDismissed(false);

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

  // 서버 정상이거나 사용자가 닫은 경우 숨김
  if (!isServerDown || isDismissed) return null;

  return (
    // 상단 고정 배너 (전체 화면 가리지 않음)
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">일시적인 서버 오류가 발생했습니다</p>
            <p className="text-sm text-yellow-100">잠시 후 다시 시도해주세요. 자동으로 복구 중입니다.</p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 hover:bg-yellow-600 rounded transition-colors"
          aria-label="배너 닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
