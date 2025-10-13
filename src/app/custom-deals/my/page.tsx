'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MyCustomDeals from '@/components/mypage/custom/MyCustomDeals';
import MyCustomParticipations from '@/components/mypage/custom/MyCustomParticipations';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MyCustomDealsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('registered');

  // 페이지 진입 시 인증 체크
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('로그인이 필요합니다');
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900">커공 관리 내역</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/custom-deals')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                커스텀공구
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/mypage/custom-deals/noshow-management')}
                className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                노쇼
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="registered" className="text-sm">내가 만든 공구</TabsTrigger>
              <TabsTrigger value="participated" className="text-sm">참여한 공구</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
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