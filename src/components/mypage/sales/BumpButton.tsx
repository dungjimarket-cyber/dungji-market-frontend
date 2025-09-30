'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Clock } from 'lucide-react';
import { toast } from 'sonner';
import bumpAPI from '@/lib/api/bump';

interface BumpButtonProps {
  item: any;
  itemType: 'phone' | 'electronics';
  onBumpSuccess?: () => void;
  size?: 'sm' | 'default';
}

export default function BumpButton({ item, itemType, onBumpSuccess, size = 'sm' }: BumpButtonProps) {
  const [loading, setLoading] = useState(false);
  const [bumpStatus, setBumpStatus] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // 끌올 상태 조회
  const fetchBumpStatus = async () => {
    try {
      const status = await bumpAPI.getStatus(itemType, item.id);
      setBumpStatus(status);

      if (status.next_bump_available_at) {
        setTimeRemaining(bumpAPI.getTimeUntilNextBump(status.next_bump_available_at));
      }
    } catch (error) {
      console.error('Failed to fetch bump status:', error);
    }
  };

  useEffect(() => {
    fetchBumpStatus();

    // 1분마다 상태 업데이트
    const interval = setInterval(fetchBumpStatus, 60000);
    return () => clearInterval(interval);
  }, [item.id, itemType]);

  // 시간 업데이트 (1초마다)
  useEffect(() => {
    if (bumpStatus?.next_bump_available_at) {
      const timer = setInterval(() => {
        setTimeRemaining(bumpAPI.getTimeUntilNextBump(bumpStatus.next_bump_available_at));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [bumpStatus?.next_bump_available_at]);

  const handleBump = async () => {
    setLoading(true);

    try {
      const result = await bumpAPI.performBump(itemType, item.id);

      toast.success(
        <div>
          <p className="font-semibold">끌올 완료!</p>
          <p className="text-sm text-gray-600">
            남은 무료 끌올: {result.remaining_free_bumps_today}회
          </p>
        </div>
      );

      await fetchBumpStatus();
      onBumpSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '끌올에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이거나 상태를 모르는 경우
  if (!bumpStatus) {
    return (
      <Button size={size} variant="outline" disabled>
        <Clock className="w-3 h-3 mr-1" />
        로딩...
      </Button>
    );
  }

  // 끌올 불가능한 경우
  if (!bumpStatus.can_bump) {
    // 오늘 끌올 소진
    if (bumpStatus.remaining_free_bumps_today === 0) {
      return (
        <Button size={size} variant="outline" disabled>
          <Clock className="w-3 h-3 mr-1" />
          내일 끌올 가능
        </Button>
      );
    }

    // 쿨다운 중
    return (
      <Button size={size} variant="outline" disabled>
        <Clock className="w-3 h-3 mr-1" />
        {timeRemaining || '끌올 대기'}
      </Button>
    );
  }

  // 끌올 가능한 경우
  return (
    <Button
      size={size}
      variant="outline"
      className="text-orange-600 border-orange-300 hover:bg-orange-50"
      onClick={handleBump}
      disabled={loading}
    >
      <Flame className="w-3 h-3 mr-1" />
      {loading ? '처리중...' : `끌올 (${bumpStatus.remaining_free_bumps_today}/3)`}
    </Button>
  );
}