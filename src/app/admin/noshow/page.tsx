'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, 
  User, Store, FileText, Calendar, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NoShowReport {
  id: number;
  reporter: number;
  reporter_name: string;
  reported_user: number;
  reported_user_name: string;
  groupbuy: number;
  groupbuy_title: string;
  report_type: 'buyer_noshow' | 'seller_noshow';
  content: string;
  evidence_image?: string;
  evidence_image_2?: string;
  evidence_image_3?: string;
  status: 'pending' | 'completed' | 'on_hold';
  admin_comment?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by?: number;
  noshow_buyers?: number[];
}

export default function AdminNoShowPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'on_hold'>('pending');
  const [selectedReport, setSelectedReport] = useState<NoShowReport | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('관리자만 접근 가능합니다.');
      router.push('/');
      return;
    }
    
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken, activeTab, user, router]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?status=${activeTab}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
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
      toast.error('노쇼 신고 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (action: 'confirm' | 'hold') => {
    if (!selectedReport) return;
    
    setProcessing(true);
    
    try {
      const endpoint = action === 'confirm' ? 'confirm' : 'hold';
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/${selectedReport.id}/${endpoint}/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            admin_comment: adminComment,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '처리에 실패했습니다.');
      }

      const result = await response.json();
      
      // 처리 결과에 따른 메시지 표시
      if (action === 'confirm') {
        toast.success(result.message || '노쇼 신고가 처리완료되었습니다.');
        
        // 공구 상태 변경 정보 표시
        if (result.action === 'cancelled') {
          toast.info('구매자 전원 노쇼로 공구가 취소되었습니다.', {
            duration: 5000,
          });
        } else if (result.action === 'completed') {
          toast.info(`${result.noshow_count}명 노쇼 제외하고 거래가 완료되었습니다.`, {
            duration: 5000,
          });
        }
      } else {
        toast.success('노쇼 신고가 보류 처리되었습니다.');
      }
      
      // 목록 새로고침
      fetchReports();
      
      // 다이얼로그 닫기
      setProcessDialogOpen(false);
      setSelectedReport(null);
      setAdminComment('');
    } catch (error) {
      console.error('노쇼 신고 처리 오류:', error);
      toast.error(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const openProcessDialog = (report: NoShowReport) => {
    setSelectedReport(report);
    setAdminComment('');
    setProcessDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />처리중</Badge>;
      case 'completed':
        return <Badge variant="destructive"><CheckCircle className="w-3 h-3 mr-1" />처리완료</Badge>;
      case 'on_hold':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />보류중</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getReportTypeBadge = (type: string) => {
    return type === 'buyer_noshow' 
      ? <Badge variant="outline"><User className="w-3 h-3 mr-1" />구매자 노쇼</Badge>
      : <Badge variant="outline"><Store className="w-3 h-3 mr-1" />판매자 노쇼</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">노쇼 신고 관리</h1>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">처리 대기</TabsTrigger>
            <TabsTrigger value="completed">처리 완료</TabsTrigger>
            <TabsTrigger value="on_hold">보류</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {activeTab === 'pending' && '처리 대기 중인 신고가 없습니다.'}
                    {activeTab === 'completed' && '처리 완료된 신고가 없습니다.'}
                    {activeTab === 'on_hold' && '보류 중인 신고가 없습니다.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{report.groupbuy_title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            {getReportTypeBadge(report.report_type)}
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                        {report.status === 'pending' && (
                          <Button
                            onClick={() => openProcessDialog(report)}
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            처리하기
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">신고자</p>
                            <p className="text-sm">{report.reporter_name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">피신고자</p>
                            <p className="text-sm">{report.reported_user_name}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">신고 내용</p>
                          <p className="text-sm whitespace-pre-wrap">{report.content}</p>
                        </div>

                        {/* 증빙 자료 표시 */}
                        {(report.evidence_image || report.evidence_image_2 || report.evidence_image_3) && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">증빙 자료</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[report.evidence_image, report.evidence_image_2, report.evidence_image_3].map((file, index) => {
                                if (!file) return null;
                                return (
                                  <a 
                                    key={index}
                                    href={file} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block border rounded-lg overflow-hidden hover:opacity-90"
                                  >
                                    <FileText className="w-8 h-8 text-gray-400 mx-auto my-4" />
                                    <p className="text-xs text-center pb-2">파일 {index + 1}</p>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {report.admin_comment && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">관리자 코멘트</p>
                                <p className="text-sm text-yellow-700 mt-1 whitespace-pre-wrap">
                                  {report.admin_comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            신고일: {formatDate(report.created_at)}
                          </div>
                          {report.processed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              처리일: {formatDate(report.processed_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <Button 
            onClick={() => router.push('/admin')}
            variant="outline"
          >
            관리자 페이지로 돌아가기
          </Button>
        </div>
      </div>

      {/* 처리 다이얼로그 */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>노쇼 신고 처리</DialogTitle>
            <DialogDescription>
              신고 내용을 검토하고 처리 방법을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>공구:</strong> {selectedReport.groupbuy_title}</p>
                <p><strong>신고 유형:</strong> {selectedReport.report_type === 'buyer_noshow' ? '구매자 노쇼' : '판매자 노쇼'}</p>
                <p><strong>신고자:</strong> {selectedReport.reporter_name}</p>
                <p><strong>피신고자:</strong> {selectedReport.reported_user_name}</p>
              </div>

              <div>
                <p className="font-medium mb-2">신고 내용</p>
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{selectedReport.content}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  관리자 코멘트 (선택사항)
                </label>
                <Textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="처리 사유나 추가 안내사항을 입력하세요..."
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">처리 안내</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>처리완료:</strong> 노쇼가 확인된 경우</li>
                  <li>• <strong>보류:</strong> 추가 확인이 필요하거나 증빙이 불충분한 경우</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-medium mb-2">⚠️ 처리완료 시 자동 처리 안내</p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• 노쇼 신고인원이 <strong>전원</strong>인 경우 → 공구가 <strong className="text-red-600">취소</strong>됩니다</li>
                  <li>• 노쇼 신고인원이 <strong>일부</strong>인 경우 → 공구가 <strong className="text-green-600">판매완료</strong>로 처리됩니다</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setProcessDialogOpen(false);
                setSelectedReport(null);
                setAdminComment('');
              }}
              disabled={processing}
            >
              취소
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleProcessReport('hold')}
              disabled={processing}
            >
              보류 처리
            </Button>
            <Button
              onClick={() => handleProcessReport('confirm')}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              처리완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}