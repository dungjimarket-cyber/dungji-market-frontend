'use client';

import { useEffect } from 'react';
import MyPageLayout from '@/components/mypage/layout/MyPageLayout';
import ProfileSection from '@/components/mypage/profile/ProfileSection';
import MyPageTabs from '@/components/mypage/layout/MyPageTabs';
import { useMyPageStore } from '@/stores/myPageStore';
import RequireAuth from '@/components/auth/RequireAuth';

export default function UsedMyPage() {
  const { fetchProfile, fetchStats } = useMyPageStore();

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [fetchProfile, fetchStats]);

  return (
    <RequireAuth>
      <MyPageLayout>
        <div className="space-y-6">
          <ProfileSection />
          <MyPageTabs />
        </div>
      </MyPageLayout>
    </RequireAuth>
  );
}