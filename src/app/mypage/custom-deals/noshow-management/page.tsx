'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CustomNoShowReportsMade from './components/CustomNoShowReportsMade';

export default function CustomNoShowManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('made');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">커스텀 공구 노쇼 관리</h1>
        <p className="text-slate-600 mt-2">
          마감된 커스텀 공구의 노쇼 신고 내역을 확인하고 관리할 수 있습니다.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="made">신고한 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="made" className="mt-6">
          <CustomNoShowReportsMade />
        </TabsContent>
      </Tabs>
    </div>
  );
}
