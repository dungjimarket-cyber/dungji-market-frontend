'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, 
  FileText, Calendar, ArrowLeft, Edit, Ban, Shield
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

interface NoShowObjection {
  id: number;
  noshow_report: number;
  noshow_report_id: number;
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
  edit_count: number;
  is_cancelled: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export default function NoShowObjectionsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [objections, setObjections] = useState<NoShowObjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingObjection, setEditingObjection] = useState<NoShowObjection | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedObjection, setSelectedObjection] = useState<NoShowObjection | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (accessToken) {
      fetchObjections();
    }
  }, [accessToken]);

  const fetchObjections = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/`,
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
      toast.error('이의제기 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isCancelled: boolean = false) => {
    if (isCancelled) {
      return <Badge variant="outline"><Ban className="w-3 h-3 mr-1" />취소됨</Badge>;
    }
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />처리중</Badge>;
      case 'processing':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />검토중</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />해결</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />거부</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleEditClick = (objection: NoShowObjection) => {
    setEditingObjection(objection);
    setEditContent(objection.content);
    setEditFiles([]);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingObjection || !editContent.trim()) return;
    
    setProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('content', editContent);
      
      // 파일 추가
      editFiles.forEach((file, index) => {
        formData.append(`evidence_image_${index + 1}`, file);
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/${editingObjection.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('이의제기가 수정되었습니다.');
        fetchObjections();
        setEditDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('이의제기 수정 오류:', error);
      toast.error('수정 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelClick = (objection: NoShowObjection) => {
    setSelectedObjection(objection);
    setCancellationReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!selectedObjection) return;
    
    setProcessing(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/${selectedObjection.id}/cancel/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancellation_reason: cancellationReason,
          }),
        }
      );

      if (response.ok) {
        toast.success('이의제기가 취소되었습니다.');
        fetchObjections();
        setCancelDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || '취소에 실패했습니다.');
      }
    } catch (error) {
      console.error('이의제기 취소 오류:', error);
      toast.error('취소 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">이의제기 내역</h1>

        {objections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">제출한 이의제기가 없습니다.</p>
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
                      <div className="text-xs text-gray-500 mt-2">
                        <p>제출일: {formatDate(objection.created_at)}</p>
                        {objection.processed_at && (
                          <p>처리일: {formatDate(objection.processed_at)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(objection.status, objection.is_cancelled)}
                      {objection.edit_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          수정 {objection.edit_count}회
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">이의제기 내용</p>
                      <p className="text-sm whitespace-pre-wrap mt-1">{objection.content}</p>
                    </div>

                    {/* 증빙 파일들 표시 */}
                    {(objection.evidence_image_1 || objection.evidence_image_2 || objection.evidence_image_3) && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">증빙 자료</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[objection.evidence_image_1, objection.evidence_image_2, objection.evidence_image_3].map((file, index) => {
                            if (!file) return null;
                            
                            // 이미지 파일인지 확인
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
                                      파일 {index + 1}
                                    </p>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 취소 사유 표시 */}
                    {objection.is_cancelled && objection.cancellation_reason && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Ban className="w-4 h-4 text-gray-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">취소 사유</p>
                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                              {objection.cancellation_reason}
                            </p>
                            {objection.cancelled_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                취소일: {formatDate(objection.cancelled_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 관리자 답변 표시 */}
                    {objection.admin_comment && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
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

                    {/* 상태별 안내 메시지 */}
                    {objection.status === 'resolved' && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          이의제기가 인정되었습니다. 관리자가 상황을 검토하여 적절한 조치를 취할 예정입니다.
                        </AlertDescription>
                      </Alert>
                    )}

                    {objection.status === 'rejected' && (
                      <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          이의제기가 거부되었습니다. 원 신고 내용이 유지됩니다.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* 수정/취소 버튼 */}
                    {objection.status === 'pending' && !objection.is_cancelled && (
                      <div className="flex gap-2 pt-3 border-t">
                        {objection.edit_count < 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(objection)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            수정
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(objection)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          취소
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-2">
          <Button
            onClick={() => router.push('/mypage')}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            마이페이지로 돌아가기
          </Button>
          <Button
            onClick={() => router.push('/mypage/noshow-reports')}
            variant="outline"
          >
            노쇼 신고 내역 보기
          </Button>
        </div>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>이의제기 수정</DialogTitle>
            <DialogDescription>
              이의제기는 1회만 수정 가능합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                이의제기 내용
              </label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                placeholder="이의제기 내용을 입력하세요..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                증빙 자료 추가 (선택사항)
              </label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 3) {
                    toast.error('최대 3개의 파일만 첨부 가능합니다.');
                    return;
                  }
                  setEditFiles(files);
                }}
                className="w-full border rounded-lg p-2"
              />
              {editFiles.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {editFiles.length}개 파일 선택됨
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={processing}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (window.confirm('이의제기 내용을 수정하시겠습니까?\n주의: 수정은 1회만 가능합니다.')) {
                  handleEditSubmit();
                }
              }}
              disabled={processing || !editContent.trim()}
            >
              {processing ? '수정 중...' : '수정하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 취소 다이얼로그 */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이의제기 취소</DialogTitle>
            <DialogDescription>
              이의제기를 취소하시겠습니까? 취소 후에는 다시 제출할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              취소 사유 (선택사항)
            </label>
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              placeholder="취소 사유를 입력하세요..."
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={processing}
            >
              돌아가기
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={processing}
            >
              {processing ? '취소 중...' : '이의제기 취소'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}