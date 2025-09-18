'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Report {
  id: number;
  report_type: string;
  reported_user: {
    id: number;
    nickname: string;
    username: string;
  };
  reported_phone?: {
    id: number;
    brand: string;
    model: string;
  };
  reporter?: {
    id: number;
    nickname: string;
    username: string;
  };
  description: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  admin_note?: string;
  created_at: string;
  processed_at?: string;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  'fake_listing': '허위매물',
  'fraud': '사기',
  'abusive_language': '욕설',
  'inappropriate_behavior': '부적절한 행동',
  'spam': '스팸/광고',
  'other': '기타',
};

const STATUS_LABELS: Record<string, string> = {
  'pending': '대기중',
  'processing': '처리중',
  'resolved': '해결됨',
  'rejected': '거부됨',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return Clock;
    case 'processing':
      return FileText;
    case 'resolved':
      return CheckCircle;
    case 'rejected':
      return XCircle;
    default:
      return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ReportsManagement() {
  const [activeTab, setActiveTab] = useState('submitted');
  const [submittedReports, setSubmittedReports] = useState<Report[]>([]);
  const [receivedReports, setReceivedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || !user) return;

      // 내가 제출한 신고 조회
      const submittedResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/used/reports/`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const submittedData = submittedResponse.data.results || submittedResponse.data || [];
      setSubmittedReports(submittedData);

      // 내가 받은 신고 조회 (백엔드에서 권한 체크)
      // 일반 사용자는 자신이 받은 신고를 직접 조회할 수 없으므로
      // 여기서는 빈 배열로 설정
      setReceivedReports([]);

    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaginatedItems = (items: Report[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const renderReportCard = (report: Report, type: 'submitted' | 'received') => {
    const StatusIcon = getStatusIcon(report.status);

    return (
      <Card key={report.id} className="p-4">
        <div className="space-y-3">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">
                    {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                  </span>
                  <Badge className={getStatusColor(report.status)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {type === 'submitted' ? (
                    <>신고 대상: {report.reported_user.nickname || report.reported_user.username}</>
                  ) : (
                    <>신고자: {report.reporter?.nickname || report.reporter?.username}</>
                  )}
                </div>
                {report.reported_phone && (
                  <div className="text-sm text-gray-500 mt-1">
                    상품: {report.reported_phone.brand} {report.reported_phone.model}
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ko })}</div>
              {report.processed_at && (
                <div className="mt-1">
                  처리: {formatDistanceToNow(new Date(report.processed_at), { addSuffix: true, locale: ko })}
                </div>
              )}
            </div>
          </div>

          {/* 신고 내용 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {report.description}
            </p>
          </div>

          {/* 관리자 답변 */}
          {report.admin_note && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-1">관리자 답변</p>
              <p className="text-sm text-blue-700">
                {report.admin_note}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const currentReports = activeTab === 'submitted' ? submittedReports : receivedReports;
  const totalPages = Math.ceil(currentReports.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          신고 관리
        </h2>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setCurrentPage(1);
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submitted">
              내가 한 신고 ({submittedReports.length})
            </TabsTrigger>
            <TabsTrigger value="received">
              받은 신고 ({receivedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submitted" className="mt-4 space-y-3">
            {submittedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                제출한 신고가 없습니다.
              </div>
            ) : (
              <>
                {getPaginatedItems(submittedReports).map((report) =>
                  renderReportCard(report, 'submitted')
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="received" className="mt-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">안내</p>
                  <p className="text-amber-700 mt-1">
                    본인이 받은 신고 내역은 개인정보 보호를 위해 제한적으로 표시됩니다.
                    신고로 인한 제재 사항은 별도로 안내됩니다.
                  </p>
                </div>
              </div>
            </div>

            {receivedReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                받은 신고가 없습니다.
              </div>
            ) : (
              <>
                {getPaginatedItems(receivedReports).map((report) =>
                  renderReportCard(report, 'received')
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}