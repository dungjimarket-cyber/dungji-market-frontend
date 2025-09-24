'use client';

import { useState, useEffect } from 'react';
import { Star, StarIcon, User, Shield, AlertTriangle, Clock, ThumbsUp, MessageCircle, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getUserRating, UserRating } from '@/lib/api/used/reportApi';
import ReportModal from './ReportModal';

interface UserProfileRatingProps {
  userId: number;
  username: string;
  nickname?: string;
  showReportButton?: boolean;
  phoneId?: number;
  phoneModel?: string;
}

const RATING_LABELS = {
  5: '매우 만족',
  4: '만족',
  3: '보통',
  2: '불만족',
  1: '매우 불만족',
};

const getTagIcon = (tag: string) => {
  switch (tag) {
    case 'is_punctual': return Clock;
    case 'is_friendly': return ThumbsUp;
    case 'is_honest': return UserCheck;
    case 'is_fast_response': return MessageCircle;
    default: return ThumbsUp;
  }
};

const getTagLabel = (tag: string) => {
  switch (tag) {
    case 'is_punctual': return '시간약속 준수';
    case 'is_friendly': return '친절함';
    case 'is_honest': return '정직한거래';
    case 'is_fast_response': return '빠른응답';
    default: return tag;
  }
};

export default function UserProfileRating({
  userId,
  username,
  nickname,
  showReportButton = true,
  phoneId,
  phoneModel,
}: UserProfileRatingProps) {
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    fetchUserRating();
  }, [userId]);

  const fetchUserRating = async () => {
    try {
      setIsLoading(true);
      const data = await getUserRating(userId);
      setUserRating(data);
    } catch (error) {
      console.error('사용자 평점 조회 실패:', error);
      toast.error('사용자 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderReviewTags = (review: any) => {
    const tags = [];
    if (review.is_punctual) tags.push('is_punctual');
    if (review.is_friendly) tags.push('is_friendly');
    if (review.is_honest) tags.push('is_honest');
    if (review.is_fast_response) tags.push('is_fast_response');

    return tags.map((tag) => {
      const IconComponent = getTagIcon(tag);
      return (
        <Badge key={tag} variant="outline" className="text-xs">
          <IconComponent className="h-3 w-3 mr-1" />
          {getTagLabel(tag)}
        </Badge>
      );
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-3 bg-gray-200 rounded animate-pulse mt-2"></div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!userRating) {
    return null;
  }

  const displayName = nickname || username;
  const reviews = showAllReviews ? userRating.recent_reviews : userRating.recent_reviews.slice(0, 3);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{displayName}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {userRating.average_rating ? (
                    <>
                      <div className="flex items-center gap-1">
                        {renderStars(Math.round(userRating.average_rating))}
                      </div>
                      <span className="text-sm font-medium">
                        {userRating.average_rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({userRating.total_reviews}개 평가)
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">평가 없음</span>
                  )}
                </div>
              </div>
            </div>
            {showReportButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReportModal(true)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                신고
              </Button>
            )}
          </div>
        </CardHeader>

        {userRating.penalty_status.has_penalty && (
          <CardContent className="pt-0">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">제재 대상 사용자</p>
                  <p className="text-red-700 mt-1">
                    {userRating.penalty_status.penalty_type}: {userRating.penalty_status.reason}
                  </p>
                  {userRating.penalty_status.end_date && (
                    <p className="text-red-600 text-xs mt-1">
                      제재 종료: {new Date(userRating.penalty_status.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* 세부 평가 항목 통계 */}
        {userRating.review_stats && userRating.total_reviews > 0 && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">평가 항목 통계</h4>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const tags = [
                    { key: 'is_punctual' as const, label: '약속을지켜요', icon: Clock },
                    { key: 'is_friendly' as const, label: '친절해요', icon: ThumbsUp },
                    { key: 'is_honest' as const, label: '믿을만해요', icon: UserCheck },
                    { key: 'is_fast_response' as const, label: '응답이빨라요', icon: MessageCircle },
                  ];

                  return tags.map(tag => {
                    const stats = userRating.review_stats![tag.key];
                    const Icon = tag.icon;

                    return (
                      <div key={tag.key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 truncate">{tag.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${stats.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{stats.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </CardContent>
        )}

        {userRating.recent_reviews.length > 0 && (
          <CardContent className="pt-0">
            <Separator className="mb-4" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">최근 받은 평가</h4>
                {userRating.recent_reviews.length > 3 && !showAllReviews && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllReviews(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    모두 보기
                  </Button>
                )}
              </div>

              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {review.reviewer_username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{review.reviewer_username}</span>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {RATING_LABELS[review.rating as keyof typeof RATING_LABELS]}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{review.phone_model}</p>

                  {review.comment && (
                    <p className="text-sm mb-2">{review.comment}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {renderReviewTags(review)}
                  </div>
                </div>
              ))}

              {showAllReviews && userRating.recent_reviews.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllReviews(false)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  접기
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={userId}
        reportedUserName={displayName}
        phoneId={phoneId}
        phoneModel={phoneModel}
        onReportComplete={() => {
          toast.success('신고가 접수되었습니다.');
        }}
      />
    </>
  );
}