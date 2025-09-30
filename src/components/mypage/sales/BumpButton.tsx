'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Flame, Clock } from 'lucide-react';
import { toast } from 'sonner';
import bumpAPI from '@/lib/api/bump';

interface BumpButtonProps {
  item: any;
  itemType: 'phone' | 'electronics';
  onBumpSuccess?: () => void;
  size?: 'sm' | 'default';
  redirectAfterBump?: boolean;
}

export default function BumpButton({ item, itemType, onBumpSuccess, size = 'sm', redirectAfterBump = true }: BumpButtonProps) {
  const router = useRouter();
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

      toast.success("끌올 완료!");

      // 리다이렉트 옵션이 켜져있으면 해당 제품군 목록으로 이동
      if (redirectAfterBump) {
        setTimeout(() => {
          // 휴대폰은 /used?tab=phone, 전자제품은 /used?tab=electronics
          const tab = itemType === 'phone' ? 'phone' : 'electronics';
          router.push(`/used?tab=${tab}`);
        }, 1000); // 토스트 메시지를 잠시 보여준 후 이동
      } else {
        await fetchBumpStatus();
        onBumpSuccess?.();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || '끌올에 실패했습니다.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 로딩 중이거나 끌올 불가능한 경우 버튼 숨김
  if (!bumpStatus || !bumpStatus.can_bump) {
    return null;
  }

  // 끌올 가능한 경우
  return (
    <Button
      size={size}
      variant="outline"
      className="w-auto text-orange-600 border-orange-300 hover:bg-orange-50 flex items-center gap-1"
      onClick={handleBump}
      disabled={loading}
    >
      <Flame className="w-3 h-3" />
      {loading ? '처리중' : '끌올'}
    </Button>
  );
}