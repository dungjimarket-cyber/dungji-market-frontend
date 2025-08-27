'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SimplifiedGroupBuyButtonProps {
  status: string; // recruiting, final_selection_buyers, final_selection_seller, in_progress, completed, cancelled
  userRole?: 'buyer' | 'seller';
  isParticipant?: boolean;
  hasBid?: boolean;
  buyerDecision?: 'pending' | 'confirmed' | 'cancelled';
  sellerDecision?: 'pending' | 'confirmed' | 'cancelled';
  remainingTime?: string; // 예: "3시간", "2시간"
  onClick?: () => void;
  disabled?: boolean;
}

export function SimplifiedGroupBuyButton({
  status,
  userRole = 'buyer',
  isParticipant = false,
  hasBid = false,
  buyerDecision,
  sellerDecision,
  remainingTime,
  onClick,
  disabled = false
}: SimplifiedGroupBuyButtonProps) {
  
  // 버튼 텍스트 결정 (간소화된 4개 버튼)
  const getButtonText = () => {
    // 일반회원 (구매회원)
    if (userRole === 'buyer') {
      // 모집중
      if (status === 'recruiting') {
        return isParticipant ? '참여 완료' : '공구 참여하기';
      }
      
      // 종료 후 모든 진행 단계 → "진행상황 확인"
      if (status === 'final_selection_buyers' || 
          status === 'final_selection_seller' || 
          status === 'in_progress') {
        return '진행상황 확인';
      }
      
      // 완료
      if (status === 'completed') {
        return '공구 완료';
      }
      
      // 취소
      if (status === 'cancelled') {
        return '공구 취소';
      }
    }
    
    // 판매회원
    if (userRole === 'seller') {
      // 모집중
      if (status === 'recruiting') {
        return hasBid ? '견적 수정하기' : '견적 제안하기';
      }
      
      // 종료 후 모든 진행 단계 → "진행상황 확인"
      if (status === 'final_selection_buyers' || 
          status === 'final_selection_seller' || 
          status === 'in_progress') {
        return '진행상황 확인';
      }
      
      // 완료
      if (status === 'completed') {
        return '공구 완료';
      }
      
      // 취소
      if (status === 'cancelled') {
        return '공구 취소';
      }
    }
    
    return '확인';
  };
  
  // 상태 배지 정보
  const getStatusBadge = () => {
    if (userRole === 'buyer') {
      if (status === 'recruiting' && isParticipant) {
        return { text: '참여중', variant: 'default' as const, color: 'bg-green-500' };
      }
      if (status === 'final_selection_buyers') {
        return { 
          text: remainingTime ? `구매확정 대기 (${remainingTime})` : '구매확정 대기', 
          variant: 'secondary' as const,
          color: 'bg-blue-500'
        };
      }
      if (status === 'final_selection_seller') {
        return { text: '판매자 선택중', variant: 'secondary' as const, color: 'bg-yellow-500' };
      }
      if (status === 'in_progress') {
        return { text: '거래중', variant: 'default' as const, color: 'bg-green-500' };
      }
      if (status === 'completed') {
        return { text: '완료', variant: 'outline' as const, color: 'bg-gray-700' };
      }
      if (status === 'cancelled') {
        return { text: '취소', variant: 'destructive' as const, color: 'bg-red-500' };
      }
    }
    
    if (userRole === 'seller') {
      if (status === 'recruiting' && hasBid) {
        return { text: '✅견적제안완료', variant: 'default' as const, color: 'bg-green-500' };
      }
      if (status === 'final_selection_buyers') {
        return { text: '구매자 선택 대기', variant: 'secondary' as const, color: 'bg-blue-500' };
      }
      if (status === 'final_selection_seller') {
        return { 
          text: remainingTime ? `판매확정 대기 (${remainingTime})` : '판매확정 대기', 
          variant: 'secondary' as const,
          color: 'bg-yellow-500'
        };
      }
      if (status === 'in_progress') {
        return { text: '거래중', variant: 'default' as const, color: 'bg-green-500' };
      }
      if (status === 'completed') {
        return { text: '완료', variant: 'outline' as const, color: 'bg-gray-700' };
      }
      if (status === 'cancelled') {
        return { text: '취소', variant: 'destructive' as const, color: 'bg-red-500' };
      }
    }
    
    return null;
  };
  
  // 버튼 스타일
  const getButtonStyle = () => {
    if (status === 'completed' || status === 'cancelled') {
      return 'bg-gray-500 hover:bg-gray-600';
    }
    
    if (status === 'recruiting') {
      if (userRole === 'buyer' && isParticipant) {
        return 'bg-blue-600 hover:bg-blue-700';
      }
      if (userRole === 'seller' && hasBid) {
        return 'bg-indigo-600 hover:bg-indigo-700';
      }
      return 'bg-purple-600 hover:bg-purple-700';
    }
    
    // 진행상황 확인 버튼
    return 'bg-orange-600 hover:bg-orange-700';
  };
  
  const statusBadge = getStatusBadge();
  
  return (
    <div className="relative w-full">
      <Button
        className={`w-full py-6 text-lg font-bold text-white ${getButtonStyle()}`}
        onClick={onClick}
        disabled={disabled}
      >
        {getButtonText()}
      </Button>
      
      {/* 우측 상단 상태 배지 (옵션) */}
      {statusBadge && (
        <div className={`absolute -top-2 -right-2 ${statusBadge.color} text-white text-xs px-2 py-1 rounded-full shadow-lg`}>
          {statusBadge.text}
        </div>
      )}
    </div>
  );
}