'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Clock, CheckCircle, XCircle, MessageSquare, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'on_hold';
  admin_comment?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  edit_count?: number;
  last_edited_at?: string;
}

export default function NoShowReportsPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'made' | 'received'>('made');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<NoShowReport | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<NoShowReport | null>(null);
  const [editFormData, setEditFormData] = useState({
    content: '',
    evidence_files: [] as File[],
  });

  useEffect(() => {
    // RequireAuth에서 이미 인증을 확인했으므로 accessToken이 있으면 바로 실행
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken, activeTab]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?type=${activeTab}`,
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

  const handleCancelReport = async () => {
    if (!selectedReportId) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/${selectedReportId}/cancel/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '신고 취소에 실패했습니다.');
      }

      const result = await response.json();
      
      // 성공 토스트 표시
      toast.success(result.message || '노쇼 신고가 취소되었습니다. 공구가 판매완료로 처리되었습니다.');
      
      // 목록 새로고침
      fetchReports();
      
      // 다이얼로그 닫기
      setCancelDialogOpen(false);
      setSelectedReportId(null);
    } catch (error) {
      console.error('노쇼 신고 취소 오류:', error);
      toast.error(error instanceof Error ? error.message : '신고 취소 중 오류가 발생했습니다.');
    }
  };

  const openCancelDialog = (report: NoShowReport) => {
    setSelectedReportId(report.id);
    setSelectedReport(report);
    setCancelDialogOpen(true);
  };

  const checkCanEdit = async (reportId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/${reportId}/can_edit/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('수정 가능 여부 확인 실패');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('수정 가능 여부 확인 오류:', error);
      return { can_edit: false, reason: '오류가 발생했습니다.' };
    }
  };

  const openEditDialog = async (report: NoShowReport) => {
    // 수정 가능 여부 확인
    const canEditResult = await checkCanEdit(report.id);
    
    if (!canEditResult.can_edit) {
      toast.error(canEditResult.reason || '수정할 수 없습니다.');
      return;
    }

    setEditingReport(report);
    setEditFormData({
      content: report.content,
      evidence_files: [],
    });
    setEditDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files).slice(0, 3); // 최대 3개 파일
      setEditFormData(prev => ({
        ...prev,
        evidence_files: fileArray,
      }));
    }
  };

  const handleEditSubmit = async () => {
    if (!editingReport) return;

    try {
      const formData = new FormData();
      formData.append('content', editFormData.content);
      
      // 파일 추가
      editFormData.evidence_files.forEach((file, index) => {
        if (index === 0) formData.append('evidence_image', file);
        else if (index === 1) formData.append('evidence_image_2', file);
        else if (index === 2) formData.append('evidence_image_3', file);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/${editingReport.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '수정에 실패했습니다.');
      }

      toast.success('노쇼 신고가 수정되었습니다. (추가 수정은 불가능합니다)');
      
      // 목록 새로고침
      fetchReports();
      
      // 다이얼로그 닫기
      setEditDialogOpen(false);
      setEditingReport(null);
      setEditFormData({ content: '', evidence_files: [] });
    } catch (error) {
      console.error('노쇼 신고 수정 오류:', error);
      toast.error(error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />처리중</Badge>;
      case 'completed':
        return <Badge variant="destructive"><CheckCircle className="w-3 h-3 mr-1" />처리완료</Badge>;
      case 'on_hold':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />보류중</Badge>;
      // 기존 값 호환성
      case 'confirmed':
        return <Badge variant="destructive"><CheckCircle className="w-3 h-3 mr-1" />처리완료</Badge>;
      case 'rejected':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />보류중</Badge>;
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">노쇼 신고 내역</h1>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'made' | 'received')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="made">내가 신고한 내역</TabsTrigger>
            <TabsTrigger value="received">내가 받은 신고</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {activeTab === 'made' ? '신고한 내역이 없습니다.' : '받은 신고가 없습니다.'}
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
                          {activeTab === 'made' && (
                            <p className="text-sm text-gray-600 mt-1">
                              신고 대상: {report.reported_user_name}
                            </p>
                          )}
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
                            {report.report_type === 'buyer_noshow' ? '구매자 노쇼' : '판매자 노쇼'}
                          </p>
                        </div>

                        {/* 내가 신고한 내역만 상세 내용 표시 */}
                        {activeTab === 'made' && (
                          <>
                            <div>
                              <p className="text-sm font-medium text-gray-700">신고 내용</p>
                              <p className="text-sm whitespace-pre-wrap">{report.content}</p>
                            </div>

                            {/* 증빙 파일들 표시 */}
                            {(report.evidence_image || report.evidence_image_2 || report.evidence_image_3) && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">증빙 자료</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {[report.evidence_image, report.evidence_image_2, report.evidence_image_3].map((file, index) => {
                                    if (!file) return null;
                                    
                                    // 이미지 파일인지 확인 (URL 확장자로 판단)
                                    const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(file);
                                    
                                    return (
                                      <div key={index} className="border rounded-lg overflow-hidden">
                                        {isImage ? (
                                          <a 
                                            href={file} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="block"
                                          >
                                            <img 
                                              src={file} 
                                              alt={`증빙 자료 ${index + 1}`}
                                              className="w-full h-24 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                                            />
                                            <p className="text-xs text-center py-1 bg-gray-50">
                                              클릭하여 확대
                                            </p>
                                          </a>
                                        ) : (
                                          <a 
                                            href={file} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center justify-center h-24 hover:bg-gray-50 transition-colors"
                                          >
                                            <FileText className="w-8 h-8 text-gray-400" />
                                            <p className="text-xs text-gray-600 mt-1">
                                              PDF 파일 {index + 1}
                                            </p>
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* 관리자 코멘트 표시 */}
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

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {report.edit_count && report.edit_count > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                수정완료
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {/* 피신고 내역에서 이의제기 버튼 */}
                            {activeTab === 'received' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                onClick={() => router.push(`/noshow-objection/create?report_id=${report.id}`)}
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                이의제기
                              </Button>
                            )}
                            
                            {/* 신고한 내역에서 수정/취소 버튼 */}
                            {activeTab === 'made' && report.status === 'pending' && (
                              <>
                                {(!report.edit_count || report.edit_count < 1) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(report)}
                                  >
                                    <Edit className="w-3 h-3 mr-1" />
                                    수정
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openCancelDialog(report)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  신고 취소
                                </Button>
                              </>
                            )}
                          </div>
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
            onClick={() => router.push('/mypage')}
            variant="outline"
          >
            마이페이지로 돌아가기
          </Button>
        </div>
      </div>

      {/* 신고 취소 확인 다이얼로그 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>노쇼 신고를 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>신고를 취소하면 다음과 같이 처리됩니다:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {user?.role === 'seller' ? (
                  <li>해당 공구가 <strong className="text-red-600">판매완료</strong>로 자동 변경됩니다</li>
                ) : (
                  <li>
                    {selectedReport?.report_type === 'seller_noshow' ? (
                      <>해당 공구에서 <strong className="text-blue-600">구매완료</strong> 처리됩니다</>
                    ) : (
                      <>해당 공구가 <strong className="text-red-600">판매완료</strong>로 자동 변경됩니다</>
                    )}
                  </li>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancelDialogOpen(false);
              setSelectedReportId(null);
              setSelectedReport(null);
            }}>
              돌아가기
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelReport}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {user?.role === 'seller' ? (
                '신고 취소 및 판매완료 처리'
              ) : (
                selectedReport?.report_type === 'seller_noshow' ? 
                  '신고 취소 및 구매완료 처리' : 
                  '신고 취소 및 판매완료 처리'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 신고 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>노쇼 신고 수정</DialogTitle>
            <DialogDescription>
              신고 내용을 수정할 수 있습니다. 수정은 1회만 가능합니다.
            </DialogDescription>
          </DialogHeader>
          
          {editingReport && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>주의:</strong> 수정은 1회만 가능합니다. 신중하게 작성해주세요.
                </p>
                {editingReport.edit_count && editingReport.edit_count > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    이미 {editingReport.edit_count}회 수정하셨습니다.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-content">신고 내용</Label>
                <Textarea
                  id="edit-content"
                  value={editFormData.content}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="노쇼 신고 사유를 상세히 작성해주세요..."
                  rows={8}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-files">증빙 자료 (최대 3개)</Label>
                <Input
                  id="edit-files"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                {editFormData.evidence_files.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    선택된 파일: {editFormData.evidence_files.map(f => f.name).join(', ')}
                  </div>
                )}
                {(editingReport.evidence_image || editingReport.evidence_image_2 || editingReport.evidence_image_3) && (
                  <p className="mt-2 text-sm text-gray-500">
                    기존 파일이 있습니다. 새 파일을 업로드하면 기존 파일이 교체됩니다.
                  </p>
                )}
              </div>
              
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>주의:</strong> 수정은 1회만 가능합니다. 신중하게 작성해주세요.
                </AlertDescription>
              </Alert>

              {editingReport.last_edited_at && (
                <div className="text-sm text-gray-500">
                  마지막 수정: {formatDate(editingReport.last_edited_at)}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingReport(null);
                setEditFormData({ content: '', evidence_files: [] });
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (window.confirm('신고 내용을 수정하시겠습니까?\n주의: 수정은 1회만 가능합니다.')) {
                  handleEditSubmit();
                }
              }}
              disabled={!editFormData.content.trim()}
            >
              수정 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}