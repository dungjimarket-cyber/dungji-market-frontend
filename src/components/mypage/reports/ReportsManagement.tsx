'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ReportSubmitModal from '@/components/used/ReportSubmitModal';

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
  const [submittedReports, setSubmittedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReportModal, setShowReportModal] = useState(false);
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

  const renderReportCard = (report: Report) => {
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
                  신고 대상: {report.reported_user.nickname || report.reported_user.username}
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

  const totalPages = Math.ceil(submittedReports.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            신고 관리
          </h2>
          <Button
            onClick={() => setShowReportModal(true)}
            className="bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            신고하기
          </Button>
        </div>

        <div className="space-y-3">
          {submittedReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">제출한 신고가 없습니다.</p>
              <Button
                variant="outline"
                onClick={() => setShowReportModal(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                신고하기
              </Button>
            </div>
          ) : (
            <>
              {getPaginatedItems(submittedReports).map((report) =>
                renderReportCard(report)
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
        </div>
      </div>

      {/* 신고 제출 모달 */}
      <ReportSubmitModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReportComplete={() => {
          setShowReportModal(false);
          fetchReports();
        }}
      />
    </div>
  );
}