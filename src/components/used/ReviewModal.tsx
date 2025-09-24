'use client';

import { useState } from 'react';
import { X, Star, Check, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { reviewAPI } from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';
import { useToast } from '@/hooks/use-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
  offerId?: number; // offer_id 추가
  revieweeName: string;
  productInfo?: {
    brand: string;
    model: string;
    price: number;
  };
  itemType?: 'phone' | 'electronics';
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  transactionId,
  offerId,
  revieweeName,
  productInfo,
  itemType = 'phone',
  onSuccess,
}: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPunctual, setIsPunctual] = useState(true);
  const [isFriendly, setIsFriendly] = useState(true);
  const [isHonest, setIsHonest] = useState(true);
  const [isFastResponse, setIsFastResponse] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('ReviewModal handleSubmit - transactionId:', transactionId);
    console.log('ReviewModal handleSubmit - offerId:', offerId);
    console.log('ReviewModal handleSubmit - itemType:', itemType);

    try {
      setIsSubmitting(true);

      const reviewData = {
        rating,
        comment: comment.trim() || '좋은 거래였습니다.',
        is_punctual: isPunctual,
        is_friendly: isFriendly,
        is_honest: isHonest,
        is_fast_response: isFastResponse,
      };

      // 아이템 타입에 따라 다른 API 호출
      if (itemType === 'electronics') {
        await electronicsApi.createReview(transactionId, {
          ...reviewData,
          offer_id: offerId, // 전자제품의 경우 offer_id 추가
        });
      } else {
        await reviewAPI.createReview(transactionId, reviewData);
      }

      toast({
        title: '후기 작성 완료',
        description: '거래 후기가 성공적으로 등록되었습니다.',
      });

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to create review:', error);
      toast({
        title: '후기 작성 실패',
        description: error.response?.data?.error || '후기 작성 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(5);
    setComment('');
    setIsPunctual(true);
    setIsFriendly(true);
    setIsHonest(true);
    setIsFastResponse(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold">거래 후기</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 상품 정보 & 거래 상대방 */}
          {productInfo && (
            <div className="space-y-1">
              <div className="font-medium text-sm truncate" title={`${productInfo.brand} ${productInfo.model}`}>
                {productInfo.brand} {productInfo.model}
              </div>
              <div className="text-gray-600 text-sm">
                {revieweeName ? `${revieweeName}님과의 거래` : '거래 상대방'}
              </div>
            </div>
          )}

          {/* 별점 */}
          <div className="text-center">
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-0.5 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 5 && '매우 만족'}
              {rating === 4 && '만족'}
              {rating === 3 && '보통'}
              {rating === 2 && '불만족'}
              {rating === 1 && '매우 불만족'}
            </p>
          </div>

          {/* 평가 항목 - 2x2 그리드 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsPunctual(!isPunctual)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                isPunctual
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span>약속을지켜요</span>
              {isPunctual && <Check className="w-3 h-3 text-green-600" />}
            </button>
            <button
              onClick={() => setIsFriendly(!isFriendly)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                isFriendly
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span>친절해요</span>
              {isFriendly && <Check className="w-3 h-3 text-green-600" />}
            </button>
            <button
              onClick={() => setIsHonest(!isHonest)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                isHonest
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span>믿을만해요</span>
              {isHonest && <Check className="w-3 h-3 text-green-600" />}
            </button>
            <button
              onClick={() => setIsFastResponse(!isFastResponse)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                isFastResponse
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <span>응답이빨라요</span>
              {isFastResponse && <Check className="w-3 h-3 text-green-600" />}
            </button>
          </div>

          {/* 후기 내용 - 선택사항 */}
          <div>
            <Textarea
              placeholder="거래 경험을 공유해주세요 (선택사항, 최대 100자)"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setComment(e.target.value);
                }
              }}
              maxLength={100}
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/100자
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 h-9 text-sm"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 h-9 text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? '작성 중...' : '후기 등록'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}