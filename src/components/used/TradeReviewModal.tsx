'use client';

import { useState } from 'react';
import { Star, ThumbsUp, Clock, MessageCircle, UserCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { reviewAPI } from '@/lib/api/used';
import electronicsApi from '@/lib/api/electronics';
import { toast } from 'sonner';

interface TradeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
  offerId?: number; // offer_id 추가
  isSeller: boolean;
  partnerName: string;
  phoneModel: string;
  itemType?: 'phone' | 'electronics';
  onReviewComplete?: () => void;
}

export default function TradeReviewModal({
  isOpen,
  onClose,
  transactionId,
  offerId,
  isSeller,
  partnerName,
  phoneModel,
  itemType = 'phone',
  onReviewComplete,
}: TradeReviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 평가 태그 옵션 (통일)
  const getReviewTags = () => {
    return [
      { id: 'is_punctual', label: '약속을지켜요', icon: Clock },
      { id: 'is_friendly', label: '친절해요', icon: ThumbsUp },
      { id: 'is_honest', label: '믿을만해요', icon: UserCheck },
      { id: 'is_fast_response', label: '응답이빨라요', icon: MessageCircle },
    ];
  };

  const handleSubmit = async () => {
    console.log('Review submit - transactionId:', transactionId);
    console.log('Review submit - typeof transactionId:', typeof transactionId);

    if (!transactionId || transactionId === 0) {
      toast.error('거래 정보를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      // 선택된 태그를 boolean 필드로 변환
      const tagData: any = {};
      getReviewTags().forEach(tag => {
        tagData[tag.id] = selectedTags.includes(tag.id);
      });

      const requestData = {
        rating,
        comment: comment.trim() || undefined,
        ...tagData,
      };

      console.log('Review POST request data:', requestData);
      console.log('Transaction ID:', transactionId);
      console.log('Item type:', itemType);

      // itemType에 따라 다른 API 사용
      let response;
      if (itemType === 'electronics') {
        // 전자제품의 경우 offer_id도 함께 전달
        response = await electronicsApi.createReview(transactionId, {
          ...requestData,
          offer_id: offerId,
        });
      } else {
        response = await reviewAPI.createReview(transactionId, requestData);
      }

      toast.success('평가가 완료되었습니다!');
      onReviewComplete?.();
      onClose();
    } catch (error: any) {
      console.error('평가 실패:', error);
      if (error.response?.data?.error?.includes('이미 리뷰')) {
        toast.error('이미 평가를 작성하셨습니다.');
      } else {
        toast.error(error.response?.data?.error || '평가 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingText = () => {
    switch (rating) {
      case 5: return '매우 만족';
      case 4: return '만족';
      case 3: return '보통';
      case 2: return '불만족';
      case 1: return '매우 불만족';
      default: return '';
    }
  };

  const getRatingColor = () => {
    if (rating >= 4) return 'text-green-600';
    if (rating === 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>거래 평가</DialogTitle>
          <DialogDescription>
            {partnerName}님과의 거래는 어떠셨나요?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 별점 평가 */}
          <div>
            <Label className="text-xs">거래 만족도</Label>
            <div className="flex items-center justify-center gap-0.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                  type="button"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className={`text-center text-xs font-medium ${getRatingColor()}`}>
              {getRatingText()}
            </p>
          </div>

          {/* 평가 태그 선택 - ReviewModal과 동일한 UI */}
          <div>
            <Label className="text-xs">어떤 점이 좋았나요? (선택)</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {getReviewTags().map((tag) => {
                const Icon = tag.icon;
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                      isSelected
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                    type="button"
                  >
                    <span>{tag.label}</span>
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 텍스트 후기 (선택) - ReviewModal과 동일 */}
          <div>
            <Label htmlFor="comment" className="text-xs">
              후기 내용 (선택사항)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setComment(e.target.value);
                }
              }}
              placeholder="거래 경험을 공유해주세요 (선택사항, 최대 100자)"
              rows={3}
              maxLength={100}
              className="resize-none text-sm mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              {comment.length}/100자
            </p>
          </div>

          {/* 안내 메시지 */}
          <p className="text-xs text-gray-500 text-center">
            평가는 수정할 수 없습니다
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            나중에
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '등록중' : '완료'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}