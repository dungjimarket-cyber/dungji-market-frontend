'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Link2, X } from 'lucide-react';
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
  const { toast } = useToast();
  const groupBuyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/groupbuys/${groupBuyId}`;

  const handleShareKakao = () => {
    if (typeof window !== 'undefined' && window.Kakao) {
      window.Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title: `${productName} 공동구매 모집중!`,
          description: '둥지마켓에서 함께 구매하고 할인받으세요!',
          imageUrl: productImage || `${window.location.origin}/logo.png`,
          link: {
            mobileWebUrl: groupBuyUrl,
            webUrl: groupBuyUrl,
          },
        },
        buttons: [
          {
            title: '공구 참여하기',
            link: {
              mobileWebUrl: groupBuyUrl,
              webUrl: groupBuyUrl,
            },
          },
        ],
      });
    } else {
      toast({
        variant: 'destructive',
        title: '카카오톡 공유 실패',
        description: '카카오톡 공유 기능을 사용할 수 없습니다.',
      });
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

  const handleViewDetail = () => {
    onOpenChange(false);
    window.location.href = `/groupbuys/${groupBuyId}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">공구 등록 완료! 🎉</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90">
            상품 구매가 필요한 친구와 지인에게 공유하고,
            <br />
            세상에 없던 혜택을 경험해 보세요!
          </p>
        </div>

        {/* 상품 정보 */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {productImage && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-2">{productName}</h3>
              <p className="text-sm text-gray-500 mt-1">공구 번호: #{groupBuyId}</p>
            </div>
          </div>

          {/* 공유 버튼들 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-3">공구를 공유하세요</h4>
            
            <button
              onClick={handleShareKakao}
              className="w-full flex items-center justify-center gap-3 p-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              카카오톡으로 공유하기
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-3 p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <Link2 className="w-5 h-5" />
              링크 복사하기
            </button>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-6">
            <Button
              onClick={handleViewDetail}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              공구 보러가기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}