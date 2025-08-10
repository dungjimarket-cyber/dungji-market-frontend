'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EndedGroupBuyAccessControlProps {
  status: string;
  isAuthenticated: boolean;
  isParticipant: boolean;
  children: React.ReactNode;
}

export function EndedGroupBuyAccessControl({
  status,
  isAuthenticated,
  isParticipant,
  children
}: EndedGroupBuyAccessControlProps) {
  const router = useRouter();
  
  // 종료된 공구인지 확인 (모집 종료 후 모든 상태)
  const isEndedGroupBuy = [
    'final_selection_buyers',
    'final_selection_seller', 
    'in_progress',
    'completed',
    'cancelled'
  ].includes(status);
  
  // 접근 제한 체크
  const shouldRestrictAccess = isEndedGroupBuy && (!isAuthenticated || !isParticipant);
  
  if (shouldRestrictAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            
            {!isAuthenticated ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  로그인이 필요합니다
                </h2>
                <p className="text-gray-600 mb-6">
                  완료된 공구는 참여자만 확인 가능합니다.<br />
                  지금 진행중인 공구에 참여해보세요!
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    로그인하기
                  </Button>
                  <Button 
                    onClick={() => router.push('/group-purchases')}
                    variant="outline"
                    className="w-full"
                  >
                    진행중인 공구 둘러보기
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  접근 권한이 없습니다
                </h2>
                <p className="text-gray-600 mb-6">
                  해당 공구 참여자만 확인 가능합니다.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push('/group-purchases')}
                    className="w-full"
                  >
                    진행중인 공구 둘러보기
                  </Button>
                  <Button 
                    onClick={() => router.back()}
                    variant="outline"
                    className="w-full"
                  >
                    이전 페이지로
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 접근 가능한 경우 children 렌더링
  return <>{children}</>;
}