'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RequireAuth from '@/components/auth/RequireAuth';
import ProfileSection from '@/components/mypage/ProfileSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // 판매회원은 기존 판매자 설정 페이지를 사용
    if (!isLoading && user?.role === 'seller') {
      router.replace('/mypage/seller/settings');
    }
    // 전문가/구매자는 통합 설정 페이지 사용 (리다이렉트 없음)
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold ml-2">계정 정보 설정</h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/mypage')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로가기
          </Button>
        </div>

        <ProfileSection />
      </div>
    </RequireAuth>
  );
}
