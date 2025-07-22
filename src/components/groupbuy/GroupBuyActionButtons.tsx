'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface GroupBuyActionButtonsProps {
  groupBuyId: string;
  token?: string;
  participationStatus?: {
    is_participating: boolean;
    has_bids: boolean;
    can_leave: boolean;
  };
  onRefresh?: () => void; // 참여 상태 및 참여자 수 새로고침 함수
}

export default function GroupBuyActionButtons({
  groupBuyId,
  token,
  participationStatus,
  onRefresh
}: GroupBuyActionButtonsProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveRestrictionDialog, setShowLeaveRestrictionDialog] = useState(false);

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
      // 상세 안내 팝업 표시
      setShowLeaveRestrictionDialog(true);
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
    .then(async response => {
      if (!response.ok) {
        // 오류 응답 처리
        const errorData = await response.json().catch(() => ({}));
        
        // 입찰 있어서 탈퇴 불가능한 경우
        if (errorData.error && (
          errorData.error.includes('입찰이 있어 탈퇴할 수 없습니다') ||
          errorData.error.includes('has bids') ||
          errorData.error.includes('입찰 중')
        )) {
          setShowLeaveRestrictionDialog(true);
          throw new Error('입찰이 진행되어 탈퇴이 불가합니다.');
        }
        
        throw new Error(errorData.error || errorData.detail || '탈퇴에 실패했습니다.');
      }
      return response.json();
    })
    .then(data => {
      toast.success('공구 탈퇴가 완료되었습니다.');
      // 상태 새로고침 콜백 호출
      if (onRefresh) {
        onRefresh();
      }
      setIsLeaving(false);
    })
    .catch(err => {
      // 탈퇴 제한 안내 팝업이 표시되는 경우에는 토스트 에러 메시지는 표시하지 않음
      if (!err.message.includes('입찰이 진행되어 탈퇴이 불가합니다')) {
        toast.error(err.message || '탈퇴에 실패했습니다.');
      }
      console.error('탈퇴 오류:', err);
      setIsLeaving(false);
    });
  };

  return (
    <>
      <div className="mt-6 flex gap-2">
        <Button 
          className="flex-1 py-6 bg-blue-500 hover:bg-blue-600" 
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-5 w-5" />
          공유하기
        </Button>
        
        {/* 참여 중이고 탈퇴 가능한 경우에만 탈퇴 버튼 표시 */}
        {participationStatus?.is_participating && (
          <Button 
            variant={participationStatus.can_leave ? "destructive" : "outline"}
            className="flex-1 py-6"
            disabled={isLeaving} // 탈퇴 불가 버튼도 클릭 가능하게 함
            onClick={handleLeave}
          >
            {isLeaving ? '처리 중...' : participationStatus.can_leave ? '탈퇴하기' : '탈퇴 불가'}
          </Button>
        )}
      </div>

      {/* 탈퇴 제한 안내 팝업 */}
      <AlertDialog open={showLeaveRestrictionDialog} onOpenChange={setShowLeaveRestrictionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>탈퇴 불가 안내</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              입찰이 진행되어 탈퇴가 불가합니다. 입찰 종료후 최종선택을 통해 진행여부를 결정해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
