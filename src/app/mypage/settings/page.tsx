'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import ProfileSection from '@/components/mypage/ProfileSection';
import RequireAuth from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * 일반회원 설정 페이지
 * ProfileSection 컴포넌트를 별도 페이지로 분리
 */
export default function BuyerSettings() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // 판매회원이 접근한 경우 판매회원 설정 페이지로 리다이렉트
    if (!isLoading && user?.role === 'seller') {
      router.replace('/mypage/seller/settings');
    }
    // 전문가 회원이 접근한 경우 전문가 설정 페이지로 리다이렉트
    if (!isLoading && user?.role === 'expert') {
      router.replace('/mypage/expert/settings');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold ml-2">내 정보 설정</h1>
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