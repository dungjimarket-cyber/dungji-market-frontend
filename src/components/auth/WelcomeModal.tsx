'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { CheckCircle, Briefcase } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'buyer' | 'seller' | 'expert';
}

/**
 * 회원가입 완료 후 환영 모달
 * - 일반회원: 마이페이지로 이동
 * - 일반사업자: 견적이용권 10매 증정 안내 + 마이페이지로 이동
 * - 전문가: 간단한 환영 + 상담활동 가능 안내
 */
export function WelcomeModal({ isOpen, onClose, userRole }: WelcomeModalProps) {
  const router = useRouter();

  const handleGoToMyPage = () => {
    onClose();
    router.push('/mypage');
  };

  const handleStart = () => {
    onClose();
    router.push('/local-businesses');
  };

  // 역할별 타이틀
  const getRoleTitle = () => {
    switch (userRole) {
      case 'seller':
        return '일반사업자';
      case 'expert':
        return '전문가';
      default:
        return '일반회원';
    }
  };

  // 역할별 안내 메시지
  const getRoleMessage = () => {
    switch (userRole) {
      case 'seller':
        return '공구에 견적을 제안하고 대량 판매 기회를 잡으세요!';
      case 'expert':
        return '지금 바로 고객의 상담 요청에 답변할 수 있습니다.';
      default:
        return '공구 참여, 상담 신청, 중고거래를 이용해보세요!';
    }
  };

  // 전문가용 깔끔한 모달
  if (userRole === 'expert') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-0 shadow-lg">
          <VisuallyHidden>
            <DialogTitle>전문가 가입 완료</DialogTitle>
          </VisuallyHidden>
          <div className="bg-white rounded-xl">
            {/* 상단 아이콘 영역 */}
            <div className="pt-8 pb-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 rounded-full px-3 py-1 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                가입 완료
              </div>
            </div>

            {/* 메시지 영역 */}
            <div className="px-6 pb-6 text-center">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                전문가 회원 가입이 완료되었습니다!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                고객 상담이 등록되면<br />알림으로 안내해 드리겠습니다.
              </p>

              {/* 버튼 */}
              <Button
                onClick={handleStart}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
              >
                시작하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>둥지마켓 회원가입 환영</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          {/* Header */}
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 px-6 pt-6 pb-4 text-white text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{getRoleTitle()} 가입완료</span>
            </div>
            <h2 className="text-xl font-bold">
              둥지마켓에 오신 것을 환영합니다!
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* 판매자 전용: 견적이용권 안내 */}
            {userRole === 'seller' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎟️</span>
                  <div>
                    <p className="font-bold text-gray-800">견적이용권 10매 지급!</p>
                    <p className="text-sm text-gray-600">오픈기념 이벤트</p>
                  </div>
                </div>
              </div>
            )}

            {/* 안내 메시지 */}
            <p className="text-center text-gray-600 mb-6">
              {getRoleMessage()}
            </p>

            {/* 버튼 */}
            <Button
              onClick={handleGoToMyPage}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              마이페이지로 이동
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
