'use client';

import { MapPin, Edit2, Star, AlertTriangle, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ProfileSectionProps {
  onFavoritesClick?: () => void;
  onReviewsClick?: () => void;
  favoritesCount?: number;
  reviewsCount?: number;
}

export default function ProfileSection({
  onFavoritesClick,
  onReviewsClick,
  favoritesCount = 0,
  reviewsCount = 0
}: ProfileSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState<{ avg_rating: number; total_reviews: number } | null>(null);

  useEffect(() => {
    // 사용자 평점 조회
    const fetchRating = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/used/reviews/user-stats/`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.total_reviews > 0) {
          setRating({
            avg_rating: response.data.avg_rating,
            total_reviews: response.data.total_reviews
          });
        }
      } catch (error) {
        console.error('Failed to fetch user rating:', error);
      }
    };

    if (user) {
      fetchRating();
    }
  }, [user]);

  const handleEditProfile = () => {
    router.push('/mypage');
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* 닉네임과 평점 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-semibold">
              {user.nickname || user.username || '닉네임 설정 필요'}
            </h2>
            {rating ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs sm:text-sm font-medium">
                  {rating.avg_rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({rating.total_reviews})
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 flex-shrink-0">
                아직 거래후기가 없습니다
              </span>
            )}
          </div>

          {/* 주요활동지역 */}
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{user.address_region?.full_name || '지역 설정 필요'}</span>
          </div>
        </div>

        {/* PC에서만 표시되는 찜/후기 버튼 */}
        <div className="hidden sm:flex items-center gap-2">
          {onFavoritesClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFavoritesClick}
              className="flex items-center gap-1 bg-white hover:bg-gray-50 text-xs"
            >
              <Heart className="w-3 h-3 text-red-500" />
              찜 목록
              <span className="text-gray-600">({favoritesCount})</span>
            </Button>
          )}
          {onReviewsClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReviewsClick}
              className="flex items-center gap-1 bg-white hover:bg-gray-50 text-xs"
            >
              <MessageSquare className="w-3 h-3" />
              거래후기
              <span className="text-gray-600">({reviewsCount})</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}