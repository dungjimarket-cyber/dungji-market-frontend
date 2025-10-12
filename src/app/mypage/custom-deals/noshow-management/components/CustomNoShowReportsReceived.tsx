'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NoShowReport {
  id: number;
  custom_groupbuy_id: number;
  custom_groupbuy_title: string;
  report_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_comment: string | null;
}

export default function CustomNoShowReportsReceived() {
  const { accessToken } = useAuth();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  // 무한 스크롤 observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, nextUrl]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/custom-noshow-reports/?type=received`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          // Paginated response
          setReports(data.results);
          setNextUrl(data.next);
          setHasMore(!!data.next);
        } else {
          // Non-paginated response
          setReports(Array.isArray(data) ? data : []);
          setHasMore(false);
        }
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (error) {
      console.error('신고 내역 조회 실패:', error);
      toast.error('신고 내역을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextUrl || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results) {
          setReports(prev => [...prev, ...data.results]);
          setNextUrl(data.next);
          setHasMore(!!data.next);
        }
      }
    } catch (error) {
      console.error('Error loading more reports:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleExpand = (reportId: number) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">검토중</Badge>;
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200">처리완료</Badge>;
      case 'on_hold':
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">보류</Badge>;
      case 'rejected':
        return <Badge className="bg-red-50 text-red-700 border-red-200">반려</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">받은 노쇼 신고가 없습니다</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {reports.map((report) => {
          const isExpanded = expandedReports.has(report.id);

          return (
            <Card key={report.id} className="border-slate-200">
              <CardContent className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 -m-4 p-4 rounded-lg transition-colors"
                  onClick={() => toggleExpand(report.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(report.status)}
                      <span className="text-xs text-slate-500">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900 truncate">
                      {report.custom_groupbuy_title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {report.report_type === 'buyer_noshow' ? '구매자 노쇼' : '판매자 노쇼'}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* 상세 정보 - 펼쳤을 때만 표시 */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {report.processed_at && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span>처리일: {formatDate(report.processed_at)}</span>
                      </div>
                    )}

                    {report.admin_comment && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-700">
                        <p className="font-semibold mb-1">관리자 코멘트:</p>
                        <p className="whitespace-pre-wrap">{report.admin_comment}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* 무한 스크롤 트리거 */}
        {hasMore && (
          <div ref={observerTarget} className="py-4 text-center">
            {loadingMore && (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                <span className="text-sm text-gray-600">더 불러오는 중...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 더 이상 없음 표시 */}
      {!hasMore && reports.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">모든 신고 내역을 불러왔습니다</p>
        </div>
      )}
    </>
  );
}
