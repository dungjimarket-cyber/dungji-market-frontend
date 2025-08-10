'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface SimpleFinalSelectionTimerProps {
  endTime?: string;
  onTimeEnd?: () => void;
  maxHours?: number; // 최대 시간 (기본값: 12시간)
  label?: string; // 타이머 레이블
}

export function SimpleFinalSelectionTimer({ endTime, onTimeEnd, maxHours = 12, label = '최종선택 마감까지' }: SimpleFinalSelectionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft('종료됨');
        setIsExpired(true);
        if (onTimeEnd) onTimeEnd();
        return false;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTotalSeconds(Math.floor(difference / 1000));
      setTimeLeft(`${hours}시간 ${minutes}분 ${seconds}초`);
      return true;
    };

    // 초기 계산
    const shouldContinue = calculateTimeLeft();

    // 1초마다 업데이트
    let interval: NodeJS.Timeout | null = null;
    if (shouldContinue) {
      interval = setInterval(() => {
        const shouldContinue = calculateTimeLeft();
        if (!shouldContinue && interval) {
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [endTime, onTimeEnd]);

  if (!endTime) return null;

  // maxHours를 초로 변환 (기본값: 12시간)
  const maxSeconds = maxHours * 60 * 60;
  const progressPercentage = Math.max(0, Math.min(100, (totalSeconds / maxSeconds) * 100));
  
  // 남은 시간에 따른 색상 변경
  const getColorClass = () => {
    if (totalSeconds < 3600) return 'text-red-600'; // 1시간 미만
    if (totalSeconds < 7200) return 'text-orange-600'; // 2시간 미만
    return 'text-blue-600';
  };

  const getProgressColorClass = () => {
    if (totalSeconds < 3600) return 'bg-red-600'; // 1시간 미만
    if (totalSeconds < 7200) return 'bg-orange-600'; // 2시간 미만
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${getColorClass()}`} />
          <h3 className="font-semibold text-gray-900">{label}</h3>
        </div>
        <div className={`text-lg font-bold ${getColorClass()}`}>
          {timeLeft}
        </div>
      </div>
      
      {/* 프로그레스 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${getProgressColorClass()}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {totalSeconds < 3600 && !isExpired && (
        <p className="text-sm text-red-600 mt-2 text-center font-medium">
          ⚠️ 시간 내 선택하지 않으면 자동으로 포기 처리됩니다
        </p>
      )}
    </div>
  );
}