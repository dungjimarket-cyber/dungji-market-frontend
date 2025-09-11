'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Shield, Star, MapPin, Clock, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMyPageStore } from '@/stores/myPageStore';

export default function ProfileSection() {
  const { profile, stats, uploadProfileImage } = useMyPageStore();
  const [isEditing, setIsEditing] = useState(false);

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.selling}</div>
          <div className="text-sm text-gray-600">판매중</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.sold}</div>
          <div className="text-sm text-gray-600">판매완료</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.offering}</div>
          <div className="text-sm text-gray-600">제안중</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-dungji-primary">{stats.purchased}</div>
          <div className="text-sm text-gray-600">구매완료</div>
        </div>
      </div>

      <div className="space-y-3">
        {profile.bio && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{profile.bio}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">거래 선호 방식</span>
          <span className="font-medium">
            {profile.preferTradeType === 'both' ? '직거래/택배 모두' : 
             profile.preferTradeType === 'direct' ? '직거래' : '택배'}
          </span>
        </div>

        {profile.availableTime && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              거래 가능 시간
            </span>
            <span className="font-medium">{profile.availableTime}</span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">프로필 완성도</span>
            <span className="text-sm font-medium">{getProfileCompletion().toFixed(0)}%</span>
          </div>
          <Progress value={getProfileCompletion()} className="h-2" />
        </div>
      </div>
    </div>
  );
}