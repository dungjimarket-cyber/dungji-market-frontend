'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CancelledGroupBuys from '@/components/mypage/seller/CancelledGroupBuys';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SellerCancelledGroupBuysPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/mypage/seller')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          판매자 마이페이지로 돌아가기
        </Button>
        
        <h1 className="text-2xl font-bold">취소된 공구</h1>
        <p className="text-gray-600 mt-2">
          취소된 공구 내역을 확인할 수 있습니다.
        </p>
      </div>

      <CancelledGroupBuys />
    </div>
  );
}