'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, FileText, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { Alert } from '@/components/ui/alert';

interface NoShowObjection {
  id: number;
  report_id: number;
  groupbuy_title: string;
  content: string;
  status: 'pending' | 'accepted' | 'rejected';
  admin_response?: string;
  created_at: string;
  processed_at?: string;
  attachments?: string[];
  evidence_image_1?: string;
  evidence_image_2?: string;
  evidence_image_3?: string;
  edit_count?: number;
}

export default function NoShowObjections() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [objections, setObjections] = useState<NoShowObjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingObjection, setEditingObjection] = useState<NoShowObjection | null>(null);
  const [editFormData, setEditFormData] = useState<{
    content: string;
    evidence_files: (File | null)[];
  }>({
    content: '',
    evidence_files: [null, null, null],
  });

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
            'Authorization': `Bearer ${accessToken}`
          }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>검토중</span>
          </Badge>
        );
      case 'accepted':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>승인됨</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>반려됨</span>
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

  const handleFileChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData(prev => {
        const newFiles = [...prev.evidence_files];
        newFiles[index] = file;
        return { ...prev, evidence_files: newFiles };
      });
    }
  };

  const removeFile = (index: number) => {
    setEditFormData(prev => {
      const newFiles = [...prev.evidence_files];
      newFiles[index] = null;
      return { ...prev, evidence_files: newFiles };
    });
  };

  const openEditDialog = (objection: NoShowObjection) => {
    // pending 상태이고 수정 횟수가 0인 경우만 수정 가능
    if (objection.status !== 'pending' || (objection.edit_count && objection.edit_count >= 1)) {
      toast.error('이의제기 수정은 처리중 상태에서 1회만 가능합니다.');
      return;
    }

    setEditingObjection(objection);
    setEditFormData({
      content: objection.content,
      evidence_files: [null, null, null],
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingObjection || !editFormData.content.trim()) return;

    const formData = new FormData();
    formData.append('content', editFormData.content.trim());

    // 새 파일들 추가
    editFormData.evidence_files.forEach((file, index) => {
      if (file) {
        formData.append(`evidence_image_${index + 1}`, file);
      }
    });

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/${editingObjection.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData
        }
      );

      if (response.ok) {
        toast.success('이의제기가 수정되었습니다.');
        fetchObjections();
        setEditDialogOpen(false);
        setEditingObjection(null);
        setEditFormData({ content: '', evidence_files: [null, null, null] });
      } else {
        const error = await response.json();
        toast.error(error.error || '수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('이의제기 수정 오류:', error);
      toast.error('수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (objections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">이의제기 내역이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {objections.map((objection) => (
        <Card key={objection.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{objection.groupbuy_title}</CardTitle>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <p>제기일: {formatDate(objection.created_at)}</p>
                  {objection.processed_at && (
                    <p>처리일: {formatDate(objection.processed_at)}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(objection.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">이의제기 내용</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{objection.content}</p>
              </div>

              {/* 증빙 파일들 표시 */}
              {(objection.evidence_image_1 || objection.evidence_image_2 || objection.evidence_image_3) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">증빙 자료</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[objection.evidence_image_1, objection.evidence_image_2, objection.evidence_image_3].map((file, index) => {
                      if (!file) return null;
                      const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(file);

                      return (
                        <div key={index} className="border rounded-lg overflow-hidden">
                          {isImage ? (
                            <a href={file} target="_blank" rel="noopener noreferrer" className="block">
                              <img
                                src={file}
                                alt={`증빙 자료 ${index + 1}`}
                                className="w-full h-24 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                              />
                              <p className="text-xs text-center py-1 bg-gray-50">클릭하여 확대</p>
                            </a>
                          ) : (
                            <a href={file} target="_blank" rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center h-24 hover:bg-gray-50 transition-colors">
                              <FileText className="w-8 h-8 text-gray-400" />
                              <p className="text-xs text-gray-600 mt-1">파일 {index + 1}</p>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {objection.admin_response && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">관리자 답변</p>
                      <p className="text-sm text-blue-700 mt-1 whitespace-pre-wrap">
                        {objection.admin_response}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 수정 버튼 - pending 상태이고 수정 횟수가 0인 경우만 표시 */}
              {objection.status === 'pending' && (!objection.edit_count || objection.edit_count < 1) && (
                <div className="flex justify-end pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(objection)}
                    className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-3 py-1.5"
                  >
                    <Edit className="w-3 h-3" />
                    수정하기
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 수정 모달 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
          className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>이의제기 수정</DialogTitle>
            <DialogDescription>
              수정은 1회만 가능합니다. 신중한 작성 부탁드립니다.
            </DialogDescription>
          </DialogHeader>

          {editingObjection && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-content">이의제기 내용</Label>
                <Textarea
                  id="edit-content"
                  value={editFormData.content}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="이의제기 사유를 상세히 작성해주세요..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-files">증빙 자료 (최대 3개)</Label>

                {/* 기존 첨부 파일 미리보기 */}
                {(editingObjection.evidence_image_1 || editingObjection.evidence_image_2 || editingObjection.evidence_image_3) && (
                  <div className="mt-2 mb-3">
                    <p className="text-sm text-gray-600 mb-2">기존 첨부 파일:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[editingObjection.evidence_image_1, editingObjection.evidence_image_2, editingObjection.evidence_image_3].map((file, index) => {
                        if (!file) return null;
                        const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(file);

                        return (
                          <div key={index} className="border rounded-lg overflow-hidden bg-gray-50">
                            {isImage ? (
                              <a href={file} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={file}
                                  alt={`기존 증빙 자료 ${index + 1}`}
                                  className="w-full h-20 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                                />
                                <p className="text-xs text-center py-1 bg-gray-100">파일 {index + 1}</p>
                              </a>
                            ) : (
                              <a href={file} target="_blank" rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center h-20 hover:bg-gray-100 transition-colors">
                                <FileText className="w-6 h-6 text-gray-400" />
                                <p className="text-xs text-gray-600 mt-1">파일 {index + 1}</p>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">※ 새 파일을 업로드하면 기존 파일이 대체됩니다.</p>
                  </div>
                )}

                {/* 새 파일 선택 - 개별 슬롯 */}
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">새 파일 선택:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">파일 {index + 1}</span>
                        {editFormData.evidence_files[index] ? (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm text-gray-700">{editFormData.evidence_files[index]!.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-6 px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex-1">
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFileChange(index)}
                              className="text-sm"
                            />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">※ JPG, PNG, PDF 파일만 업로드 가능합니다.</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingObjection(null);
              setEditFormData({ content: '', evidence_files: [null, null, null] });
            }}>
              취소
            </Button>
            <Button onClick={async () => {
              if (window.confirm('이의제기를 수정하시겠습니까?\n주의: 수정은 1회만 가능합니다.')) {
                await handleEditSubmit();
              }
            }} disabled={!editFormData.content.trim()}>
              수정 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}