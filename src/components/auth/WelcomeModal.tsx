'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Gift, Eye, Gavel, CheckCircle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'buyer' | 'seller';
}

/**
 * 회원가입 완료 후 환영 모달
 */
export function WelcomeModal({ isOpen, onClose, userRole }: WelcomeModalProps) {
  const router = useRouter();

  const handleCreateGroupBuy = () => {
    onClose();
    router.push('/group-purchases/create');
  };

  const handleBrowseGroupBuys = () => {
    onClose();
    router.push('/group-purchases');
  };

  const handleBidGroupBuys = () => {
    onClose();
    router.push('/group-purchases?tab=popular');
  };

  const handleBrowseUsed = () => {
    onClose();
    router.push('/used');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>둥지마켓 회원가입 환영</DialogTitle>
        </VisuallyHidden>
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 px-6 pt-6 pb-4 text-white text-center">
            <h2 className="text-xl font-bold">
              둥지마켓 회원이 되신것을 환영합니다!
            </h2>
          </div>

          {/* Event banner - sellers only */}
          {userRole === 'seller' && (
            <div className="mx-4 -mt-2 relative z-10">
              <div className="bg-gradient-to-r from-orange-400 to-pink-400 rounded-full py-2 px-4 text-white text-center font-medium">
                🎁 오픈기념 가입 이벤트!
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6 pt-4">
            {userRole === 'seller' ? (
              <>
                {/* Reward card for sellers */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎟️</span>
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">견적이용권 10매 증정 완료!</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">지급 완료</span>
                    </div>
                  </div>
                </div>

                {/* Main message for sellers */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    숨겨진 고수들의 향연! 🚀
                  </h3>
                  <p className="text-gray-600">
                    공구 견적에 참여하고,
                    <br />
                    <span className="text-pink-600 font-semibold">대량 판매 기회</span>를 획득하세요!
                  </p>
                </div>

                {/* Action buttons for sellers */}
                <div className="space-y-3">
                  <Button
                    onClick={handleBidGroupBuys}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Gavel className="mr-2 h-5 w-5" />
                    견적 제안하기
                  </Button>

                  <Button
                    onClick={handleBrowseGroupBuys}
                    variant="ghost"
                    className="w-full"
                    size="lg"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    공구 둘러보기
                  </Button>
                </div>

                {/* 중고거래 섹션 - 모든 회원 공통 */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">중고거래</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        쉽고 빠른 중고거래
                      </p>
                      <Button
                        onClick={handleBrowseUsed}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        중고 둘러보기
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Main message for buyers */}
                <div className="text-center mb-6 mt-8">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    혼자보다 함께! 🤝
                  </h3>
                  <p className="text-gray-600">
                    공동구매로 누리는
                    <br />
                    <span className="text-pink-600 font-semibold">놀라운 혜택</span>을 경험하세요!
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    지금 바로 참여해보세요!
                  </p>
                </div>

                {/* Action buttons for buyers */}
                <div className="space-y-3 mt-8">
                  <Button
                    onClick={handleCreateGroupBuy}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Gift className="mr-2 h-5 w-5" />
                    공구 만들기
                  </Button>

                  <Button
                    onClick={handleBrowseGroupBuys}
                    variant="ghost"
                    className="w-full"
                    size="lg"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    공구 둘러보기
                  </Button>
                </div>

                {/* 중고거래 섹션 - 모든 회원 공통 */}
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">중고거래</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        쉽고 빠른 중고거래
                      </p>
                      <Button
                        onClick={handleBrowseUsed}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        중고 둘러보기
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}