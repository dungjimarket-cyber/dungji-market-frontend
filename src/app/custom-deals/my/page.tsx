'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyCustomDeals from '@/components/mypage/custom/MyCustomDeals';
import MyCustomParticipations from '@/components/mypage/custom/MyCustomParticipations';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyCustomDealsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('registered');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">커스텀 특가 관리</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="registered">내가 등록한 특가</TabsTrigger>
              <TabsTrigger value="participated">참여한 특가</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="registered" className="mt-0">
            <MyCustomDeals />
          </TabsContent>
          <TabsContent value="participated" className="mt-0">
            <MyCustomParticipations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}