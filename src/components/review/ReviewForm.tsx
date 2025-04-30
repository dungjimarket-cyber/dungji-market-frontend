"use client"

/**
 * 리뷰 작성 및 수정 폼 컴포넌트
 */
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createReview, updateReview } from '@/lib/review-service';
import StarRating from '../ui/StarRating';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface ReviewFormProps {
  /** 리뷰를 작성할 그룹구매 ID */
  groupbuyId: number | string;
  /** 수정할 리뷰 ID (수정 모드에서만 사용) */
  reviewId?: number | string;
  /** 초기 별점 (수정 모드에서만 사용) */
  initialRating?: number;
  /** 초기 내용 (수정 모드에서만 사용) */
  initialContent?: string;
  /** 초기 구매 여부 (수정 모드에서만 사용) */
  initialIsPurchased?: boolean;
  /** 리뷰 작성/수정 완료 후 호출될 콜백 함수 */
  onComplete?: () => void;
  /** 작성 취소 시 호출될 콜백 함수 */
  onCancel?: () => void;
}

/**
 * 리뷰 작성 및 수정 폼 컴포넌트
 * 
 * @example
 * // 새 리뷰 작성
 * <ReviewForm groupbuyId={123} onComplete={() => fetchReviews()} />
 * 
 * // 기존 리뷰 수정
 * <ReviewForm
 *   groupbuyId={123}
 *   reviewId={456}
 *   initialRating={4}
 *   initialContent="좋은 상품이에요!"
 *   initialIsPurchased={true}
 *   onComplete={() => fetchReviews()}
 * />
 */
const ReviewForm: React.FC<ReviewFormProps> = ({
  groupbuyId,
  reviewId,
  initialRating = 5,
  initialContent = '',
  initialIsPurchased = false,
  onComplete,
  onCancel,
}) => {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState<number>(initialRating);
  const [content, setContent] = useState<string>(initialContent);
  const [isPurchased, setIsPurchased] = useState<boolean>(initialIsPurchased);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const isEditMode = !!reviewId;

  /**
   * 폼 제출 처리
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    if (rating < 1) {
      toast.error('별점을 선택해주세요.');
      return;
    }
    
    if (!content.trim()) {
      toast.error('리뷰 내용을 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reviewData = {
        groupbuy: groupbuyId,
        rating,
        content: content.trim(),
        is_purchased: isPurchased,
      };
      
      if (isEditMode && reviewId) {
        // 리뷰 수정
        await updateReview(reviewId, {
          rating,
          content: content.trim(),
          is_purchased: isPurchased,
        });
        toast.success('리뷰가 수정되었습니다.');
      } else {
        // 새 리뷰 작성
        await createReview(reviewData);
        toast.success('리뷰가 등록되었습니다.');
      }
      
      // 성공 시 콜백 호출 및 폼 초기화
      onComplete && onComplete();
      if (!isEditMode) {
        setRating(5);
        setContent('');
        setIsPurchased(false);
      }
    } catch (error: any) {
      toast.error(error.message || '리뷰 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그인 상태가 아닌 경우
  if (status !== 'authenticated') {
    return (
      <div className="p-4 text-center border rounded-lg bg-gray-50">
        <p className="text-gray-600">리뷰를 작성하려면 로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <div>
        <h3 className="text-lg font-medium mb-2">
          {isEditMode ? '리뷰 수정하기' : '리뷰 작성하기'}
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">별점:</span>
          <StarRating
            initialRating={rating}
            onChange={setRating}
            size="lg"
          />
          <span className="text-sm text-gray-600 ml-2">{rating}/5</span>
        </div>
      </div>
      
      <div>
        <Textarea
          placeholder="리뷰 내용을 입력해주세요. (최소 10자 이상)"
          minLength={10}
          maxLength={500}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {content.length}/500자
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPurchased"
          checked={isPurchased}
          onCheckedChange={(checked) => setIsPurchased(checked as boolean)}
        />
        <Label htmlFor="isPurchased" className="text-sm">
          이 상품을 실제로 구매/사용했습니다.
        </Label>
      </div>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !content.trim() || rating < 1}
        >
          {isSubmitting 
            ? '저장 중...' 
            : isEditMode 
              ? '리뷰 수정' 
              : '리뷰 등록'}
        </Button>
      </div>
    </form>
  );
};

export default ReviewForm;
