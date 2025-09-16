'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';

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
}

export default function NoShowObjections() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [objections, setObjections] = useState<NoShowObjection[]>([]);
  const [loading, setLoading] = useState(true);

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

              {objection.attachments && objection.attachments.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">첨부파일</p>
                  <div className="flex flex-wrap gap-2">
                    {objection.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        파일 {index + 1}
                      </a>
                    ))}
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}