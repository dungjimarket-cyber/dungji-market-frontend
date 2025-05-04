"use client"

/**
 * 리뷰 목록 표시 컴포넌트
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getGroupbuyReviews, deleteReview, reportReview } from '@/lib/review-service';
import StarRating from '../ui/StarRating';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Calendar, Flag, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import ReviewForm from './ReviewForm';
import { toast } from 'sonner';

/**
 * 리뷰 타입 정의
 */
export interface Review {
  id: number;
  user: number;
  user_name: string;
  user_avatar?: string;
  groupbuy: number;
  rating: number;
  content: string;
  is_purchased: boolean;
  created_at: string;
  updated_at: string;
}

interface ReviewListProps {
  /** 리뷰를 표시할 그룹구매 ID */
  groupbuyId: number | string;
  /** 새 리뷰 작성 폼 표시 여부 */
  showReviewForm?: boolean;
}

/**
 * 리뷰 목록 표시 컴포넌트
 * 
 * @example
 * <ReviewList groupbuyId={123} showReviewForm={true} />
 */
const ReviewList: React.FC<ReviewListProps> = ({
  groupbuyId,
  showReviewForm = true,
}) => {
  const { user, isAuthenticated, accessToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState<boolean>(false);
  const [isWriteFormOpen, setIsWriteFormOpen] = useState<boolean>(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);

  /**
   * 리뷰 목록 불러오기
   */
  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getGroupbuyReviews(groupbuyId);
      setReviews(data.reviews || []);
      setAvgRating(data.avg_rating || 0);
      setReviewCount(data.count || 0);
    } catch (error: any) {
      setError(error.message || '리뷰를 불러오는 중 오류가 발생했습니다.');
      console.error('리뷰 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 리뷰 삭제 처리
   */
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('정말 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      await deleteReview(reviewId);
      toast.success('리뷰가 삭제되었습니다.');
      // 삭제 후 목록 갱신
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || '리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 리뷰 수정 시작
   */
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsEditFormOpen(true);
  };

  /**
   * 리뷰 신고 처리
   */
  const handleReportSubmit = async () => {
    if (!reportingReviewId || !reportReason.trim()) {
      toast.error('신고 사유를 입력해주세요.');
      return;
    }
    
    try {
      await reportReview(reportingReviewId, reportReason);
      toast.success('리뷰가 신고되었습니다.');
      setIsReportDialogOpen(false);
      setReportReason('');
      setReportingReviewId(null);
    } catch (error: any) {
      toast.error(error.message || '리뷰 신고 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 리뷰 목록 로드
  useEffect(() => {
    if (groupbuyId) {
      fetchReviews();
    }
  }, [groupbuyId]);

  // 내가 이미 리뷰를 작성했는지 확인
  // review.user는 number 타입, user.id는 다른 타입일 수 있으므로 문자열로 변환하여 비교
  const myReview = user?.id ? reviews.find(review => String(review.user) === String(user.id)) : null;
  const canWriteReview = !myReview && showReviewForm && isAuthenticated;

  // 날짜 형식 변환 함수
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 로딩 중 표시
  if (loading && reviews.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">리뷰 목록을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 표시
  if (error && reviews.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => fetchReviews()}
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 리뷰 요약 정보 헤더 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold">{avgRating.toFixed(1)}</div>
          <StarRating initialRating={avgRating} readOnly size="md" />
          <div className="text-sm text-gray-500">
            ({reviewCount}개 리뷰)
          </div>
        </div>
        
        {canWriteReview && (
          <Button
            onClick={() => setIsWriteFormOpen(true)}
          >
            리뷰 작성
          </Button>
        )}
        
        {myReview && (
          <Button
            variant="outline"
            onClick={() => handleEditReview(myReview)}
          >
            내 리뷰 수정
          </Button>
        )}
      </div>
      
      {/* 새 리뷰 작성 폼 */}
      {isWriteFormOpen && (
        <div className="mb-6">
          <ReviewForm
            groupbuyId={groupbuyId}
            onComplete={() => {
              fetchReviews();
              setIsWriteFormOpen(false);
            }}
            onCancel={() => setIsWriteFormOpen(false)}
          />
        </div>
      )}
      
      {/* 리뷰 목록 */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="p-6 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">아직 리뷰가 없습니다.</p>
            {canWriteReview && (
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setIsWriteFormOpen(true)}
              >
                첫 리뷰 작성하기
              </Button>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {review.user_avatar && (
                      <AvatarImage src={review.user_avatar} alt={review.user_name} />
                    )}
                    <AvatarFallback>
                      {review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{review.user_name}</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <StarRating initialRating={review.rating} readOnly size="sm" />
                      <span>{review.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">메뉴</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user?.id && String(user.id) === String(review.user) ? (
                        <>
                          <DropdownMenuItem onClick={() => handleEditReview(review)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>수정</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteReview(review.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>삭제</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setReportingReviewId(review.id);
                              setIsReportDialogOpen(true);
                            }}
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            <span>신고</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-gray-800 whitespace-pre-line">{review.content}</p>
                {review.is_purchased && (
                  <div className="mt-2 inline-block text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    구매 인증
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* 리뷰 수정 다이얼로그 */}
      <Dialog
        open={isEditFormOpen}
        onOpenChange={(open) => {
          setIsEditFormOpen(open);
          if (!open) setEditingReview(null);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>리뷰 수정</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <ReviewForm
              groupbuyId={groupbuyId}
              reviewId={editingReview.id}
              initialRating={editingReview.rating}
              initialContent={editingReview.content}
              initialIsPurchased={editingReview.is_purchased}
              onComplete={() => {
                fetchReviews();
                setIsEditFormOpen(false);
              }}
              onCancel={() => setIsEditFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* 리뷰 신고 다이얼로그 */}
      <Dialog
        open={isReportDialogOpen}
        onOpenChange={(open) => {
          setIsReportDialogOpen(open);
          if (!open) {
            setReportReason('');
            setReportingReviewId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>리뷰 신고</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              이 리뷰를 신고하는 이유를 선택하거나 작성해주세요.
            </p>
            <div className="space-y-2">
              {['욕설/비방', '허위/과장', '광고/홍보', '음란성', '기타'].map((reason) => (
                <div
                  key={reason}
                  className={`p-2 border rounded-md cursor-pointer ${
                    reportReason === reason ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setReportReason(reason)}
                >
                  {reason}
                </div>
              ))}
              
              <textarea
                className="w-full border rounded-md p-2 mt-2"
                placeholder="기타 사유를 직접 입력해주세요."
                rows={4}
                value={reportReason === '기타' ? '' : reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                disabled={reportReason === '욕설/비방' || reportReason === '허위/과장' || reportReason === '광고/홍보' || reportReason === '음란성'}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsReportDialogOpen(false)}
              >
                취소
              </Button>
              <Button
                disabled={!reportReason.trim()}
                onClick={handleReportSubmit}
              >
                신고하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewList;
