'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: string | Date;
  onExpire?: () => void;
  className?: string;
  showLabel?: boolean;
  format?: 'full' | 'compact';
  urgent?: number; // Minutes threshold for urgent display
}

/**
 * 카운트다운 타이머 컴포넌트
 * 최종선택 시간, 공구 마감 시간 등에 사용
 */
export function CountdownTimer({ 
  endTime, 
  onExpire, 
  className = '', 
  showLabel = true,
  format = 'full',
  urgent = 60 // 1시간 미만일 때 urgent 스타일
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      
      // 백엔드에서 받은 시간이 KST(한국 시간)이므로 타임존 정보 추가
      // 타임존 정보가 없는 경우 +09:00 추가
      let targetDate: Date;
      const endTimeStr = String(endTime);
      
      if (endTimeStr.includes('Z') || endTimeStr.includes('+') || endTimeStr.includes('-')) {
        // 이미 타임존 정보가 있는 경우
        targetDate = new Date(endTime);
      } else {
        // 타임존 정보가 없는 경우 KST로 처리 (+09:00)
        // 백엔드가 Asia/Seoul 타임존을 사용하므로
        targetDate = new Date(endTimeStr + '+09:00');
      }
      
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ 
        days, 
        hours, 
        minutes, 
        seconds, 
        total: Math.floor(difference / (1000 * 60)) // total minutes left
      });
      setExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire]);

  if (expired) {
    return (
      <div className={`text-red-600 font-medium ${className}`}>
        {showLabel && '⏰ '}시간 만료
      </div>
    );
  }

  const isUrgent = timeLeft.total <= urgent && timeLeft.total > 0;
  const urgentClass = isUrgent ? 'text-red-600 animate-pulse' : 'text-orange-600';

  if (format === 'compact') {
    return (
      <div className={`font-mono font-medium ${urgentClass} ${className}`}>
        {showLabel && '⏰ '}
        {timeLeft.days > 0 && `${timeLeft.days}일 `}
        {timeLeft.hours.toString().padStart(2, '0')}:
        {timeLeft.minutes.toString().padStart(2, '0')}:
        {timeLeft.seconds.toString().padStart(2, '0')}
      </div>
    );
  }

  return (
    <div className={`${urgentClass} ${className}`}>
      {showLabel && (
        <div className="text-sm font-medium mb-1">
          ⏰ 남은 시간
        </div>
      )}
      <div className="flex items-center space-x-2 font-mono text-lg">
        {timeLeft.days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold">{timeLeft.days}</div>
              <div className="text-xs">일</div>
            </div>
            <div className="text-xl">:</div>
          </>
        )}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</div>
          <div className="text-xs">시간</div>
        </div>
        <div className="text-xl">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</div>
          <div className="text-xs">분</div>
        </div>
        <div className="text-xl">:</div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</div>
          <div className="text-xs">초</div>
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 텍스트 형태 카운트다운
 */
export function SimpleCountdown({ 
  endTime, 
  onExpire, 
  className = '' 
}: Pick<CountdownTimerProps, 'endTime' | 'onExpire' | 'className'>) {
  return (
    <CountdownTimer
      endTime={endTime}
      onExpire={onExpire}
      className={className}
      format="compact"
      showLabel={false}
    />
  );
}