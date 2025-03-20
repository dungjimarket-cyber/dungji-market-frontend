'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  deadline: string;
}

export default function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft('종료됨');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}일 ${hours}시간`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}시간 ${minutes}분`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}분 ${seconds}초`);
      } else {
        setTimeLeft(`${seconds}초`);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [deadline]);

  return <span>{timeLeft}</span>;
}
