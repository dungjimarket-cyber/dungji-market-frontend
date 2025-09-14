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
import axios from 'axios';
import { toast } from 'sonner';

interface TradeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
  isSeller: boolean;
  partnerName: string;
  phoneModel: string;
  onReviewComplete?: () => void;
}

export default function TradeReviewModal({
  isOpen,
  onClose,
  transactionId,
  isSeller,
  partnerName,
  phoneModel,
  onReviewComplete,
}: TradeReviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 평가 태그 옵션 (역할별)
  const getReviewTags = () => {
    if (isSeller) {
      // 판매자가 구매자를 평가
      return [
        { id: 'is_punctual', label: '시간 약속을 잘 지켜요', icon: Clock },
        { id: 'is_friendly', label: '친절하고 매너가 좋아요', icon: ThumbsUp },
        { id: 'is_fast_response', label: '응답이 빨라요', icon: MessageCircle },
      ];
    } else {
      // 구매자가 판매자를 평가
      return [
        { id: 'is_honest', label: '상품 설명이 정확해요', icon: UserCheck },
        { id: 'is_friendly', label: '친절하고 매너가 좋아요', icon: ThumbsUp },
        { id: 'is_punctual', label: '시간 약속을 잘 지켜요', icon: Clock },
        { id: 'is_fast_response', label: '응답이 빨라요', icon: MessageCircle },
      ];
    }
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
      const token = localStorage.getItem('accessToken');

      // 선택된 태그를 boolean 필드로 변환
      const tagData: any = {};
      getReviewTags().forEach(tag => {
        tagData[tag.id] = selectedTags.includes(tag.id);
      });

      const requestData = {
        transaction: transactionId,
        rating,
        comment: comment.trim() || undefined,
        ...tagData,
      };

      console.log('Review POST request data:', requestData);
      console.log('Review POST URL:', `${process.env.NEXT_PUBLIC_API_URL}/used/reviews/`);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/used/reviews/`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

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

          {/* 평가 태그 선택 */}
          <div>
            <Label className="text-xs">어떤 점이 좋았나요? (선택)</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {getReviewTags().map((tag) => {
                const Icon = tag.icon;
                return (
                  <button
                    key={tag.id}
                    className={`flex items-center gap-1.5 p-2 rounded-md border text-xs transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
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
                    <Checkbox
                      checked={selectedTags.includes(tag.id)}
                      onCheckedChange={() => {}}
                      className="pointer-events-none h-3 w-3"
                    />
                    <Icon className="h-3 w-3 text-gray-500" />
                    <span className="flex-1 text-left">
                      {tag.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 텍스트 후기 (선택) */}
          <div>
            <Label htmlFor="comment" className="text-xs">
              후기 (선택)
              <span className="ml-1 text-gray-500">
                {comment.length}/100
              </span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setComment(e.target.value);
                }
              }}
              placeholder="간단한 후기를 남겨주세요"
              rows={2}
              maxLength={100}
              className="text-xs mt-1"
            />
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