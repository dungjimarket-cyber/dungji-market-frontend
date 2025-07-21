'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VotingTimerProps {
  votingEndTime: string;
  groupBuyId: number;
}

export function VotingTimer({ votingEndTime, groupBuyId }: VotingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (!votingEndTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(votingEndTime).getTime();
      const difference = endTime - now;
      
      if (difference > 0) {
        setTimeLeft(difference);
        // 3시간 미만이면 긴급 상태
        setIsUrgent(difference < 3 * 60 * 60 * 1000);
      } else {
        setTimeLeft(0);
      }
    };

    // 초기 계산
    calculateTimeLeft();

    // 1초마다 업데이트
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [votingEndTime]);

  const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return '시간 종료';
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };


  return (
    <Card className={`mb-6 ${isUrgent ? 'border-red-500' : 'border-blue-500'}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${isUrgent ? 'bg-red-100' : 'bg-blue-100'}`}>
            <Clock className={`h-6 w-6 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              최종 판매자 선택 시간
            </h3>
            
            <div className={`text-3xl font-bold mb-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
              {formatTimeLeft(timeLeft)}
            </div>
            
            {timeLeft > 0 && (
              <Alert className={`mb-4 ${isUrgent ? 'border-red-200' : 'border-blue-200'}`}>
                <AlertCircle className={`h-4 w-4 ${isUrgent ? 'text-red-600' : 'text-blue-600'}`} />
                <AlertDescription>
                  {isUrgent 
                    ? '곧 투표가 마감됩니다! 지금 바로 판매자를 선택해주세요.'
                    : '12시간 내에 원하는 판매자의 입찰을 선택해주세요.'}
                </AlertDescription>
              </Alert>
            )}
            
            {timeLeft === 0 && (
              <Alert className="border-gray-200">
                <AlertDescription>
                  투표 시간이 종료되었습니다. 투표 결과를 집계중입니다.
                </AlertDescription>
              </Alert>
            )}
            
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>• 투표 기간: 공구 마감 후 12시간</p>
          <p>• 과반수 이상이 선택한 판매자가 최종 선정됩니다</p>
          <p>• 투표하지 않으면 자동으로 기권 처리됩니다</p>
        </div>
      </CardContent>
    </Card>
  );
}