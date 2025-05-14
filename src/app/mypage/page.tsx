'use client';

import MyPageClient from './MyPageClient';
import RequireAuth from '@/components/auth/RequireAuth';

/**
 * 마이페이지 컴포넌트
 * 사용자 프로필 및 참여 중인 공구 등을 보여줍니다.
 * 클라이언트 컴포넌트로 변경하고 RequireAuth를 적용하여 로그인 상태를 유지합니다.
 */
export default function MyPage() {
  return (
    <RequireAuth>
      <MyPageClient />
    </RequireAuth>
  );
}
