'use client';

import MyPageLayout from '@/components/mypage/layout/MyPageLayout';
import ReportsManagement from '@/components/mypage/reports/ReportsManagement';
import RequireAuth from '@/components/auth/RequireAuth';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <MyPageLayout>
        <div className="space-y-4">
          {/* 뒤로가기 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/used/mypage')}
            className="gap-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            마이페이지로 돌아가기
          </Button>

          {/* 신고 관리 컴포넌트 */}
          <ReportsManagement />
        </div>
      </MyPageLayout>
    </RequireAuth>
  );
}