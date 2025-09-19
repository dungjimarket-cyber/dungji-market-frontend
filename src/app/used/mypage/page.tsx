'use client';

import { useEffect, useState, useRef } from 'react';
import MyPageLayout from '@/components/mypage/layout/MyPageLayout';
import ProfileSection from '@/components/mypage/profile/ProfileSection';
import MyPageTabs from '@/components/mypage/layout/MyPageTabs';
import { useMyPageStore } from '@/stores/myPageStore';
import RequireAuth from '@/components/auth/RequireAuth';

export default function UsedMyPage() {
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
      <MyPageLayout
        onFavoritesClick={handleFavoritesClick}
        onReviewsClick={handleReviewsClick}
        favoritesCount={favoritesCount}
        reviewsCount={reviewsCount}
      >
        <div className="space-y-3 sm:space-y-6">
          <ProfileSection />
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