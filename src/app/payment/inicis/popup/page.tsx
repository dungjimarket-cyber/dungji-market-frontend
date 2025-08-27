'use client';

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function InicisPopupPage() {
  useEffect(() => {
    // 팝업 창 크기 조정
    if (typeof window !== 'undefined') {
      window.resizeTo(720, 800);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <Clock className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
          
          <div>
            <h1 className="text-xl font-semibold mb-2 text-blue-600">
              결제 진행 중
            </h1>
            <p className="text-gray-600">
              결제 창을 준비하고 있습니다...
            </p>
          </div>

          <div className="text-sm text-gray-500">
            잠시만 기다려주세요
          </div>
        </CardContent>
      </Card>
    </div>
  );
}