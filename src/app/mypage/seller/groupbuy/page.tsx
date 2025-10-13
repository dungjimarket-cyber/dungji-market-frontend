'use client';

import SellerMyPageClient from '../SellerMyPageClient';
import RequireAuth from '@/components/auth/RequireAuth';

/**
 * 판매자 공구견적 마이페이지
 */
export default function SellerGroupBuyMyPage() {
  return (
    <RequireAuth>
      <SellerMyPageClient />
    </RequireAuth>
  );
}
