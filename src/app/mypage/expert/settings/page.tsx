'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ExpertSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mypage/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span>설정 페이지로 이동합니다...</span>
      </div>
    </div>
  );
}
