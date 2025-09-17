'use client';

import { MapPin, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfileSection() {
  const { user } = useAuth();
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/mypage');
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          {/* 닉네임 */}
          <h2 className="text-xl font-semibold">
            {user.nickname || user.username || '닉네임 설정 필요'}
          </h2>

          {/* 주요활동지역 */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{user.address_region?.full_name || '지역 설정 필요'}</span>
          </div>
        </div>

        {/* 프로필 수정 버튼 - 회색 톤 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleEditProfile}
          className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Edit2 className="w-4 h-4" />
          프로필 수정
        </Button>
      </div>
    </div>
  );
}