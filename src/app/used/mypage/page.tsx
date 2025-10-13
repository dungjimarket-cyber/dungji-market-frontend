'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MyPageLayout from '@/components/mypage/layout/MyPageLayout';
import ProfileSection from '@/components/mypage/profile/ProfileSection';
import MyPageTabs from '@/components/mypage/layout/MyPageTabs';
import { useMyPageStore } from '@/stores/myPageStore';
import RequireAuth from '@/components/auth/RequireAuth';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

export default function UsedMyPage() {
  const router = useRouter();
  const { fetchProfile, fetchStats } = useMyPageStore();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const myPageTabsRef = useRef<any>(null);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [fetchProfile, fetchStats]);

  const handleFavoritesClick = () => {
    // MyPageTabs 컴포넌트의 showFavoritesModal 함수 호출
    if (myPageTabsRef.current?.openFavoritesModal) {
      myPageTabsRef.current.openFavoritesModal();
    }
  };

  const handleReviewsClick = () => {
    // MyPageTabs 컴포넌트의 showReviewsModal 함수 호출
    if (myPageTabsRef.current?.openReviewsModal) {
      myPageTabsRef.current.openReviewsModal();
    }
  };

  return (
    <RequireAuth>
      {/* 헤더 영역 */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">중고거래 내역</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/used')}
            className="flex items-center"
          >
            <Smartphone className="w-4 h-4 mr-1" />
            중고거래
          </Button>
        </div>
      </div>

      <MyPageLayout
        onFavoritesClick={handleFavoritesClick}
        onReviewsClick={handleReviewsClick}
        favoritesCount={favoritesCount}
        reviewsCount={reviewsCount}
      >
        <div className="space-y-3 sm:space-y-6">
          <ProfileSection
            onFavoritesClick={handleFavoritesClick}
            onReviewsClick={handleReviewsClick}
            favoritesCount={favoritesCount}
            reviewsCount={reviewsCount}
          />
          <MyPageTabs
            ref={myPageTabsRef}
            onCountsUpdate={(favorites, reviews) => {
              setFavoritesCount(favorites);
              setReviewsCount(reviews);
            }}
          />
        </div>
      </MyPageLayout>
    </RequireAuth>
  );
}