'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MaintenanceBanner() {
  const [isServerDown, setIsServerDown] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // 백엔드 루트 엔드포인트로 헬스체크
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        setIsServerDown(!response.ok);
        setChecking(false);
      } catch (error) {
        // 타임아웃이나 네트워크 오류 = 서버 다운
        setIsServerDown(true);
        setChecking(false);
      }
    };

    // 즉시 체크
    checkHealth();

    // 30초마다 체크
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // 첫 체크 중이거나 서버 정상이면 숨김
  if (checking || !isServerDown) return null;

  return (
    // 전체 화면 완전히 가리기 (배경 완전 차단)
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex items-center justify-center">
      <div className="text-center text-white px-6">
        <AlertTriangle className="w-20 h-20 mx-auto mb-6 text-yellow-400" />
        <h2 className="text-3xl font-bold mb-4">서비스 점검 중입니다</h2>
        <p className="text-xl mb-3">빠른 시일 내에 복구하겠습니다.</p>
        <p className="text-gray-400 text-lg">불편을 드려 죄송합니다.</p>
      </div>
    </div>
  );
}
