'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Edit2, Loader2, User, MapPin, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  ExpertProfile,
  uploadExpertProfileImage,
  updateExpertProfile,
} from '@/lib/api/expertService';

interface ExpertProfileCardProps {
  profile: ExpertProfile;
  accessToken: string;
  onProfileUpdate?: (updatedProfile: ExpertProfile) => void;
}

export default function ExpertProfileCard({
  profile,
  accessToken,
  onProfileUpdate,
}: ExpertProfileCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [tagline, setTagline] = useState(profile.tagline || '');
  const [isSavingTagline, setIsSavingTagline] = useState(false);
  const [currentProfileImage, setCurrentProfileImage] = useState(profile.profile_image);
  const [showImageGuide, setShowImageGuide] = useState(false);

  // 프로필 이미지 클릭 핸들러
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기 초과',
        description: '이미지는 5MB 이하만 업로드 가능합니다.',
      });
      return;
    }

    // 이미지 타입 체크
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: '잘못된 파일 형식',
        description: '이미지 파일만 업로드 가능합니다.',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const result = await uploadExpertProfileImage(file, accessToken);
      if (result.success && result.image_url) {
        setCurrentProfileImage(result.image_url);
        toast({
          title: '업로드 완료',
          description: '프로필 이미지가 변경되었습니다.',
        });
        // 부모 컴포넌트에 업데이트 알림
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profile,
            profile_image: result.image_url,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: '업로드 실패',
          description: result.message,
        });
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '이미지 업로드 중 오류가 발생했습니다.',
      });
    } finally {
      setIsUploadingImage(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 한 줄 소개 저장
  const handleSaveTagline = async () => {
    setIsSavingTagline(true);
    try {
      const result = await updateExpertProfile({ tagline }, accessToken);
      if (result.success) {
        setIsEditingTagline(false);
        toast({
          title: '저장 완료',
          description: '한 줄 소개가 수정되었습니다.',
        });
        // 부모 컴포넌트에 업데이트 알림
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profile,
            tagline,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: '저장 실패',
          description: result.message,
        });
      }
    } catch (error) {
      console.error('한 줄 소개 저장 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsSavingTagline(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        {/* 프로필 이미지 */}
        <div className="relative">
          <div
            onClick={handleImageClick}
            className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            {isUploadingImage ? (
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            ) : currentProfileImage ? (
              <img
                src={currentProfileImage}
                alt={profile.representative_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          {/* 카메라 아이콘 오버레이 */}
          <div
            onClick={handleImageClick}
            className="absolute bottom-0 right-0 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-md"
          >
            <Camera className="w-4 h-4 text-white" />
          </div>
          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="mt-2 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setShowImageGuide((prev) => !prev);
                handleImageClick();
              }}
            >
              이미지 수정
            </Button>
            {showImageGuide && (
              <div className="text-[11px] leading-snug text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-md p-2">
                프로필 이미지 가이드
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li>정사각형 비율, JPG/PNG</li>
                  <li>5MB 이하, 인물/로고가 잘 보이게</li>
                  <li>업로드 후 카드에 즉시 반영됩니다</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900 truncate">
              {profile.representative_name}
            </h2>
            {profile.is_business && profile.business_name && (
              <span className="text-sm text-gray-500 truncate">
                ({profile.business_name})
              </span>
            )}
          </div>

          {/* 카테고리 및 인증 뱃지 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {profile.category.icon} {profile.category.name}
            </span>
            {profile.status === 'verified' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                인증됨
              </span>
            )}
            {profile.status === 'pending' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                심사 중
              </span>
            )}
          </div>

          {/* 한 줄 소개 */}
          {isEditingTagline ? (
            <div className="space-y-2">
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="한 줄 소개를 입력하세요"
                maxLength={50}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveTagline}
                  disabled={isSavingTagline}
                  className="text-xs"
                >
                  {isSavingTagline && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingTagline(false);
                    setTagline(profile.tagline || '');
                  }}
                  className="text-xs"
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 truncate">
                {profile.tagline || '한 줄 소개를 입력해 주세요'}
              </p>
              <button
                onClick={() => setIsEditingTagline(true)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 영업 지역 */}
          {profile.regions.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {profile.regions.map((r) => r.name).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* 설정 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/mypage/settings')}
          className="flex-shrink-0"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
