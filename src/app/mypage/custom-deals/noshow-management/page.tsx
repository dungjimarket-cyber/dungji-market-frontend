'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import CustomNoShowReportsMade from './components/CustomNoShowReportsMade';
import CustomNoShowReportsReceived from './components/CustomNoShowReportsReceived';
import { CustomNoShowReportSelectModal } from '@/components/mypage/CustomNoShowReportSelectModal';
import { NoReportableTransactionsModal } from '@/components/mypage/NoReportableTransactionsModal';

interface RecentCustomDeal {
  id: number;
  title: string;
  type: 'online' | 'offline';
  type_display: string;
  primary_image?: string;
  completed_at: string;
  days_ago: number;
  current_participants?: number;
  seller_name?: string;
  seller_id?: number;
}

export default function CustomNoShowManagementPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('made');
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showNoTransactionsModal, setShowNoTransactionsModal] = useState(false);
  const [recentDeals, setRecentDeals] = useState<RecentCustomDeal[]>([]);

  // 노쇼신고하기 버튼 클릭 핸들러
  const handleNoShowReport = async () => {
    if (!accessToken) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-groupbuys/recent_completed/?limit=3`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.length === 0) {
          setShowNoTransactionsModal(true);
        } else {
          // 1건 이상이면 선택 모달 표시 (사용자가 확인하고 선택)
          setRecentDeals(data);
          setShowNoShowModal(true);
        }
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error('공구 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('노쇼신고 공구 조회 오류:', error);
      toast.error('오류가 발생했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg">커스텀 공구 노쇼신고 관리</CardTitle>
              <span className="text-xs text-gray-500 whitespace-nowrap">노쇼신고는 공구 종료 후 진행해 주세요</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/custom-deals/my')}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 노쇼신고하기 버튼 - 상단 배치 */}
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNoShowReport}
              className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5"
            >
              <AlertTriangle className="w-3 h-3" />
              노쇼신고하기
            </Button>
          </div>

          {/* 탭 구조 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="made" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                내가 한 신고
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                내가 받은 신고
              </TabsTrigger>
            </TabsList>

            <TabsContent value="made" className="mt-6">
              <CustomNoShowReportsMade />
            </TabsContent>

            <TabsContent value="received" className="mt-6">
              <CustomNoShowReportsReceived />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 노쇼신고 공구 선택 모달 */}
      <CustomNoShowReportSelectModal
        isOpen={showNoShowModal}
        onClose={() => setShowNoShowModal(false)}
        deals={recentDeals}
      />

      {/* 신고 가능한 공구 없음 모달 */}
      <NoReportableTransactionsModal
        isOpen={showNoTransactionsModal}
        onClose={() => setShowNoTransactionsModal(false)}
      />
    </div>
  );
}
