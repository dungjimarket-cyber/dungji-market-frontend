'use client';

import {
  MapPin,
  Edit2,
  Star,
  AlertTriangle,
  Heart,
  MessageSquare,
  Camera,
  Loader2,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
  reviewsCount = 0,
}: ProfileSectionProps) {
  const { user, accessToken, setUser } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState<{ avg_rating: number; total_reviews: number } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 사용자 평점 조회
    const fetchRating = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/used/reviews/user-stats/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.total_reviews > 0) {
          setRating({
            avg_rating: response.data.avg_rating,
            total_reviews: response.data.total_reviews,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user rating:', error);
      }
    };

    if (user) {
      fetchRating();
      setProfileImage((user as any)?.profile_image || null);
    }
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!accessToken) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지는 5MB 이하만 업로드 가능합니다.');
      return;
    }
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/image/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const nextImage = data.image_url || null;
        setProfileImage(nextImage);
        if (setUser && user) {
          const updatedUser = { ...(user as any), profile_image: nextImage };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('auth.user', JSON.stringify(updatedUser));
        }
      } else {
        alert(data.detail || '이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 이미지 업로드 오류:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditProfile = () => {
    router.push('/mypage');
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        {/* PC 레이아웃 */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity">
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : profileImage ? (
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-full h-full"
                    aria-label="프로필 이미지 미리보기"
                  >
                    <img src={profileImage} alt="프로필 이미지" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <User className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
                className="hidden"
              />
            </div>

            <div className="flex flex-col gap-2">
              {/* 닉네임과 평점 */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">
                  {user.nickname || user.username || '닉네임 설정 필요'}
                </h2>
                {rating ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{rating.avg_rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({rating.total_reviews})</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 flex-shrink-0">아직 거래후기가 없습니다</span>
                )}
              </div>

              {/* 주요활동지역 */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{user.address_region?.full_name || '지역 설정 필요'}</span>
              </div>
            </div>
          </div>

          {/* PC 찜/후기 버튼 */}
          <div className="flex items-center gap-2">
            {onFavoritesClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFavoritesClick}
                className="flex items-center gap-1 border-gray-300 hover:bg-gray-50 text-xs"
              >
                <Heart className="w-3 h-3 text-red-500" />
                <span className="text-gray-900">찜 목록</span>
                <span className="text-gray-600">({favoritesCount})</span>
              </Button>
            )}
            {onReviewsClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReviewsClick}
                className="flex items-center gap-1 border-gray-300 hover:bg-gray-50 text-xs"
              >
                <MessageSquare className="w-3 h-3 text-gray-700" />
                <span className="text-gray-900">거래후기</span>
              </Button>
            )}
          </div>
        </div>

        {/* 모바일 레이아웃 */}
        <div className="sm:hidden">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity">
                {isUploadingImage ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : profileImage ? (
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className="w-full h-full"
                    aria-label="프로필 이미지 미리보기"
                  >
                    <img src={profileImage} alt="프로필 이미지" className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <User className="w-7 h-7 text-gray-400" />
                )}
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {/* 닉네임과 평점 */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">
                  {user.nickname || user.username || '닉네임 설정 필요'}
                </h2>
                {rating ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{rating.avg_rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({rating.total_reviews})</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 flex-shrink-0">아직 거래후기가 없습니다</span>
                )}
              </div>

              {/* 주요활동지역 */}
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{user.address_region?.full_name || '지역 설정 필요'}</span>
              </div>
            </div>
          </div>

          {/* 찜/후기 버튼 */}
          <div className="flex items-center gap-2 justify-start mb-2">
            {onFavoritesClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFavoritesClick}
                className="flex items-center gap-1 border-gray-300 hover:bg-gray-50 text-xs px-2.5 py-1"
              >
                <Heart className="w-3 h-3 text-red-500" />
                <span className="text-gray-900">찜</span>
                <span className="text-gray-600">({favoritesCount})</span>
              </Button>
            )}
            {onReviewsClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReviewsClick}
                className="flex items-center gap-1 border-gray-300 hover:bg-gray-50 text-xs px-2.5 py-1"
              >
                <MessageSquare className="w-3 h-3 text-gray-700" />
                <span className="text-gray-900">후기</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 프로필 이미지 미리보기 모달 */}
      {isPreviewOpen && profileImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative max-w-[90vw] max-h-[80vh]">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-200"
            >
              닫기
            </button>
            <img
              src={profileImage}
              alt="프로필 이미지 미리보기"
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </>
  );
}
