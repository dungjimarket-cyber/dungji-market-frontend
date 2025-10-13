'use client';

import DashboardClient from '../DashboardClient';
import RequireAuth from '@/components/auth/RequireAuth';

/**
 * 판매자 마이페이지 통합 대시보드
 * 공구견적, 커스텀 공구, 중고거래 요약 정보 제공
 */
export default function SellerMyPage() {
  return (
    <RequireAuth>
      <DashboardClient />
    </RequireAuth>
  );
}
