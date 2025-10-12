'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface NoShowReport {
  id: number;
  groupbuy_id: number;
  groupbuy_title: string;
  report_type: 'buyer_noshow' | 'seller_noshow';
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'on_hold';
  admin_comment?: string;
  created_at: string;
  processed_at?: string;
  has_objection?: boolean;
}

export default function NoShowReportsReceived() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<NoShowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set());

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken]);

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
      // 신고 내역과 이의제기 내역을 동시에 조회
      const [reportsResponse, objectionsResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/noshow-reports/?type=received`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )
      ]);

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        let reportsList: any[] = [];

        if (reportsData.results) {
          // Paginated response
          reportsList = reportsData.results;
          setNextUrl(reportsData.next);
          setHasMore(!!reportsData.next);
        } else {
          // Non-paginated response
          reportsList = Array.isArray(reportsData) ? reportsData : [];
          setHasMore(false);
        }

        // 이의제기 데이터 처리
        if (objectionsResponse.ok) {
          const objectionsData = await objectionsResponse.json();
          const objectionsList = Array.isArray(objectionsData) ? objectionsData : objectionsData.results || [];

          // report_id로 이의제기 존재 여부 매핑
          const reportsWithObjection = reportsList.map((report: any) => ({
            ...report,
            has_objection: objectionsList.some((obj: any) => obj.report_id === report.id || obj.noshow_report === report.id)
          }));

          setReports(reportsWithObjection);
        } else {
          // 이의제기 조회 실패 시 신고 내역만 표시
          setReports(reportsList);
        }
      } else {
        console.error('Failed to fetch reports:', reportsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('신고 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!nextUrl || loadingMore) return;

    try {
      setLoadingMore(true);
      const [reportsResponse, objectionsResponse] = await Promise.all([
        fetch(nextUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/noshow-objections/`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        )
      ]);

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        if (reportsData.results) {
          let newReports = reportsData.results;

          // 이의제기 데이터 처리
          if (objectionsResponse.ok) {
            const objectionsData = await objectionsResponse.json();
            const objectionsList = Array.isArray(objectionsData) ? objectionsData : objectionsData.results || [];

            newReports = newReports.map((report: any) => ({
              ...report,
              has_objection: objectionsList.some((obj: any) => obj.report_id === report.id || obj.noshow_report === report.id)
            }));
          }

          setReports(prev => [...prev, ...newReports]);
          setNextUrl(reportsData.next);
          setHasMore(!!reportsData.next);
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
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>처리중</span>
          </Badge>
        );
      case 'completed':
      case 'confirmed':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>처리완료</span>
          </Badge>
        );
      case 'on_hold':
      case 'rejected':
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex whitespace-nowrap">
            <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
            <span>보류중</span>
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
                      {report.groupbuy_title}
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

                    <div className="flex justify-end pt-2 border-t">
                      {report.has_objection ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-gray-500 border-gray-300 bg-gray-50 cursor-not-allowed text-xs px-3 py-1.5"
                          disabled
                        >
                          <MessageSquare className="w-3 h-3" />
                          이의제기 완료
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-3 py-1.5"
                          onClick={() => {
                            router.push(`/noshow-objection/create?report_id=${report.id}`);
                          }}
                        >
                          <MessageSquare className="w-3 h-3" />
                          이의제기
                        </Button>
                      )}
                    </div>
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
