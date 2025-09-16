'use client';

import { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, MessageSquare, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function NoShowManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, accessToken, user, isLoading } = useAuth();
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
    // URL 파라미터에서 탭 읽기
    const tabParam = searchParams.get('tab');
    if (tabParam && ['made', 'received', 'objections'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // 로딩이 완료되고 인증되지 않은 경우에만 로그인 페이지로 이동
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 로딩 중일 때 로딩 표시
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>노쇼 신고 관리</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/mypage')}
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

export default function NoShowManagementPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    }>
      <NoShowManagementContent />
    </Suspense>
  );
}