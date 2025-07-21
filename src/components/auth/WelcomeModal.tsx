'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, TrendingUp, ShoppingBag, Gavel } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'user' | 'seller';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {userRole === 'user' ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-center">
                둥지마켓 회원이 되신것을 환영합니다!
              </DialogTitle>
              <DialogDescription className="text-center space-y-2 text-base">
                <p className="font-semibold text-gray-800">
                  혼자보다 함께! 공동구매로 누리는 놀라운 혜택!
                </p>
                <p className="text-gray-600">
                  지금 바로 참여해보세요!
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                onClick={handleCreateGroupBuy}
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 py-4"
              >
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="font-medium">공구 만들기</span>
              </Button>
              <Button
                onClick={handleBrowseGroupBuys}
                className="h-auto flex flex-col items-center gap-2 py-4"
              >
                <ShoppingBag className="w-6 h-6" />
                <span className="font-medium">공구 둘러보기</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-purple-600" />
              </div>
              <DialogTitle className="text-2xl font-bold text-center">
                둥지마켓 회원이 되신것을 환영합니다!
              </DialogTitle>
              <DialogDescription className="text-center space-y-2 text-base">
                <p className="font-semibold text-purple-600 text-lg">
                  오픈기념 가입 이벤트!
                </p>
                <p className="font-bold text-green-600 text-xl">
                  입찰권 5매 증정 완료!
                </p>
                <p className="text-gray-800 font-medium">
                  숨겨진 고수들의 항연!
                </p>
                <p className="text-gray-600">
                  공구 입찰에 참여하고, 대량 판매 기회를 획득하세요!
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                onClick={handleBidGroupBuys}
                className="h-auto flex flex-col items-center gap-2 py-4"
              >
                <Gavel className="w-6 h-6" />
                <span className="font-medium">공구 입찰하기</span>
              </Button>
              <Button
                onClick={handleBrowseGroupBuys}
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 py-4"
              >
                <ShoppingBag className="w-6 h-6 text-blue-600" />
                <span className="font-medium">공구 둘러보기</span>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}