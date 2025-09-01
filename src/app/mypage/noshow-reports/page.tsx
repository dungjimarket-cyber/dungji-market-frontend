'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  status: 'pending' | 'confirmed' | 'rejected';
  admin_comment?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export default function NoShowReportsPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'made' | 'received'>('made');

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    fetchReports();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />검토 중</Badge>;
      case 'confirmed':
        return <Badge variant="destructive"><CheckCircle className="w-3 h-3 mr-1" />확인됨</Badge>;
      case 'rejected':
        return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />반려됨</Badge>;
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
                          <p className="text-sm text-gray-600 mt-1">
                            {activeTab === 'made' 
                              ? `신고 대상: ${report.reported_user_name}`
                              : `신고자: ${report.reporter_name}`
                            }
                          </p>
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

                        <div>
                          <p className="text-sm font-medium text-gray-700">신고 내용</p>
                          <p className="text-sm whitespace-pre-wrap">{report.content}</p>
                        </div>

                        {/* 증빙 파일들 표시 */}
                        {(report.evidence_image || report.evidence_image_2 || report.evidence_image_3) && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">증빙 자료</p>
                            <div className="flex gap-2">
                              {report.evidence_image && (
                                <a 
                                  href={report.evidence_image} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  파일 1
                                </a>
                              )}
                              {report.evidence_image_2 && (
                                <a 
                                  href={report.evidence_image_2} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  파일 2
                                </a>
                              )}
                              {report.evidence_image_3 && (
                                <a 
                                  href={report.evidence_image_3} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  <FileText className="w-4 h-4" />
                                  파일 3
                                </a>
                              )}
                            </div>
                          </div>
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
                          <p className="text-xs text-gray-500">
                            신고일: {formatDate(report.created_at)}
                          </p>
                          {report.processed_at && (
                            <p className="text-xs text-gray-500">
                              처리일: {formatDate(report.processed_at)}
                            </p>
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
            onClick={() => router.push('/mypage')}
            variant="outline"
          >
            마이페이지로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}