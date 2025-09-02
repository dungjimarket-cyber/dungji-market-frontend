'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateObjectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuth();
  const reportId = searchParams.get('report_id');
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [reportInfo, setReportInfo] = useState<any>(null);

  useEffect(() => {
    if (!reportId) {
      toast.error('잘못된 접근입니다.');
      router.push('/mypage/noshow-reports');
      return;
    }

    checkEligibility();
  }, [reportId, accessToken]);

  const checkEligibility = async () => {
    if (!accessToken) return;
    
    try {
      // 이의제기 가능 여부 확인
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/check-eligibility/${reportId}/`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEligible(data.eligible);
        setEligibilityMessage(data.reason || data.message || '');
        
        if (!data.eligible && data.existing_objection) {
          // 이미 이의제기가 있으면 상세 페이지로 이동
          router.push('/mypage/noshow-objections');
        }
      } else {
        toast.error('이의제기 가능 여부 확인에 실패했습니다.');
        router.push('/mypage/noshow-reports');
      }

      // 신고 정보 조회
      const reportResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?type=received`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (reportResponse.ok) {
        const reports = await reportResponse.json();
        const report = reports.find((r: any) => r.id === parseInt(reportId!));
        if (report) {
          setReportInfo(report);
        }
      }
    } catch (error) {
      console.error('이의제기 가능 여부 확인 오류:', error);
      toast.error('오류가 발생했습니다.');
      router.push('/mypage/noshow-reports');
    } finally {
      setChecking(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      
      // 최대 3개 파일만 허용
      if (files.length + fileArray.length > 3) {
        toast.error('최대 3개의 파일만 첨부할 수 있습니다.');
        return;
      }
      
      // 파일 크기 체크 (5MB)
      const oversizedFiles = fileArray.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      setFiles([...files, ...fileArray]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('이의제기 내용을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('noshow_report', reportId!);
      formData.append('content', content);
      
      // 파일 추가
      files.forEach((file, index) => {
        formData.append(`evidence_image_${index + 1}`, file);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        toast.success('이의제기가 접수되었습니다.');
        router.push('/mypage/noshow-objections');
      } else {
        const error = await response.json();
        toast.error(error.detail || error.error || '이의제기 제출에 실패했습니다.');
      }
    } catch (error) {
      console.error('이의제기 제출 오류:', error);
      toast.error('이의제기 제출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">확인 중...</div>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {eligibilityMessage || '이의제기를 할 수 없습니다.'}
            </AlertDescription>
          </Alert>
          
          <Button
            className="mt-4"
            onClick={() => router.push('/mypage/noshow-reports')}
          >
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">노쇼 신고 이의제기</h1>

        {reportInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">신고 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>공구:</strong> {reportInfo.groupbuy_title}</p>
                <p><strong>신고 유형:</strong> {reportInfo.report_type === 'buyer_noshow' ? '구매자 노쇼' : '판매자 노쇼'}</p>
                <p><strong>처리 상태:</strong> {
                  reportInfo.status === 'pending' ? '처리중' :
                  reportInfo.status === 'completed' ? '처리완료' : '보류'
                }</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>이의제기 작성</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="content">이의제기 내용 *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="이의제기 사유를 상세히 작성해주세요..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="files">증빙 자료 (최대 3개)</Label>
                <div className="mt-1 space-y-2">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={files.length >= 3}
                  />
                  
                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  이미지 또는 PDF 파일, 각 파일 최대 5MB
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  이의제기는 1회만 가능합니다. 신중하게 작성해주세요.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/mypage/noshow-reports')}
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !content.trim()}
                >
                  {loading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    '이의제기 제출'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}