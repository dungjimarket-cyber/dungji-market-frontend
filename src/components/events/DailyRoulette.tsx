'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Gift, Trophy, Coffee, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Prize {
  id: number;
  name: string;
  probability: number;
  color: string;
  icon: string;
}

// 돌림판 8칸 (각 칸의 확률은 전체 확률을 칸 개수로 나눔)
const prizes: Prize[] = [
  { id: 1, name: '메가커피', probability: 5, color: '#FF6B6B', icon: '☕' },      // 10% / 2칸 = 5%
  { id: 2, name: '스타벅스', probability: 2.5, color: '#4ECDC4', icon: '⭐' },   // 5% / 2칸 = 2.5%
  { id: 3, name: '꽝', probability: 41.495, color: '#95A5A6', icon: '💨' },      // 82.99% / 2칸 = 41.495%
  { id: 4, name: '5만원권', probability: 2, color: '#F39C12', icon: '💰' },      // 2% / 1칸 = 2%
  { id: 5, name: '메가커피', probability: 5, color: '#FF6B6B', icon: '☕' },      // 10% / 2칸 = 5%
  { id: 6, name: '스타벅스', probability: 2.5, color: '#4ECDC4', icon: '⭐' },   // 5% / 2칸 = 2.5%
  { id: 7, name: '꽝', probability: 41.495, color: '#95A5A6', icon: '💨' },      // 82.99% / 2칸 = 41.495%
  { id: 8, name: '10만원권', probability: 0.01, color: '#9B59B6', icon: '🎁' },  // 0.01% / 1칸 = 0.01%
];

export default function DailyRoulette() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWin, setLastWin] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const sliceAngle = (2 * Math.PI) / prizes.length;

    // 그림자 효과
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    // 각 섹션 그리기
    prizes.forEach((prize, index) => {
      const startAngle = index * sliceAngle - Math.PI / 2;
      const endAngle = startAngle + sliceAngle;

      // 섹션 배경
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      // 섹션 테두리
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 텍스트
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';

      // 아이콘
      ctx.font = 'bold 32px Arial';
      ctx.fillText(prize.icon, radius * 0.65, -10);

      // 텍스트
      ctx.font = 'bold 16px Arial';
      ctx.fillText(prize.name, radius * 0.65, 15);

      ctx.restore();
    });

    // 중앙 원 (로고 영역)
    ctx.shadowBlur = 0;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
    gradient.addColorStop(0, '#8B5CF6');
    gradient.addColorStop(1, '#6D28D9');

    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 둥지마켓 로고 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('둥지', centerX, centerY - 10);
    ctx.font = 'bold 18px Arial';
    ctx.fillText('마켓', centerX, centerY + 10);
  };

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);

    // 확률 기반 당첨 결정 - 실제 돌림판 칸 중에서 랜덤 선택
    const random = Math.random() * 100;
    let accumulated = 0;
    let selectedPrizeIndex = 0;

    // 각 칸의 확률로 선택
    for (let i = 0; i < prizes.length; i++) {
      accumulated += prizes[i].probability;
      if (random <= accumulated) {
        selectedPrizeIndex = i;
        break;
      }
    }

    const selectedPrize = prizes[selectedPrizeIndex];

    // 회전 계산 (최소 10바퀴 + 당첨 위치)
    // 화살표는 12시 방향(위)에 고정, 휠이 회전
    const sliceAngle = 360 / prizes.length;
    // 선택된 칸의 중앙이 화살표에 오도록 계산
    // 휠은 시계방향으로 회전하므로, 음수 각도 사용
    const targetAngle = -(selectedPrizeIndex * sliceAngle + sliceAngle / 2);
    const spins = 10;
    const totalRotation = rotation + 360 * spins + targetAngle;

    console.log('Selected Prize:', selectedPrize.name, 'Index:', selectedPrizeIndex, 'Slice:', sliceAngle, 'Target:', targetAngle);

    setRotation(totalRotation);

    // 6초 후 결과 표시
    setTimeout(() => {
      setIsSpinning(false);
      setLastWin(selectedPrize.name);

      if (selectedPrize.name === '꽝') {
        toast.error('아쉽지만 꽝! 내일 다시 도전하세요! 💨');
      } else {
        toast.success(`🎉 축하합니다! ${selectedPrize.name} 당첨!`, {
          duration: 5000,
        });
      }
    }, 6000);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 shadow-xl">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-3">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-lg text-purple-600">매일 추첨 이벤트</span>
          <Sparkles className="w-5 h-5 text-yellow-500" />
        </div>
        <p className="text-gray-600 text-sm">하루 1번 무료 돌림판 기회!</p>
      </div>

      {/* 돌림판 */}
      <div className="relative max-w-md mx-auto">
        {/* 상단 화살표 (고정) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 -mt-2">
          <div className="relative">
            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-lg" />
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[24px] border-t-white" />
          </div>
        </div>

        {/* 캔버스 (회전) */}
        <div className="relative bg-white rounded-full p-4 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-auto"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 6000ms cubic-bezier(0.17, 0.67, 0.35, 0.95)'
            }}
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="mt-8 text-center">
        <Button
          onClick={spinWheel}
          disabled={isSpinning}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
        >
          {isSpinning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              돌리는 중...
            </>
          ) : (
            <>
              <Gift className="w-5 h-5 mr-2" />
              돌림판 돌리기
            </>
          )}
        </Button>

        {lastWin && !isSpinning && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow-md animate-bounce">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="font-bold text-lg">최근 당첨: {lastWin}</p>
          </div>
        )}
      </div>

      {/* 경품 안내 */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="font-semibold">메가커피</span>
          </div>
          <p className="text-gray-600 text-xs">30잔 (10%)</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-teal-400" />
            <span className="font-semibold">스타벅스</span>
          </div>
          <p className="text-gray-600 text-xs">10장 (5%)</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="font-semibold">5만원권</span>
          </div>
          <p className="text-gray-600 text-xs">2장 (2%)</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-purple-400" />
            <span className="font-semibold">10만원권</span>
          </div>
          <p className="text-gray-600 text-xs">1장 (0.01%)</p>
        </div>
      </div>
    </div>
  );
}