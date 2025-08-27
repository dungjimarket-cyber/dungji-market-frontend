'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UnifiedTimerProps {
  groupBuy: {
    status: string;
    start_time: string;
    end_time: string;
    final_selection_end?: string;
    seller_selection_end?: string;
  };
  className?: string;
}

/**
 * 통합 타이머 컴포넌트
 * 공구 상태에 따라 적절한 타이머를 하나만 표시
 */
export function UnifiedTimer({ groupBuy, className = '' }: UnifiedTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      let targetTime: string;
      let label: string;
      
      // 상태별로 적절한 종료 시간 선택
      if (groupBuy.status === 'final_selection_buyers' && groupBuy.final_selection_end) {
        targetTime = groupBuy.final_selection_end;
        label = '구매자 최종선택';
      } else if (groupBuy.status === 'final_selection_seller' && groupBuy.seller_selection_end) {
        targetTime = groupBuy.seller_selection_end;
        label = '판매자 최종선택';
      } else if (['recruiting', 'bidding'].includes(groupBuy.status)) {
        targetTime = groupBuy.end_time;
        label = '공구 진행';
      } else {
        return { timeLeft: 0, progress: 0, label: '' };
      }
      
      const endTime = new Date(targetTime).getTime();
      const startTime = new Date(groupBuy.start_time).getTime();
      const totalDuration = endTime - startTime;
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        return { timeLeft: 0, progress: 0, label };
      }
      
      const progressPercent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
      
      return { 
        timeLeft: remaining, 
        progress: progressPercent,
        label
      };
    };
    
    const updateTimer = () => {
      const { timeLeft, progress, label } = calculateTime();
      setTimeLeft(timeLeft);
      setProgress(progress);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [groupBuy]);
  
  const formatTime = (ms: number) => {
    if (ms <= 0) return '마감';
    
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    if (days > 0) {
      return `${days}일 ${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    } else {
      return `${minutes}분 ${seconds}초`;
    }
  };
  
  // 종료된 상태이거나 타이머가 필요없는 상태면 표시하지 않음
  if (timeLeft <= 0 || ['completed', 'cancelled', 'in_progress'].includes(groupBuy.status)) {
    return null;
  }
  
  const isUrgent = timeLeft < 3 * 60 * 60 * 1000; // 3시간 미만
  
  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-500' : 'text-blue-500'}`} />
          <span className="text-sm font-medium text-gray-700">
            {groupBuy.status === 'final_selection_buyers' ? '구매자 최종선택' :
             groupBuy.status === 'final_selection_seller' ? '판매자 최종선택' :
             '공구 마감'}
          </span>
        </div>
        <span className={`text-lg font-bold ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <Progress 
        value={progress} 
        className={`h-2 ${isUrgent ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
      />
    </div>
  );
}