'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * 전문가 관리 페이지는 상담 내역 페이지로 통합되었습니다.
 * 접속 시 전문가용 탭(수신)으로 이동합니다.
 */
export default function ExpertManagePage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const tab = user?.role === 'expert' ? 'received' : 'sent';
    router.replace(`/mypage/consultations?tab=${tab}`);
  }, [authLoading, user?.role, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
