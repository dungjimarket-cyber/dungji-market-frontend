'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, MessageSquare, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NoShowReportSelectModal } from '@/components/mypage/NoShowReportSelectModal';
import { NoReportableTransactionsModal } from '@/components/mypage/NoReportableTransactionsModal';
import { toast } from 'sonner';

// 각 탭 컴포넌트들을 임포트 (나중에 생성)
import NoShowReportsMade from './components/NoShowReportsMade';
import NoShowReportsReceived from './components/NoShowReportsReceived';
import NoShowObjections from './components/NoShowObjections';

interface RecentGroupBuy {
  id: number;
  title: string;
  product_name: string;
  product_image?: string;
  completed_at: string;
  days_ago: number;
  participant_count?: number;
  seller_name?: string;
  seller_id?: number;
}

export default function NoShowManagementPage() {
  const router = useRouter();
  const { isAuthenticated, accessToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState('made');
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [showNoTransactionsModal, setShowNoTransactionsModal] = useState(false);
  const [recentGroupBuys, setRecentGroupBuys] = useState<RecentGroupBuy[]>([]);

  // 노쇼신고하기 버튼 클릭 핸들러 (기존 MyPageClient 로직 재사용)
  const handleNoShowReport = async () => {
    if (!accessToken) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/groupbuys/recent_completed/?limit=3`,
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
        } else if (data.length === 1) {
          // 1건만 있으면 바로 신고 페이지로 이동
          let url = `/noshow-report/create?groupbuy_id=${data[0].id}`;
          if (data[0].seller_id) {
            url += `&seller_id=${data[0].seller_id}`;
          }
          router.push(url);
        } else {
          // 2-3건이면 선택 모달 표시
          setRecentGroupBuys(data);
          setShowNoShowModal(true);
        }
      } else {
        // 더 자세한 에러 정보 확인
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error('거래 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('노쇼신고 거래 조회 오류:', error);
      toast.error('오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/mypage')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">노쇼 신고 관리</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>노쇼 관리</CardTitle>
            {/* 노쇼신고하기 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNoShowReport}
              className="flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50 text-xs px-3 py-1.5"
            >
              <AlertTriangle className="w-3 h-3" />
              신고하기
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 탭 구조 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="made" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                내가 한 신고
              </TabsTrigger>
              <TabsTrigger value="received" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                내가 받은 신고
              </TabsTrigger>
              <TabsTrigger value="objections" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                이의제기
              </TabsTrigger>
            </TabsList>

            <TabsContent value="made" className="mt-6">
              <NoShowReportsMade />
            </TabsContent>

            <TabsContent value="received" className="mt-6">
              <NoShowReportsReceived />
            </TabsContent>

            <TabsContent value="objections" className="mt-6">
              <NoShowObjections />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 노쇼신고 거래 선택 모달 */}
      <NoShowReportSelectModal
        isOpen={showNoShowModal}
        onClose={() => setShowNoShowModal(false)}
        groupBuys={recentGroupBuys}
      />

      {/* 신고 가능한 거래 없음 모달 */}
      <NoReportableTransactionsModal
        isOpen={showNoTransactionsModal}
        onClose={() => setShowNoTransactionsModal(false)}
      />
    </div>
  );
}