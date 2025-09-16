'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface NoShowReport {
  id: number;
  groupbuy_id: number;
  groupbuy_title: string;
  report_type: 'buyer_noshow' | 'seller_noshow';
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'on_hold';
  admin_comment?: string;
  created_at: string;
  processed_at?: string;
}

export default function NoShowReportsReceived() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?type=received`,
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
        console.error('Failed to fetch reports:', response.status);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('신고 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>처리중</span>
          </Badge>
        );
      case 'completed':
      case 'confirmed':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 inline-flex whitespace-nowrap">
            <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>처리완료</span>
          </Badge>
        );
      case 'on_hold':
      case 'rejected':
        return (
          <Badge variant="outline" className="inline-flex whitespace-nowrap">
            <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>보류중</span>
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">받은 신고가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{report.groupbuy_title}</CardTitle>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>신고일: {formatDate(report.created_at)}</p>
                  {report.processed_at && (
                    <p>처리일: {formatDate(report.processed_at)}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(report.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">신고 유형</p>
                <p className="text-sm">
                  {report.report_type === 'buyer_noshow' ? '구매자 노쇼로 신고받음' : '판매자 노쇼로 신고받음'}
                </p>
              </div>

              {/* 관리자 코멘트 */}
              {report.admin_comment && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">관리자 답변</p>
                      <p className="text-sm text-yellow-700 mt-1 whitespace-pre-wrap">
                        {report.admin_comment}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-3 py-1.5"
                  onClick={() => router.push(`/noshow-objection/create?report_id=${report.id}`)}
                >
                  <MessageSquare className="w-3 h-3" />
                  이의제기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}