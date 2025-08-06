'use client';

import SellerMyPageClient from './SellerMyPageClient';
import RequireAuth from '@/components/auth/RequireAuth';

/**
 * 판매자 마이페이지 컴포넌트
 * 6개 카테고리로 구성된 판매자 전용 페이지
 */
export default function SellerMyPage() {
  return (
    <RequireAuth>
      <SellerMyPageClient />
    </RequireAuth>
  );
}