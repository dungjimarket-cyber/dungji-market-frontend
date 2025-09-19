'use client';

import { MapPin, Edit2, Star, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProfileSection() {
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
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1">
          {/* 닉네임과 평점 */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-semibold truncate">
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
            <span className="truncate">{user.address_region?.full_name || '지역 설정 필요'}</span>
          </div>
        </div>

        <div className="flex gap-1.5 sm:gap-2">
          {/* 신고관리 버튼 - 빨간색 톤, 모바일에서 더 작게 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/used/mypage/reports')}
            className="border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 h-auto whitespace-nowrap"
          >
            신고관리
          </Button>

          {/* 프로필 수정 버튼 - 회색 톤, 모바일에서 더 작게 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditProfile}
            className="gap-1 sm:gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 h-auto whitespace-nowrap"
          >
            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline sm:inline">내정보 설정</span>
            <span className="xs:hidden">설정</span>
          </Button>
        </div>
      </div>
    </div>
  );
}