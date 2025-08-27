'use client';

import { Progress } from './ui/progress';
import { useEffect, useState } from 'react';

interface GroupBuyProgressProps {
  endTime: string;
  currentParticipants: number;
  maxParticipants: number;
}

export default function GroupBuyProgress({
  endTime,
  currentParticipants,
  maxParticipants,
}: GroupBuyProgressProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [participantProgress, setParticipantProgress] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('종료됨');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}시간 ${minutes}분 남음`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, [endTime]);

  useEffect(() => {
    setParticipantProgress((currentParticipants / maxParticipants) * 100);
  }, [currentParticipants, maxParticipants]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{timeLeft}</span>
        <span>{`${currentParticipants}/${maxParticipants}명`}</span>
      </div>
      <Progress value={participantProgress} className="h-2" />
    </div>
  );
}
