'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Shield, Star, MapPin, Clock, Edit2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMyPageStore } from '@/stores/myPageStore';
import UsedNotificationDropdown from '@/components/mypage/UsedNotificationDropdown';
import { sellerAPI, buyerAPI } from '@/lib/api/used';

export default function ProfileSection() {
  const { profile, stats, uploadProfileImage, setActiveTab, fetchStats } = useMyPageStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showSellNotifications, setShowSellNotifications] = useState(false);
  const [showBuyNotifications, setShowBuyNotifications] = useState(false);

  // 통계 데이터 가져오기 및 폴링
  useEffect(() => {
    // 초기 데이터 로드
    fetchStats();

    // 30초마다 폴링 (페이지가 활성 상태일 때만)
    let interval: NodeJS.Timeout;

    const startPolling = () => {
      interval = setInterval(() => {
        if (!document.hidden) {
          fetchStats();
        }
      }, 30000); // 30초
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        fetchStats(); // 페이지 활성화 시 즉시 업데이트
        startPolling();
      }
    };

    // 페이지가 활성 상태일 때만 폴링 시작
    if (!document.hidden) {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadProfileImage(file);
    }
  };

  const getUserLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      case 'platinum': return 'bg-dungji-primary';
      default: return 'bg-gray-400';
    }
  };

  const getProfileCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const fields = ['nickname', 'profileImage', 'bio', 'tradeRegion', 'preferTradeType'];
    fields.forEach(field => {
      if (profile[field as keyof typeof profile]) completed++;
    });
    return (completed / fields.length) * 100;
  };

  if (!profile) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
              {profile.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={profile.nickname}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Camera className="w-8 h-8" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md cursor-pointer">
              <Camera className="w-4 h-4 text-gray-600" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold">{profile.nickname}</h2>
              <Badge className={`${getUserLevelColor(profile.userLevel)} text-white`}>
                {profile.userLevel.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{profile.averageRating.toFixed(1)}</span>
                <span className="text-gray-400">({profile.totalReviews})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.tradeRegion}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {profile.phoneVerified && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Shield className="w-3 h-3" />
                  휴대폰 인증
                </Badge>
              )}
              {profile.emailVerified && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Shield className="w-3 h-3" />
                  이메일 인증
                </Badge>
              )}
              {profile.identityVerified && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Shield className="w-3 h-3" />
                  본인 인증
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="gap-1.5"
        >
          <Edit2 className="w-4 h-4" />
          프로필 수정
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div
          className="relative text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => {
            setShowSellNotifications(!showSellNotifications);
            setShowBuyNotifications(false);
          }}
        >
          <div className="text-2xl font-bold text-blue-600">{stats.sellNotifications || 0}</div>
          <div className="text-sm text-gray-600">판매알림</div>
          {showSellNotifications && (
            <UsedNotificationDropdown
              type="sell"
              isOpen={showSellNotifications}
              onClose={() => setShowSellNotifications(false)}
              className="absolute top-full left-0 mt-2 z-50"
            />
          )}
        </div>
        <div
          className="relative text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => {
            setShowBuyNotifications(!showBuyNotifications);
            setShowSellNotifications(false);
          }}
        >
          <div className="text-2xl font-bold text-green-600">{stats.buyNotifications || 0}</div>
          <div className="text-sm text-gray-600">구매알림</div>
          {showBuyNotifications && (
            <UsedNotificationDropdown
              type="buy"
              isOpen={showBuyNotifications}
              onClose={() => setShowBuyNotifications(false)}
              className="absolute top-full left-0 mt-2 z-50"
            />
          )}
        </div>
        <div
          className="text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setActiveTab('favorites')}
        >
          <div className="text-2xl font-bold text-orange-600">{stats.favorites || 0}</div>
          <div className="text-sm text-gray-600">찜</div>
        </div>
      </div>

    </div>
  );
}