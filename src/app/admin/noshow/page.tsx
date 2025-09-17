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
  User, Store, FileText, Calendar, Eye, Shield, HandHelping
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
  has_objection?: boolean;
  is_cancelled?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
}

interface NoShowObjection {
  id: number;
  noshow_report: number;
  noshow_report_id: number;
  objector: number;
  objector_name: string;
  groupbuy_title: string;
  content: string;
  evidence_image_1?: string;
  evidence_image_2?: string;
  evidence_image_3?: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  admin_comment?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  processed_by?: number;
  edit_count?: number;
  is_cancelled?: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export default function AdminNoShowPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [objections, setObjections] = useState<NoShowObjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<'reports' | 'objections'>('reports');
  const [reportTab, setReportTab] = useState<'pending' | 'completed' | 'on_hold'>('pending');
  const [objectionTab, setObjectionTab] = useState<'pending' | 'processing' | 'resolved' | 'rejected'>('pending');
  const [selectedReport, setSelectedReport] = useState<NoShowReport | null>(null);
  const [selectedObjection, setSelectedObjection] = useState<NoShowObjection | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [objectionDialogOpen, setObjectionDialogOpen] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('관리자만 접근 가능합니다.');
      router.push('/');
      return;
    }
    
    if (accessToken) {
      if (mainTab === 'reports') {
        fetchReports();
      } else {
        fetchObjections();
      }
    }
  }, [accessToken, mainTab, reportTab, objectionTab, user, router]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?status=${reportTab}`,
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

  const fetchObjections = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/?status=${objectionTab}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setObjections(Array.isArray(data) ? data : data.results || []);
      } else {
        console.error('Failed to fetch objections:', response.status);
      }
    } catch (error) {
      console.error('Error fetching objections:', error);
      toast.error('이의제기 목록을 불러오는 중 오류가 발생했습니다.');
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

  const handleProcessObjection = async (action: 'resolve' | 'reject') => {
    if (!selectedObjection) return;
    
    setProcessing(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/${selectedObjection.id}/process/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            admin_comment: adminComment,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '처리에 실패했습니다.');
      }

      const result = await response.json();
      
      if (action === 'resolve') {
        toast.success('이의제기가 인정되었습니다.');
      } else {
        toast.success('이의제기가 거부되었습니다.');
      }
      
      // 목록 새로고침
      fetchObjections();
      
      // 다이얼로그 닫기
      setObjectionDialogOpen(false);
      setSelectedObjection(null);
      setAdminComment('');
    } catch (error) {
      console.error('이의제기 처리 오류:', error);
      toast.error(error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const openObjectionDialog = (objection: NoShowObjection) => {
    setSelectedObjection(objection);
    setAdminComment('');
    setObjectionDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />처리중</Badge>;
      case 'processing':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />검토중</Badge>;
      case 'completed':
        return <Badge variant="destructive"><CheckCircle className="w-3 h-3 mr-1" />처리완료</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />인정</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />거부</Badge>;
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
        <h1 className="text-2xl font-bold mb-6">노쇼 관리</h1>

        <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as 'reports' | 'objections')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">
              <Shield className="w-4 h-4 mr-2" />
              노쇼 신고
            </TabsTrigger>
            <TabsTrigger value="objections">
              <HandHelping className="w-4 h-4 mr-2" />
              이의제기
            </TabsTrigger>
          </TabsList>

          {/* 노쇼 신고 탭 */}
          <TabsContent value="reports" className="mt-6">
            <Tabs value={reportTab} onValueChange={(value) => setReportTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">처리 대기</TabsTrigger>
                <TabsTrigger value="completed">처리 완료</TabsTrigger>
                <TabsTrigger value="on_hold">보류</TabsTrigger>
              </TabsList>

              <TabsContent value={reportTab} className="mt-6">
                {reports.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {reportTab === 'pending' && '처리 대기 중인 신고가 없습니다.'}
                        {reportTab === 'completed' && '처리 완료된 신고가 없습니다.'}
                        {reportTab === 'on_hold' && '보류 중인 신고가 없습니다.'}
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
                                {report.has_objection && (
                                  <Badge variant="outline" className="bg-yellow-50">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    이의제기 있음
                                  </Badge>
                                )}
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
          </TabsContent>

          {/* 이의제기 탭 */}
          <TabsContent value="objections" className="mt-6">
            <Tabs value={objectionTab} onValueChange={(value) => setObjectionTab(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending">처리 대기</TabsTrigger>
                <TabsTrigger value="processing">검토중</TabsTrigger>
                <TabsTrigger value="resolved">인정</TabsTrigger>
                <TabsTrigger value="rejected">거부</TabsTrigger>
              </TabsList>

              <TabsContent value={objectionTab} className="mt-6">
                {objections.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {objectionTab === 'pending' && '처리 대기 중인 이의제기가 없습니다.'}
                        {objectionTab === 'processing' && '검토 중인 이의제기가 없습니다.'}
                        {objectionTab === 'resolved' && '인정된 이의제기가 없습니다.'}
                        {objectionTab === 'rejected' && '거부된 이의제기가 없습니다.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {objections.map((objection) => (
                      <Card key={objection.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{objection.groupbuy_title}</CardTitle>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                  <FileText className="w-3 h-3 mr-1" />
                                  신고 #{objection.noshow_report_id}
                                </Badge>
                                {objection.is_cancelled ? (
                                  <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />취소됨</Badge>
                                ) : (
                                  getStatusBadge(objection.status)
                                )}
                                {objection.edit_count && objection.edit_count > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    수정 {objection.edit_count}회
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {(objection.status === 'pending' || objection.status === 'processing') && !objection.is_cancelled && (
                              <Button
                                onClick={() => openObjectionDialog(objection)}
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
                            <div>
                              <p className="text-sm font-medium text-gray-700">이의제기자</p>
                              <p className="text-sm">{objection.objector_name}</p>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700">이의제기 내용</p>
                              <p className="text-sm whitespace-pre-wrap">{objection.content}</p>
                            </div>

                            {/* 증빙 자료 표시 */}
                            {(objection.evidence_image_1 || objection.evidence_image_2 || objection.evidence_image_3) && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">증빙 자료</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {[objection.evidence_image_1, objection.evidence_image_2, objection.evidence_image_3].map((file, index) => {
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

                            {objection.admin_comment && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-blue-800">관리자 답변</p>
                                    <p className="text-sm text-blue-700 mt-1 whitespace-pre-wrap">
                                      {objection.admin_comment}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-4 pt-2 border-t text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                제출일: {formatDate(objection.created_at)}
                              </div>
                              {objection.processed_at && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  처리일: {formatDate(objection.processed_at)}
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

      {/* 노쇼 신고 처리 다이얼로그 */}
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
                  <li>• <strong>처리완료:</strong> 신고 검토 후 상태 관리가 필요한 경우</li>
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

      {/* 이의제기 처리 다이얼로그 */}
      <Dialog open={objectionDialogOpen} onOpenChange={setObjectionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>이의제기 처리</DialogTitle>
            <DialogDescription>
              이의제기 내용을 검토하고 처리 방법을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          
          {selectedObjection && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>공구:</strong> {selectedObjection.groupbuy_title}</p>
                <p><strong>관련 신고:</strong> #{selectedObjection.noshow_report_id}</p>
                <p><strong>이의제기자:</strong> {selectedObjection.objector_name}</p>
              </div>

              <div>
                <p className="font-medium mb-2">이의제기 내용</p>
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{selectedObjection.content}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  관리자 답변 (필수)
                </label>
                <Textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="처리 결정과 그 사유를 입력하세요..."
                  rows={4}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">처리 안내</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>인정:</strong> 이의제기가 타당하여 원 신고를 보류 처리</li>
                  <li>• <strong>거부:</strong> 이의제기가 타당하지 않아 원 신고 유지</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setObjectionDialogOpen(false);
                setSelectedObjection(null);
                setAdminComment('');
              }}
              disabled={processing}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleProcessObjection('reject')}
              disabled={processing || !adminComment.trim()}
            >
              거부
            </Button>
            <Button
              onClick={() => handleProcessObjection('resolve')}
              disabled={processing || !adminComment.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              인정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}