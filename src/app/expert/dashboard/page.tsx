'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ExpertDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mypage/expert/manage');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <span>전문가 관리 내역으로 이동합니다...</span>
      </div>
    </div>
  );
}
