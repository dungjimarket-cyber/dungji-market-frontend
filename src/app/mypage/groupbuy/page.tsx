'use client';

import MyPageClient from '../MyPageClient';
import RequireAuth from '@/components/auth/RequireAuth';

/**
 * 공구견적 마이페이지
 */
export default function GroupBuyMyPage() {
  return (
    <RequireAuth>
      <MyPageClient />
    </RequireAuth>
  );
}
