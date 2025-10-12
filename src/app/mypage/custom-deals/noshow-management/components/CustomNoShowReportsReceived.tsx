'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NoShowReport {
  id: number;
  custom_groupbuy_id: number;
  custom_groupbuy_title: string;
  report_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_comment: string | null;
}

export default function CustomNoShowReportsReceived() {
  const { accessToken } = useAuth();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/?type=received`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : data.results || []);
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (error) {
      console.error('신고 내역 조회 실패:', error);
      toast.error('신고 내역을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">검토중</Badge>;
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200">처리완료</Badge>;
      case 'on_hold':
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">보류</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 border-red-200">반려</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">받은 노쇼 신고가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(report.status)}
                  <span className="text-xs text-slate-500">
                    {report.report_type === 'buyer_noshow' ? '구매자 노쇼' : '판매자 노쇼'}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">
                  {report.custom_groupbuy_title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>신고일: {new Date(report.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                {report.processed_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>처리일: {new Date(report.processed_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                )}
                {report.admin_comment && (
                  <div className="mt-2 p-2 bg-slate-50 rounded text-sm text-slate-700">
                    <p className="font-semibold mb-1">관리자 코멘트:</p>
                    <p>{report.admin_comment}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
