'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MyCustomDeals from '@/components/mypage/custom/MyCustomDeals';
import MyCustomParticipations from '@/components/mypage/custom/MyCustomParticipations';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import PenaltyModal from '@/components/penalty/PenaltyModal';
import ProfileCheckModal from '@/components/common/ProfileCheckModal';
import { CustomPenalty } from '@/lib/api/custom/penaltyApi';
import { checkCanCreateCustomDeal } from '@/lib/api/custom/createDealCheck';

export default function MyCustomDealsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  // 모달 상태
  const [penaltyInfo, setPenaltyInfo] = useState<CustomPenalty | null>(null);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // 페이지 진입 시 인증 체크
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleCreateDeal = async () => {
    const result = await checkCanCreateCustomDeal(user);

    if (!result.canProceed) {
      // 패널티가 있는 경우
      if (result.penaltyInfo) {
        setPenaltyInfo(result.penaltyInfo);
        setShowPenaltyModal(true);
        return;
      }

      // 중복 등록인 경우
      if (result.duplicateMessage) {
        alert(result.duplicateMessage);
        return;
      }

      // 프로필 정보 부족한 경우
      if (result.missingFields) {
        setMissingFields(result.missingFields);
        setShowProfileModal(true);
        return;
      }
    }

    // 모든 체크 통과 시 페이지 이동
    router.push('/custom-deals/create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-slate-900">커공 관리 내역</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/mypage/custom-deals/noshow-management')}
              className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              노쇼
            </Button>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex gap-2">
            <Button
              onClick={handleCreateDeal}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              공구 등록
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/custom-deals')}
            >
              공구 목록
            </Button>
          </div>
        </div>
      </div>

      {/* Content - 가로 배치 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 내가 만든 공구 */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 px-2 flex items-center gap-2">
              <span className="text-slate-400">•</span>
              내가 만든 공구
            </h2>
            <MyCustomDeals />
          </div>

          {/* 참여한 공구 */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900 px-2 flex items-center gap-2">
              <span className="text-slate-400">•</span>
              참여한 공구
            </h2>
            <MyCustomParticipations />
          </div>
        </div>
      </div>

      {/* 패널티 모달 */}
      <PenaltyModal
        isOpen={showPenaltyModal}
        onClose={() => setShowPenaltyModal(false)}
        penaltyInfo={penaltyInfo}
        userRole="buyer"
      />

      {/* 프로필 체크 모달 */}
      <ProfileCheckModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
        onUpdateProfile={() => {
          setShowProfileModal(false);
          router.push('/mypage');
        }}
      />
    </div>
  );
}