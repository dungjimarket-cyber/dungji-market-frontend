'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export default function InicisClosePage() {
  const router = useRouter();

  useEffect(() => {
    // 2초 후 이용권 페이지로 리다이렉트
    const timer = setTimeout(() => {
      router.push('/mypage/seller/bid-tokens?payment=cancelled');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <XCircle className="h-16 w-16 text-gray-500 mx-auto" />
          
          <div>
            <h1 className="text-xl font-semibold mb-2 text-gray-600">
              결제가 취소되었습니다
            </h1>
            <p className="text-gray-600">결제창이 닫혔습니다.</p>
          </div>

          <div className="text-sm text-gray-500">
            2초 후 자동으로 이동합니다...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}