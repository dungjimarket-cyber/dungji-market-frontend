'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Share2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface GroupBuySuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupBuyId: number;
  productName: string;
  productImage?: string;
}

export function GroupBuySuccessDialog({
  open,
  onOpenChange,
  groupBuyId,
  productName,
  productImage
}: GroupBuySuccessDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const groupBuyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/groupbuys/${groupBuyId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${productName} 공동구매 모집중!`,
          text: '둥지마켓에서 함께 구매하고 할인받으세요!',
          url: groupBuyUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(groupBuyUrl);
      toast({
        title: '링크 복사 완료',
        description: '공구 링크가 클립보드에 복사되었습니다.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '링크 복사 실패',
        description: '링크를 복사할 수 없습니다.',
      });
    }
  };

  const handleLater = () => {
    onOpenChange(false);
    router.push('/group-purchases');
  };

  const handleClose = () => {
    onOpenChange(false);
    router.push('/group-purchases');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
          </div>

          {/* Title */}
          <h2 className="mb-4 text-2xl font-bold">등록 완료!</h2>

          {/* Description */}
          <p className="mb-2 text-gray-600">
            공구 등록이 완료되었습니다!
          </p>
          <p className="mb-8 text-gray-600">
            함께할 친구와 지인들을 초대해보세요~
          </p>

          {/* Notice */}
          <p className="mb-8 text-sm text-gray-500">
            더 많은 사람들이 모일수록
            <br />
            더 저렴하게 구매할 수 있어요!
          </p>

          {/* Buttons */}
          <div className="w-full space-y-3">
            <Button
              onClick={handleShare}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Share2 className="mr-2 h-5 w-5" />
              공구 초대하기
            </Button>
            
            <Button
              onClick={handleLater}
              variant="ghost"
              className="w-full"
              size="lg"
            >
              나중에 하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}