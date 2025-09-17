'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  Info,
  User,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Report {
  id: number;
  reported_user: number;
  reported_user_username: string;
  reported_phone?: number;
  reported_phone_model?: string;
  reporter: number;
  reporter_username: string;
  report_type: string;
  report_type_display: string;
  description: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  status_display: string;
  admin_note?: string;
  processed_by?: number;
  processed_by_username?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: '처리중', color: 'bg-blue-100 text-blue-800', icon: FileText },
  resolved: { label: '해결됨', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: '거부됨', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const reportTypeConfig = {
  fake_listing: { label: '허위매물', color: 'destructive' },
  fraud: { label: '사기', color: 'destructive' },
  abusive_language: { label: '욕설', color: 'warning' },
  inappropriate_behavior: { label: '부적절한 행동', color: 'warning' },
  spam: { label: '스팸/광고', color: 'secondary' },
  other: { label: '기타', color: 'default' },
};

export default function UsedReportsPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter, accessToken]);

  const fetchReports = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/used/reports/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params,
        }
      );

      setReports(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('신고 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: Report['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getReportTypeBadge = (type: string) => {
    const config = reportTypeConfig[type as keyof typeof reportTypeConfig] || reportTypeConfig.other;
    return (
      <Badge variant={config.color as any}>
        {config.label}
      </Badge>
    );
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter === 'all') return true;
    return report.status === statusFilter;
  });

  const getStatusCount = (status: string) => {
    if (status === 'all') return reports.length;
    return reports.filter(r => r.status === status).length;
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">신고 내역</h1>
            <p className="text-sm text-gray-500 mt-1">
              내가 신고한 중고폰 거래 관련 내역을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">전체</p>
                <p className="text-2xl font-bold">{reports.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">대기중</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {getStatusCount('pending')}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">해결됨</p>
                <p className="text-2xl font-bold text-green-600">
                  {getStatusCount('resolved')}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">거부됨</p>
                <p className="text-2xl font-bold text-red-600">
                  {getStatusCount('rejected')}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 탭 */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            전체 ({getStatusCount('all')})
          </TabsTrigger>
          <TabsTrigger value="pending">
            대기중 ({getStatusCount('pending')})
          </TabsTrigger>
          <TabsTrigger value="processing">
            처리중 ({getStatusCount('processing')})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            해결됨 ({getStatusCount('resolved')})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            거부됨 ({getStatusCount('rejected')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter}>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-gray-500">로딩중...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">신고 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>신고일시</TableHead>
                        <TableHead>신고대상</TableHead>
                        <TableHead>신고유형</TableHead>
                        <TableHead>관련 상품</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead className="text-right">상세</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            {format(new Date(report.created_at), 'MM/dd HH:mm', { locale: ko })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {report.reported_user_username}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getReportTypeBadge(report.report_type)}
                          </TableCell>
                          <TableCell>
                            {report.reported_phone_model ? (
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{report.reported_phone_model}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(report.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetailModal(report)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 상세 모달 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>신고 상세 정보</DialogTitle>
            <DialogDescription>
              신고 내용과 처리 결과를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">신고일시</p>
                  <p className="font-medium">
                    {format(new Date(selectedReport.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">처리상태</p>
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">신고대상</p>
                  <p className="font-medium">{selectedReport.reported_user_username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">신고유형</p>
                  {getReportTypeBadge(selectedReport.report_type)}
                </div>
              </div>

              {selectedReport.reported_phone_model && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">관련 상품</p>
                  <p className="font-medium">{selectedReport.reported_phone_model}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-1">신고 내용</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              {selectedReport.admin_note && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">관리자 메모</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedReport.admin_note}</p>
                  </div>
                </div>
              )}

              {selectedReport.processed_at && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">처리일시</p>
                    <p className="font-medium">
                      {format(new Date(selectedReport.processed_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                    </p>
                  </div>
                  {selectedReport.processed_by_username && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">처리자</p>
                      <p className="font-medium">{selectedReport.processed_by_username}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}