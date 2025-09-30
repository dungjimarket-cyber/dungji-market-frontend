'use client';

import DailyRoulette from '@/components/events/DailyRoulette';

export default function RouletteTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">돌림판 테스트</h1>
        <DailyRoulette />
      </div>
    </div>
  );
}