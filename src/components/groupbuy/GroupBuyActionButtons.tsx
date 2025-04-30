'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface GroupBuyActionButtonsProps {
  groupBuyId: string;
  token?: string;
  participationStatus?: {
    is_participating: boolean;
    has_bids: boolean;
    can_leave: boolean;
  };
}

export default function GroupBuyActionButtons({
  groupBuyId,
  token,
  participationStatus
}: GroupBuyActionButtonsProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  // 공유하기 버튼 클릭 핸들러
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success('링크가 복사되었습니다!');
      })
      .catch(err => {
        toast.error('링크 복사에 실패했습니다.');
        console.error('Could not copy text: ', err);
      });
  };

  // 탈퇴하기 버튼 클릭 핸들러
  const handleLeave = () => {
    if (!participationStatus?.can_leave) {
      toast.error('입찰이 진행 중인 공구에서는 탈퇴할 수 없습니다.');
      return;
    }

    setIsLeaving(true);
    
    // 탈퇴 API 호출
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/groupbuys/${groupBuyId}/leave/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('탈퇴에 실패했습니다.');
      return response.json();
    })
    .then(data => {
      toast.success('공구 탈퇴가 완료되었습니다.');
      // 페이지 리로드
      window.location.reload();
    })
    .catch(err => {
      toast.error(err.message || '탈퇴에 실패했습니다.');
      console.error('탈퇴 오류:', err);
      setIsLeaving(false);
    });
  };

  return (
    <div className="mt-6 flex gap-2">
      <Button 
        className="flex-1 py-6 bg-blue-500 hover:bg-blue-600" 
        onClick={handleShare}
      >
        <Share2 className="mr-2 h-5 w-5" />
        지인과 공유하기
      </Button>
      
      {/* 참여 중이고 탈퇴 가능한 경우에만 탈퇴 버튼 표시 */}
      {participationStatus?.is_participating && (
        <Button 
          variant={participationStatus.can_leave ? "destructive" : "outline"}
          className="flex-1 py-6"
          disabled={!participationStatus.can_leave || isLeaving}
          onClick={handleLeave}
        >
          {isLeaving ? '처리 중...' : participationStatus.can_leave ? '탈퇴하기' : '탈퇴 불가'}
        </Button>
      )}
    </div>
  );
}
